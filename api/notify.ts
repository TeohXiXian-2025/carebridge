/**
 * Vercel serverless function: sends push notifications through Firebase Cloud Messaging.
 * Replaces Cloud Functions (not available on Firebase's free Spark plan).
 *
 * Needs one Vercel environment variable, set by the project owner in Vercel → Settings:
 *   FIREBASE_SERVICE_ACCOUNT = the full JSON of a Firebase service account key
 *
 * The caller must be signed in. The function only notifies the people involved in the
 * pledge or home named in the request, so it cannot be used to spam other users.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type Res = { status(code: number): Res; json(body: unknown): void };

function admin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return { auth: getAuth(), db: getFirestore(), messaging: getMessaging() };
}

type Msg = { to: string[]; title: string; body: string; url: string };

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let a: ReturnType<typeof admin>;
  try {
    a = admin();
  } catch (e) {
    return res.status(503).json({ error: (e as Error).message });
  }
  const header = String(req.headers.authorization ?? '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  let caller: string;
  try {
    caller = (await a.auth.verifyIdToken(token)).uid;
  } catch {
    return res.status(401).json({ error: 'Not signed in' });
  }

  const ev = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { type: string; pledgeId?: string; homeId?: string };
  const msgs: Msg[] = [];

  if (ev.pledgeId) {
    const snap = await a.db.doc(`pledges/${ev.pledgeId}`).get();
    if (!snap.exists) return res.status(404).json({ error: 'Pledge not found' });
    const p = snap.data()!;
    const involved = caller === p.donorId || caller === p.homeAdminId;
    if (!involved) return res.status(403).json({ error: 'Not your pledge' });
    const what = `${p.itemName} × ${p.quantity}`;
    if (ev.type === 'pledge.created' && p.status === 'Pending')
      msgs.push({ to: [p.homeAdminId], title: 'New pledge', body: `${p.contactName} pledged ${what}`, url: '/admin/pledges' });
    if (ev.type === 'pledge.cancelled' && p.status === 'Cancelled')
      msgs.push({ to: [p.homeAdminId], title: 'Pledge cancelled', body: `${p.contactName} cancelled ${what}`, url: '/admin/pledges' });
    if (ev.type === 'pledge.accepted' && p.status === 'Accepted')
      msgs.push({ to: [p.donorId], title: 'Pledge accepted', body: `${p.homeName} accepted ${what}. See you at drop-off!`, url: '/my-pledges' });
    if (ev.type === 'pledge.declined' && p.status === 'Declined')
      msgs.push({ to: [p.donorId], title: 'Pledge declined', body: `${p.homeName} could not accept ${what}.`, url: '/my-pledges' });
    if (ev.type === 'pledge.received' && p.status === 'Received')
      msgs.push({ to: [p.donorId], title: 'Donation received – thank you!', body: `${p.homeName} received ${p.itemName} × ${p.qtyReceived}.`, url: '/my-pledges' });
  } else if (ev.homeId) {
    const snap = await a.db.doc(`homes/${ev.homeId}`).get();
    if (!snap.exists) return res.status(404).json({ error: 'Home not found' });
    const h = snap.data()!;
    if (ev.type === 'home.registered' && caller === h.adminId && h.status === 'Pending') {
      const admins = await a.db.collection('users').where('role', '==', 'platformAdmin').get();
      msgs.push({ to: admins.docs.map((d) => d.id), title: 'New home to review', body: `${h.name} (${h.area}) registered`, url: '/platform' });
    }
    if (ev.type === 'home.reviewed' && h.status !== 'Pending') {
      const me = await a.db.doc(`users/${caller}`).get();
      if (me.data()?.role === 'platformAdmin')
        msgs.push({ to: [h.adminId], title: h.status === 'Approved' ? 'Your home is approved 🎉' : 'Registration not approved', body: h.status === 'Approved' ? `${h.name} is now visible to donors. Add your wishlist!` : `${h.name} was not approved. Contact the CareBridge team.`, url: '/admin' });
    }
  }

  let sent = 0;
  for (const m of msgs) {
    for (const uid of m.to) {
      const u = await a.db.doc(`users/${uid}`).get();
      const tokens: string[] = u.data()?.fcmTokens ?? [];
      if (!tokens.length) continue;
      const r = await a.messaging.sendEachForMulticast({ tokens, notification: { title: m.title, body: m.body }, data: { url: m.url }, webpush: { fcmOptions: { link: m.url } } });
      sent += r.successCount;
      const dead = tokens.filter((_, i) => {
        const code = r.responses[i].error?.code ?? '';
        return code.includes('registration-token-not-registered') || code.includes('invalid-registration-token');
      });
      if (dead.length) {
        const { FieldValue } = await import('firebase-admin/firestore');
        await u.ref.update({ fcmTokens: FieldValue.arrayRemove(...dead) });
      }
    }
  }
  return res.status(200).json({ ok: true, sent });
}
