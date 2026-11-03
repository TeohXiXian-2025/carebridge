/**
 * Vercel serverless function: sends CareBridge notifications as
 *   1. app (push) notifications through Firebase Cloud Messaging, and
 *   2. emails through any SMTP mailbox (e.g. a Gmail account with an App Password).
 * Replaces Cloud Functions, which Firebase's free Spark plan doesn't include.
 *
 * Vercel environment variables (Settings → Environment Variables), all server-only secrets:
 *   FIREBASE_SERVICE_ACCOUNT  full JSON of a Firebase service account key   (needed for both)
 *   SMTP_USER                 mailbox that sends the emails, e.g. carebridge.noreply@gmail.com
 *   SMTP_PASS                 its App Password (Google Account → Security → App passwords)
 *   SMTP_HOST / SMTP_PORT     optional, default smtp.gmail.com / 465
 *
 * The caller must be signed in, and only the people involved in the named pledge or home are
 * notified, so the endpoint can't be used to message anyone else.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import nodemailer from 'nodemailer';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type Res = { status(code: number): Res; json(body: unknown): void };
type Note = { to: string[]; title: string; body: string; path: string; email?: { subject: string; lines: string[] }; toEmail?: string };

function admin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
    const sa = JSON.parse(raw.trim());
    // Pasting into dashboards sometimes turns the key's line breaks into the text "\\n".
    if (typeof sa.private_key === 'string') sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    initializeApp({ credential: cert(sa) });
  }
  return { auth: getAuth(), db: getFirestore(), messaging: getMessaging() };
}

const mailer = process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
function emailHtml(lines: string[], link: string, button: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1F2A2E">
  <div style="font-size:22px;font-weight:800;color:#0E7C6B;margin:16px 0">Care<span style="color:#E8833A">Bridge</span></div>
  ${lines.map((l) => `<p style="font-size:15px;line-height:1.5;margin:0 0 12px">${esc(l)}</p>`).join('')}
  <p style="margin:20px 0"><a href="${link}" style="background:#0E7C6B;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">${esc(button)}</a></p>
  <p style="font-size:12px;color:#6B7780">Give what is needed, not what is guessed.</p></div>`;
}
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' });

async function main(req: Req, res: Res) {
  // GET = self-test. Shows only whether each part works (never the secrets).
  if (req.method === 'GET') {
    const out: Record<string, unknown> = { serviceAccountSet: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT), emailConfigured: Boolean(mailer) };
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
      out.serviceAccountProject = sa.project_id ?? null;
      out.privateKeyLooksOk = typeof sa.private_key === 'string' && sa.private_key.includes('BEGIN PRIVATE KEY') && sa.private_key.includes('END PRIVATE KEY');
    } catch (e) {
      out.serviceAccountJson = `not valid JSON: ${(e as Error).message}`;
    }
    try {
      const a = admin();
      await a.db.collection('users').limit(1).get();
      out.firestore = 'ok';
      await a.messaging.send({ token: 'self-test-invalid-token', notification: { title: 't' } }, true).catch((e: { code?: string; message?: string }) => {
        // An "invalid token" answer means FCM itself is reachable and the key works.
        out.messaging = /registration-token|invalid-argument/i.test(String(e?.code ?? '') + (e?.message ?? '')) ? 'ok' : `${e?.code ?? ''} ${e?.message ?? ''}`.trim();
      });
    } catch (e) {
      out.firestore = `failed: ${(e as Error).message}`;
    }
    if (mailer) {
      try {
        await mailer.verify();
        out.email = 'ok';
      } catch (e) {
        out.email = `failed: ${(e as Error).message}`;
      }
    }
    return res.status(200).json(out);
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let a: ReturnType<typeof admin>;
  try {
    a = admin();
  } catch (e) {
    return res.status(503).json({ error: (e as Error).message });
  }
  const header = String(req.headers.authorization ?? '');
  let caller: string;
  try {
    caller = (await a.auth.verifyIdToken(header.replace(/^Bearer /, ''))).uid;
  } catch {
    return res.status(401).json({ error: 'Not signed in' });
  }
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '');
  const appUrl = process.env.APP_URL || `https://${host}`;
  const ev = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { type: string; pledgeId?: string; homeId?: string; email?: string };
  const notes: Note[] = [];
  const me = (await a.db.doc(`users/${caller}`).get()).data() ?? {};
  /** A home can have several managers; all of them are notified. */
  const managers = async (homeId: string) =>
    (await a.db.collection('users').where('role', '==', 'homeAdmin').where('homeId', '==', homeId).get()).docs.map((d) => d.id);

  if (ev.pledgeId) {
    const snap = await a.db.doc(`pledges/${ev.pledgeId}`).get();
    if (!snap.exists) return res.status(404).json({ error: 'Pledge not found' });
    const p = snap.data()!;
    const isManager = me.role === 'homeAdmin' && me.homeId === p.homeId;
    if (caller !== p.donorId && !isManager) return res.status(403).json({ error: 'Not your pledge' });
    const homeTeam = await managers(p.homeId);
    const home = (await a.db.doc(`homes/${p.homeId}`).get()).data() ?? {};
    const what = `${p.itemName} × ${p.quantity}`;
    const where = `${home.address ?? ''} (${home.dropoffHours ?? ''})`;
    if (ev.type === 'pledge.created' && p.status === 'Pending') {
      notes.push({ to: homeTeam, title: 'New pledge', body: `${p.contactName} pledged ${what}`, path: '/admin/pledges',
        email: { subject: `New pledge: ${what}`, lines: [`${p.contactName} (${p.contactPhone}) pledged ${what} to ${p.homeName}.`, `Planned drop-off: ${fmtDate(p.dropoffDate)}. Pledge no. ${p.pledgeNo}.`, 'Open CareBridge to accept or decline it.'] } });
      notes.push({ to: [p.donorId], title: 'Pledge sent', body: `${p.homeName} will review your pledge of ${what}.`, path: '/my-pledges',
        email: { subject: `Your CareBridge pledge ${p.pledgeNo}`, lines: [`Thank you! You pledged ${what} to ${p.homeName}.`, `Planned drop-off: ${fmtDate(p.dropoffDate)} at ${where}.`, 'Status: Pending. We will let you know when the home accepts it.'] } });
    }
    if (ev.type === 'pledge.cancelled' && p.status === 'Cancelled')
      notes.push({ to: homeTeam, title: 'Pledge cancelled', body: `${p.contactName} cancelled ${what}`, path: '/admin/pledges',
        email: { subject: `Pledge cancelled: ${what}`, lines: [`${p.contactName} cancelled pledge ${p.pledgeNo} (${what}). The quantity is open for other donors again.`] } });
    if (ev.type === 'pledge.accepted' && p.status === 'Accepted')
      notes.push({ to: [p.donorId], title: 'Pledge accepted', body: `${p.homeName} accepted ${what}. See you at drop-off!`, path: '/my-pledges',
        email: { subject: 'Pledge accepted – drop-off details', lines: [`${p.homeName} accepted your pledge ${p.pledgeNo} (${what}).`, `Please drop it off on ${fmtDate(p.dropoffDate)} at ${where}.`] } });
    if (ev.type === 'pledge.declined' && p.status === 'Declined')
      notes.push({ to: [p.donorId], title: 'Pledge declined', body: `${p.homeName} could not accept ${what}.`, path: '/my-pledges',
        email: { subject: 'Pledge declined', lines: [`${p.homeName} could not accept pledge ${p.pledgeNo} (${what}).`, 'Please check their wishlist or other homes for current needs.'] } });
    if (ev.type === 'pledge.received' && p.status === 'Received')
      notes.push({ to: [p.donorId], title: 'Donation received – thank you!', body: `${p.homeName} received ${p.itemName} × ${p.qtyReceived}.`, path: '/my-pledges',
        email: { subject: 'Thank you – your donation was received', lines: [`${p.homeName} received ${p.itemName} × ${p.qtyReceived} from you (pledge ${p.pledgeNo}).`, 'Thank you for giving what was needed!'] } });
  } else if (ev.homeId) {
    const snap = await a.db.doc(`homes/${ev.homeId}`).get();
    if (!snap.exists) return res.status(404).json({ error: 'Home not found' });
    const h = snap.data()!;
    const managesIt = caller === h.adminId || (me.role === 'homeAdmin' && me.homeId === ev.homeId);
    if (ev.type === 'home.registered' && managesIt && h.status === 'Pending') {
      const again = Boolean(h.resubmittedAt);
      const admins = await a.db.collection('users').where('role', '==', 'platformAdmin').get();
      notes.push({ to: admins.docs.map((d) => d.id), title: again ? 'Home asks for review again' : 'New home to review', body: `${h.name} (${h.area}) ${again ? 'updated its details' : 'registered'}`, path: '/platform',
        email: { subject: `${again ? 'Review again' : 'New home to review'}: ${h.name}`, lines: [`${h.name} (${h.type}, ${h.area}) ${again ? 'updated its details after being rejected and asks for review again' : 'registered on CareBridge and is waiting for approval'}.`] } });
    }
    if (ev.type === 'home.reviewed' && h.status !== 'Pending') {
      if (me.role === 'platformAdmin') {
        const ok = h.status === 'Approved';
        const why = h.reviewNote ? `Reason: ${h.reviewNote}` : 'Please contact the CareBridge team for details.';
        notes.push({ to: await managers(ev.homeId), title: ok ? 'Your home is approved 🎉' : 'Registration not approved', body: ok ? `${h.name} is now visible to donors.` : `${h.name} was not approved. ${h.reviewNote ?? ''}`.trim(), path: '/admin',
          email: { subject: ok ? `${h.name} is approved on CareBridge` : 'CareBridge registration not approved', lines: ok ? [`Good news! ${h.name} is now visible to donors.`, 'Add or update your wishlist so donors know what you need.'] : [`${h.name} was not approved.`, why, 'You can update your details and ask for review again from your CareBridge dashboard.'] } });
      }
    }
  }

  if (ev.type === 'invite.created' && ev.email) {
    const inv = (await a.db.doc(`invites/${ev.email}`).get()).data();
    if (inv && inv.invitedBy === caller) {
      const what = inv.role === 'platformAdmin' ? 'a CareBridge platform admin' : `a manager of ${inv.homeName} on CareBridge`;
      notes.push({ to: [], toEmail: ev.email, title: '', body: '', path: inv.role === 'platformAdmin' ? '/platform' : '/admin',
        email: { subject: `You're invited to be ${what}`, lines: [`${inv.invitedByName} added you as ${what}.`, `Sign in with Google using this email address (${ev.email}). If you use email and password instead, confirm your email first using the link we sent when you signed up.`] } });
    }
  }

  let pushed = 0;
  let emailed = 0;
  for (const n of notes) {
    if (n.toEmail && mailer && n.email) {
      const link = `${appUrl}/login`;
      try {
        await mailer.sendMail({ from: `CareBridge <${process.env.SMTP_USER}>`, to: n.toEmail, subject: n.email.subject, text: `${n.email.lines.join('\n\n')}\n\n${link}`, html: emailHtml(n.email.lines, link, 'Sign in to CareBridge') });
        emailed++;
      } catch (e) {
        console.error('email failed', e);
      }
    }
    for (const uid of n.to) {
      const u = await a.db.doc(`users/${uid}`).get();
      const data = u.data() ?? {};
      const link = `${appUrl}${n.path}`;
      const tokens: string[] = data.fcmTokens ?? [];
      if (tokens.length) {
        const r = await a.messaging.sendEachForMulticast({ tokens, notification: { title: n.title, body: n.body }, data: { url: n.path }, webpush: { fcmOptions: { link } } });
        pushed += r.successCount;
        const dead = tokens.filter((_, i) => /not-registered|invalid-registration-token/.test(r.responses[i].error?.code ?? ''));
        if (dead.length) await u.ref.update({ fcmTokens: FieldValue.arrayRemove(...dead) });
      }
      if (mailer && n.email && data.email && data.emailNotifications !== false) {
        try {
          await mailer.sendMail({ from: `CareBridge <${process.env.SMTP_USER}>`, to: data.email, subject: n.email.subject, text: `${n.email.lines.join('\n\n')}\n\n${link}`, html: emailHtml(n.email.lines, link, 'Open CareBridge') });
          emailed++;
        } catch (e) {
          console.error('email failed', e);
        }
      }
    }
  }
  return res.status(200).json({ ok: true, pushed, emailed });
}

export default async function handler(req: Req, res: Res) {
  try {
    return await main(req, res);
  } catch (e) {
    console.error('notify failed', e);
    return res.status(500).json({ error: (e as Error)?.message ?? String(e) });
  }
}
