import { hasFirebase } from './firebase';
import { createLocalStore } from './localStore';
import { createFirebaseStore } from './firebaseStore';
import { sendEmail } from './email';
import type { Store } from './store';
import type { Pledge } from './types';
import { formatDate } from './logic';

const base: Store = hasFirebase ? createFirebaseStore() : createLocalStore();

/** Asks the server function to push a notification (Firebase mode only). Never blocks the user's action. */
type PushEvent = { type: 'pledge.created' | 'pledge.accepted' | 'pledge.declined' | 'pledge.cancelled' | 'pledge.received'; pledgeId: string } | { type: 'home.registered' | 'home.reviewed'; homeId: string };
async function push(ev: PushEvent) {
  if (!hasFirebase) return;
  try {
    const { getAuth } = await import('firebase/auth');
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) return;
    await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(ev) });
  } catch (e) {
    console.warn('Push request failed (action still saved):', e);
  }
}

const dropText = (p: Pledge) => `${formatDate(p.dropoffDate, { weekday: 'long', day: 'numeric', month: 'long' })}`;

/** The app talks to this: the chosen backend plus the notifications from Spec §9. */
export const api: Store = {
  ...base,
  async registerHome(user, data) {
    const id = await base.registerHome(user, data);
    void push({ type: 'home.registered', homeId: id });
    return id;
  },
  async reviewHome(id, approve) {
    await base.reviewHome(id, approve);
    void push({ type: 'home.reviewed', homeId: id });
  },
  async createPledge(user, input) {
    const p = await base.createPledge(user, input);
    const home = await base.getHome(p.homeId);
    void sendEmail(p.donorEmail, `Your CareBridge pledge ${p.pledgeNo}`,
      `Thank you! You pledged ${p.itemName} × ${p.quantity} to ${p.homeName}.\nPlanned drop-off: ${dropText(p)}.\nDrop-off address: ${home?.address ?? ''} (${home?.dropoffHours ?? ''}).\nStatus: Pending – the home will review it soon.`);
    void sendEmail(home?.notifyEmail, `New pledge: ${p.itemName} × ${p.quantity}`,
      `${p.contactName} (${p.contactPhone}) pledged ${p.itemName} × ${p.quantity}, planned drop-off ${dropText(p)}.\nPledge no. ${p.pledgeNo}. Open CareBridge to accept or decline.`);
    void push({ type: 'pledge.created', pledgeId: p.id });
    return p;
  },
  async setPledgeStatus(id, status) {
    const p = await base.setPledgeStatus(id, status);
    if (status === 'Accepted') {
      const home = await base.getHome(p.homeId);
      void sendEmail(p.donorEmail, 'Pledge accepted – drop-off details',
        `${p.homeName} accepted your pledge ${p.pledgeNo} (${p.itemName} × ${p.quantity}).\nPlease drop it off on ${dropText(p)} at ${home?.address ?? ''}, ${home?.dropoffHours ?? ''}.`);
      void push({ type: 'pledge.accepted', pledgeId: id });
    } else if (status === 'Declined') {
      void sendEmail(p.donorEmail, 'Pledge declined', `${p.homeName} could not accept pledge ${p.pledgeNo} (${p.itemName} × ${p.quantity}). Please check their wishlist for other needs.`);
      void push({ type: 'pledge.declined', pledgeId: id });
    } else {
      void push({ type: 'pledge.cancelled', pledgeId: id });
    }
    return p;
  },
  async markReceived(id, delivered) {
    const p = await base.markReceived(id, delivered);
    void sendEmail(p.donorEmail, 'Thank you – your donation was received',
      `${p.homeName} received ${p.itemName} × ${delivered} from you (pledge ${p.pledgeNo}). Thank you for giving what was needed!`);
    void push({ type: 'pledge.received', pledgeId: id });
    return p;
  },
};
