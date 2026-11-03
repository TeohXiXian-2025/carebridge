import {
  createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect,
  signOut as fbSignOut, type User,
} from 'firebase/auth';
import {
  arrayUnion, collection, doc, getCountFromServer, getDoc, getDocs, getFirestore, query, runTransaction, setDoc, updateDoc, where, writeBatch,
  type DocumentData, type QueryConstraint,
} from 'firebase/firestore';
import { firebaseApp } from './firebase';
import { applyPledge, applyReceived, applyRelease, bump, UserError, type Store } from './store';
import { calcStatus, canPledge, makePledgeNo, stillNeeded } from './logic';
import { isPlatformAdminEmail } from './admins';
import type { Home, Pledge, UserProfile, WishlistItem } from './types';

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'That email address looks wrong.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/unauthorized-domain': 'Google sign-in is not allowed on this website yet. Add this domain in Firebase → Authentication → Settings → Authorized domains.',
  'auth/account-exists-with-different-credential': 'This email already has an account. Log in with email and password instead.',
};
const friendly = (e: unknown) => {
  const code = (e as { code?: string })?.code ?? '';
  return new UserError(AUTH_ERRORS[code] ?? (e as Error)?.message ?? 'Something went wrong.');
};

export function createFirebaseStore(): Store {
  const app = firebaseApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const col = (name: string) => collection(db, name);
  const withId = <T,>(d: { id: string; data(): DocumentData | undefined }) => ({ id: d.id, ...(d.data() as object) }) as T;
  const list = async <T,>(name: string, ...c: QueryConstraint[]) => (await getDocs(query(col(name), ...c))).docs.map((d) => withId<T>(d));
  const one = async <T,>(name: string, id: string) => {
    try {
      const s = await getDoc(doc(db, name, id));
      return s.exists() ? withId<T>(s) : null;
    } catch {
      return null; // not allowed by security rules → treat as not found
    }
  };
  /** Details typed on the sign-up form, used when the profile is first created. */
  let pending: { fullName: string; phone: string } | null = null;
  /** Every signed-in account gets a users/{uid} profile (Google sign-ins on first visit, email sign-ups right away). */
  async function ensureProfile(fu: User): Promise<UserProfile> {
    const existing = await one<UserProfile>('users', fu.uid);
    if (existing) {
      if (existing.role === 'donor' && fu.emailVerified && isPlatformAdminEmail(fu.email ?? '')) {
        await updateDoc(doc(db, 'users', fu.uid), { role: 'platformAdmin' });
        return { ...existing, role: 'platformAdmin' };
      }
      return existing;
    }
    const email = (fu.email ?? '').toLowerCase();
    const role = fu.emailVerified && isPlatformAdminEmail(email) ? 'platformAdmin' : 'donor';
    const profile = { email, fullName: pending?.fullName || fu.displayName || email.split('@')[0], phone: pending?.phone ?? fu.phoneNumber ?? '', role, homeId: null };
    pending = null;
    await setDoc(doc(db, 'users', fu.uid), profile);
    return { id: fu.uid, ...profile } as UserProfile;
  }
  const write = async <T,>(fn: () => Promise<T>) => {
    try {
      const r = await fn();
      bump();
      return r;
    } catch (e) {
      if (e instanceof UserError) throw e;
      const code = (e as { code?: string })?.code;
      if (code === 'permission-denied') throw new UserError('You do not have permission to do that.');
      throw friendly(e);
    }
  };

  return {
    mode: 'firebase',
    onAuth(cb) {
      return onAuthStateChanged(auth, async (fu) => {
        if (!fu) return cb(null);
        cb(await ensureProfile(fu));
      });
    },
    async signUp(email, password, fullName, phone) {
      try {
        pending = { fullName, phone };
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } catch (e) {
        pending = null;
        throw friendly(e);
      }
    },
    async signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw friendly(e);
      }
    },
    async signIn(email, password) {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (e) {
        throw friendly(e);
      }
    },
    async signOut() {
      await fbSignOut(auth);
    },

    getProfile: (uid) => one<UserProfile>('users', uid),
    updateProfile: (uid, data) => write(() => updateDoc(doc(db, 'users', uid), data)),
    async saveFcmToken(uid, token) {
      await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) });
    },

    approvedHomes: () => list<Home>('homes', where('status', '==', 'Approved')),
    allHomes: () => list<Home>('homes'),
    getHome: (id) => one<Home>('homes', id),
    publicItems: () => list<WishlistItem>('items', where('homeApproved', '==', true)),
    homeItems: (homeId, asAdmin) =>
      asAdmin
        ? list<WishlistItem>('items', where('homeAdminId', '==', auth.currentUser?.uid ?? '-'), where('homeId', '==', homeId))
        : list<WishlistItem>('items', where('homeId', '==', homeId), where('homeApproved', '==', true)),
    allItems: () => list<WishlistItem>('items'),
    getPledge: (id) => one<Pledge>('pledges', id),
    myPledges: (uid) => list<Pledge>('pledges', where('donorId', '==', uid)),
    homePledges: (user) => list<Pledge>('pledges', where('homeAdminId', '==', user.id)),
    allPledges: () => list<Pledge>('pledges'),
    async countDonors() {
      return (await getCountFromServer(query(col('users'), where('role', '==', 'donor')))).data().count;
    },

    registerHome: (user, data) =>
      write(async () => {
        const ref = doc(col('homes'));
        const b = writeBatch(db);
        b.set(ref, { ...data, status: 'Pending', adminId: user.id, createdAt: Date.now(), reviewedAt: null });
        b.update(doc(db, 'users', user.id), { role: 'homeAdmin', homeId: ref.id });
        await b.commit();
        // refresh the signed-in profile
        const fu = auth.currentUser;
        if (fu) await fu.getIdToken(true);
        return ref.id;
      }),
    updateHome: (id, data) =>
      write(async () => {
        await updateDoc(doc(db, 'homes', id), data);
        if (data.name || data.area) {
          const items = await list<WishlistItem>('items', where('homeAdminId', '==', auth.currentUser?.uid ?? '-'), where('homeId', '==', id));
          const b = writeBatch(db);
          const h = await one<Home>('homes', id);
          items.forEach((i) => b.update(doc(db, 'items', i.id), { homeName: h!.name, homeArea: h!.area }));
          await b.commit();
        }
      }),
    reviewHome: (id, approve) =>
      write(async () => {
        const items = await list<WishlistItem>('items', where('homeId', '==', id));
        const b = writeBatch(db);
        b.update(doc(db, 'homes', id), { status: approve ? 'Approved' : 'Rejected', reviewedAt: Date.now() });
        items.forEach((i) => b.update(doc(db, 'items', i.id), { homeApproved: approve }));
        await b.commit();
      }),
    addItem: (user, home, data) =>
      write(async () => {
        const base = { qtyNeeded: data.qtyNeeded, qtyPledged: 0, qtyReceived: 0, status: 'Open' as const };
        await setDoc(doc(col('items')), {
          ...data, homeId: home.id, homeName: home.name, homeArea: home.area, homeApproved: home.status === 'Approved', homeAdminId: user.id,
          ...base, status: calcStatus(base), createdAt: Date.now(),
        });
      }),
    updateItem: (id, data) =>
      write(() =>
        runTransaction(db, async (tx) => {
          const s = await tx.get(doc(db, 'items', id));
          const next = { ...(s.data() as WishlistItem), ...data };
          tx.update(s.ref, { ...data, status: calcStatus(next) });
        }),
      ),
    setPaused: (id, paused) =>
      write(() =>
        runTransaction(db, async (tx) => {
          const s = await tx.get(doc(db, 'items', id));
          const i = s.data() as WishlistItem;
          tx.update(s.ref, { status: paused ? 'Paused' : calcStatus({ ...i, status: 'Open' }) });
        }),
      ),
    createPledge: (user, input) =>
      write(() =>
        runTransaction(db, async (tx) => {
          const iref = doc(db, 'items', input.itemId);
          const s = await tx.get(iref);
          if (!s.exists()) throw new UserError('Item not found.');
          const i = { id: s.id, ...s.data() } as WishlistItem;
          if (!i.homeApproved || !canPledge(i)) throw new UserError('This item is no longer accepting pledges.');
          if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > stillNeeded(i))
            throw new UserError(`You can pledge between 1 and ${stillNeeded(i)}.`);
          const pref = doc(col('pledges'));
          const p: Pledge = {
            id: pref.id, pledgeNo: makePledgeNo(), donorId: user.id, donorEmail: user.email, itemId: i.id, itemName: i.name,
            homeId: i.homeId, homeName: i.homeName, homeAdminId: i.homeAdminId, quantity: input.quantity, qtyReceived: 0,
            dropoffDate: input.dropoffDate, contactName: input.contactName, contactPhone: input.contactPhone,
            status: 'Pending', createdAt: Date.now(), receivedAt: null,
          };
          const { id: _id, ...data } = p;
          tx.update(iref, applyPledge(i, input.quantity));
          tx.set(pref, data);
          return p;
        }),
      ),
    setPledgeStatus: (id, status) =>
      write(() =>
        runTransaction(db, async (tx) => {
          const pref = doc(db, 'pledges', id);
          const ps = await tx.get(pref);
          const p = { id, ...ps.data() } as Pledge;
          const ok = status === 'Cancelled' ? p.status === 'Pending' || p.status === 'Accepted' : p.status === 'Pending';
          if (!ok) throw new UserError(`This pledge is already ${p.status.toLowerCase()}.`);
          if (status !== 'Accepted') {
            const iref = doc(db, 'items', p.itemId);
            const is = await tx.get(iref);
            tx.update(iref, applyRelease(is.data() as WishlistItem, p.quantity));
          }
          tx.update(pref, { status });
          return { ...p, status };
        }),
      ),
    markReceived: (id, delivered) =>
      write(() =>
        runTransaction(db, async (tx) => {
          const pref = doc(db, 'pledges', id);
          const ps = await tx.get(pref);
          const p = { id, ...ps.data() } as Pledge;
          if (p.status !== 'Accepted') throw new UserError('Only accepted pledges can be marked received.');
          if (!Number.isInteger(delivered) || delivered < 0) throw new UserError('Enter the number of items delivered.');
          const iref = doc(db, 'items', p.itemId);
          const is = await tx.get(iref);
          const patch = { status: 'Received' as const, qtyReceived: delivered, receivedAt: Date.now() };
          tx.update(iref, applyReceived(is.data() as WishlistItem, p.quantity, delivered));
          tx.update(pref, patch);
          return { ...p, ...patch };
        }),
      ),
  };
}
