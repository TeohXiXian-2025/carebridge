import { hasFirebase } from './firebase';
import { createLocalStore } from './localStore';
import { createFirebaseStore } from './firebaseStore';
import type { Store } from './store';

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

/** The app talks to this: the chosen backend, plus a call to the notification server (app + email) after each event in Spec §9. */
export const api: Store = {
  ...base,
  async registerHome(user, data) {
    const id = await base.registerHome(user, data);
    void notify({ type: 'home.registered', homeId: id });
    return id;
  },
  async reviewHome(id, approve) {
    await base.reviewHome(id, approve);
    void notify({ type: 'home.reviewed', homeId: id });
  },
  async createPledge(user, input) {
    const p = await base.createPledge(user, input);
    void notify({ type: 'pledge.created', pledgeId: p.id });
    return p;
  },
  async setPledgeStatus(id, status) {
    const p = await base.setPledgeStatus(id, status);
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
    void notify({ type: 'pledge.received', pledgeId: id });
    return p;
  },
};
