import { hasFirebase } from './firebase';
import { createLocalStore } from './localStore';
import { createFirebaseStore } from './firebaseStore';
import type { Store } from './store';
import type { NewNotification, Pledge, UserProfile } from './types';

const base: Store = hasFirebase ? createFirebaseStore() : createLocalStore();

/** Asks the server function to send the app + email notification (Firebase mode only). Never blocks the user's action. */
type PushEvent =
  | { type: 'pledge.created' | 'pledge.accepted' | 'pledge.declined' | 'pledge.cancelled' | 'pledge.received'; pledgeId: string }
  | { type: 'home.registered' | 'home.reviewed'; homeId: string }
  | { type: 'invite.created'; email: string };
async function notify(ev: PushEvent) {
  if (!hasFirebase) return;
  try {
    const { getAuth } = await import('firebase/auth');
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) return;
    await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(ev) });
  } catch (e) {
    console.warn('Notification request failed (action still saved):', e);
  }
}

/** Who is signed in (kept in step with onAuth) – the sender of in-app notifications. */
let me: UserProfile | null = null;
/** In-app notification (bell). Saved by the person doing the action, so it works without the server. */
function inApp(n: Partial<NewNotification> & Pick<NewNotification, 'title' | 'body' | 'path'>) {
  if (!me) return;
  void base.addNotification(me, { toUser: null, toHome: null, toRole: null, pledgeId: null, homeId: null, ...n });
}
const what = (p: Pledge, qty = p.quantity) => `${p.itemName} × ${qty}`;

/** The app talks to this: the chosen backend, plus the notifications in Spec §9 after each event:
 *  in-app (bell, saved here) and app push + email (sent by the server function). */
export const api: Store = {
  ...base,
  onAuth(cb) {
    return base.onAuth((u, problem) => {
      me = u;
      cb(u, problem);
    });
  },
  async registerHome(user, data) {
    const id = await base.registerHome(user, data);
    me = { ...user, role: 'homeAdmin', homeId: id };
    inApp({ toRole: 'platformAdmin', homeId: id, title: 'New home to review', body: `${data.name} (${data.area}) registered`, path: '/platform' });
    void notify({ type: 'home.registered', homeId: id });
    return id;
  },
  async setHomeStatus(id, status, note) {
    await base.setHomeStatus(id, status, note);
    if (status === 'Pending') return;
    const h = await base.getHome(id);
    inApp({ toHome: id, title: status === 'Approved' ? 'Your home is approved' : 'Registration not approved', body: status === 'Approved' ? `${h?.name ?? 'Your home'} is now visible to donors.` : note?.trim() ? `Reason: ${note.trim()}` : 'Update your details and ask for review again.', path: '/admin' });
    void notify({ type: 'home.reviewed', homeId: id });
  },
  async resubmitHome(id) {
    await base.resubmitHome(id);
    const h = await base.getHome(id);
    inApp({ toRole: 'platformAdmin', homeId: id, title: 'Home asks for review again', body: `${h?.name ?? 'A home'} updated its details`, path: '/platform' });
    void notify({ type: 'home.registered', homeId: id });
  },
  async createPledge(user, input) {
    const p = await base.createPledge(user, input);
    inApp({ toHome: p.homeId, pledgeId: p.id, title: 'New pledge', body: `${p.contactName} pledged ${what(p)}`, path: '/admin/pledges' });
    void notify({ type: 'pledge.created', pledgeId: p.id });
    return p;
  },
  async setPledgeStatus(id, status) {
    const p = await base.setPledgeStatus(id, status);
    if (status === 'Cancelled') inApp({ toHome: p.homeId, pledgeId: id, title: 'Pledge cancelled', body: `${p.contactName} cancelled ${what(p)}`, path: '/admin/pledges' });
    else inApp({ toUser: p.donorId, pledgeId: id, title: status === 'Accepted' ? 'Pledge accepted' : 'Pledge declined', body: status === 'Accepted' ? `${p.homeName} accepted ${what(p)}. See you at drop-off!` : `${p.homeName} could not accept ${what(p)}.`, path: '/my-pledges' });
    void notify({ type: status === 'Accepted' ? 'pledge.accepted' : status === 'Declined' ? 'pledge.declined' : 'pledge.cancelled', pledgeId: id });
    return p;
  },
  async invite(by, email, role, home) {
    const r = await base.invite(by, email, role, home);
    void notify({ type: 'invite.created', email: email.trim().toLowerCase() });
    return r;
  },
  async markReceived(id, delivered) {
    const p = await base.markReceived(id, delivered);
    inApp({ toUser: p.donorId, pledgeId: id, title: 'Thank you – donation received!', body: `${p.homeName} received ${what(p, delivered)} from you.`, path: '/my-pledges' });
    void notify({ type: 'pledge.received', pledgeId: id });
    return p;
  },
};
