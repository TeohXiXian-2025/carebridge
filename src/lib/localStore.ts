import type { Home, Invite, Pledge, UserProfile, WishlistItem } from './types';
import { applyPledge, applyReceived, applyRelease, bump, UserError, type Store } from './store';
import { calcStatus, canPledge, makePledgeNo, stillNeeded } from './logic';
import { DEMO_PASSWORD, DEMO_USERS, seedHomes, seedItems, seedPledges } from './seed';

/**
 * Demo mode: the whole backend lives in this browser's localStorage, seeded with sample data.
 * Used when no Firebase config is set, so the app can be clicked through and tested offline.
 */
const KEY = 'carebridge-demo-v1';
type DB = { users: (UserProfile & { password: string })[]; homes: Home[]; items: WishlistItem[]; pledges: Pledge[]; invites?: Invite[]; session: string | null };

function fresh(): DB {
  const homes = seedHomes();
  const items = seedItems(homes);
  return { users: DEMO_USERS.map((u) => ({ ...u, password: DEMO_PASSWORD })), homes, items, pledges: seedPledges(items, DEMO_USERS[0]), session: null };
}
function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through */
  }
  const db = fresh();
  save(db);
  return db;
}
function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked – keep working in memory */
  }
}
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;
const pub = ({ password: _pw, ...u }: UserProfile & { password: string }): UserProfile => u;
const tick = () => new Promise((r) => setTimeout(r, 120));

export function resetDemo() {
  localStorage.removeItem(KEY);
  location.reload();
}

export function createLocalStore(): Store {
  let db = load();
  const authListeners = new Set<(u: UserProfile | null) => void>();
  const me = () => {
    const u = db.users.find((x) => x.id === db.session);
    return u ? pub(u) : null;
  };
  const commit = () => {
    save(db);
    bump();
  };
  const emitAuth = () => authListeners.forEach((l) => l(me()));
  /** Same as the live app: a donor whose email has an invite gets that role on sign-in. */
  const acceptInvite = (u: UserProfile & { password: string }) => {
    const inv = (db.invites ?? []).find((i) => i.email === u.email);
    if (!inv || u.role !== 'donor') return;
    u.role = inv.role;
    u.homeId = inv.role === 'homeAdmin' ? inv.homeId ?? null : null;
    db.invites = (db.invites ?? []).filter((i) => i !== inv);
  };
  const item = (id: string) => {
    const i = db.items.find((x) => x.id === id);
    if (!i) throw new UserError('Item not found.');
    return i;
  };
  const pledge = (id: string) => {
    const p = db.pledges.find((x) => x.id === id);
    if (!p) throw new UserError('Pledge not found.');
    return p;
  };

  return {
    mode: 'local',
    onAuth(cb) {
      authListeners.add(cb);
      cb(me());
      return () => authListeners.delete(cb);
    },
    async signUp(email, password, fullName, phone) {
      await tick();
      email = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === email)) throw new UserError('An account with this email already exists.');
      if (password.length < 6) throw new UserError('Password must be at least 6 characters.');
      const u = { id: uid('u'), email, fullName, phone, role: 'donor' as const, homeId: null, password };
      db.users.push(u);
      acceptInvite(u);
      db.session = u.id;
      commit();
      emitAuth();
    },
    async signIn(email, password) {
      await tick();
      const u = db.users.find((x) => x.email === email.trim().toLowerCase());
      if (!u || u.password !== password) throw new UserError('Wrong email or password.');
      acceptInvite(u);
      db.session = u.id;
      commit();
      emitAuth();
    },
    async signInWithGoogle() {
      throw new UserError('Google sign-in works on the live site. In demo mode, use the demo accounts shown at the top.');
    },
    async updateProfile(id, data) {
      const u = db.users.find((x) => x.id === id);
      if (u) Object.assign(u, data);
      commit();
      emitAuth();
    },
    async signOut() {
      db.session = null;
      commit();
      emitAuth();
    },

    async getProfile(id) {
      const u = db.users.find((x) => x.id === id);
      return u ? pub(u) : null;
    },
    async saveFcmToken() {
      /* push needs Firebase; nothing to do in demo mode */
    },

    async approvedHomes() {
      return db.homes.filter((h) => h.status === 'Approved');
    },
    async allHomes() {
      return [...db.homes];
    },
    async getHome(id) {
      return db.homes.find((h) => h.id === id) ?? null;
    },
    async publicItems() {
      return db.items.filter((i) => i.homeApproved);
    },
    async homeItems(homeId, asAdmin) {
      return db.items.filter((i) => i.homeId === homeId && (asAdmin || i.homeApproved));
    },
    async allItems() {
      return [...db.items];
    },
    async getPledge(id) {
      return db.pledges.find((p) => p.id === id) ?? null;
    },
    async myPledges(u) {
      return db.pledges.filter((p) => p.donorId === u);
    },
    async homePledges(user) {
      return db.pledges.filter((p) => p.homeId === user.homeId);
    },
    async allPledges() {
      return [...db.pledges];
    },
    async countDonors() {
      return db.users.filter((u) => u.role === 'donor').length;
    },

    async registerHome(user, data) {
      await tick();
      const id = uid('h');
      db.homes.push({ ...data, id, status: 'Pending', adminId: user.id, createdAt: Date.now(), reviewedAt: null });
      const u = db.users.find((x) => x.id === user.id)!;
      u.role = 'homeAdmin';
      u.homeId = id;
      commit();
      emitAuth();
      return id;
    },
    async updateHome(id, data) {
      const h = db.homes.find((x) => x.id === id)!;
      Object.assign(h, data);
      db.items.filter((i) => i.homeId === id).forEach((i) => Object.assign(i, { homeName: h.name, homeArea: h.area }));
      commit();
    },
    async reviewHome(id, approve) {
      await tick();
      const h = db.homes.find((x) => x.id === id)!;
      h.status = approve ? 'Approved' : 'Rejected';
      h.reviewedAt = Date.now();
      db.items.filter((i) => i.homeId === id).forEach((i) => (i.homeApproved = approve));
      commit();
    },
    async addItem(user, home, data) {
      await tick();
      const base = { qtyNeeded: data.qtyNeeded, qtyPledged: 0, qtyReceived: 0, status: 'Open' as const };
      db.items.push({ ...data, id: uid('i'), homeId: home.id, homeName: home.name, homeArea: home.area, homeApproved: home.status === 'Approved', homeAdminId: user.id, ...base, status: calcStatus(base), createdAt: Date.now() });
      commit();
    },
    async updateItem(id, data) {
      const i = item(id);
      Object.assign(i, data);
      i.status = calcStatus(i);
      commit();
    },
    async setPaused(id, paused) {
      const i = item(id);
      i.status = paused ? 'Paused' : calcStatus({ ...i, status: 'Open' });
      commit();
    },
    async createPledge(user, input) {
      await tick();
      const i = item(input.itemId);
      if (!i.homeApproved || !canPledge(i)) throw new UserError('This item is no longer accepting pledges.');
      if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > stillNeeded(i))
        throw new UserError(`You can pledge between 1 and ${stillNeeded(i)}.`);
      Object.assign(i, applyPledge(i, input.quantity));
      const p: Pledge = { id: uid('p'), pledgeNo: makePledgeNo(), donorId: user.id, donorEmail: user.email, itemId: i.id, itemName: i.name, homeId: i.homeId, homeName: i.homeName, homeAdminId: i.homeAdminId, quantity: input.quantity, qtyReceived: 0, dropoffDate: input.dropoffDate, contactName: input.contactName, contactPhone: input.contactPhone, status: 'Pending', createdAt: Date.now(), receivedAt: null };
      db.pledges.push(p);
      commit();
      return p;
    },
    async setPledgeStatus(id, status) {
      await tick();
      const p = pledge(id);
      const allowed = status === 'Accepted' ? p.status === 'Pending' : status === 'Declined' ? p.status === 'Pending' : p.status === 'Pending' || p.status === 'Accepted';
      if (!allowed) throw new UserError(`This pledge is already ${p.status.toLowerCase()}.`);
      if (status !== 'Accepted') {
        const i = item(p.itemId);
        Object.assign(i, applyRelease(i, p.quantity));
      }
      p.status = status;
      commit();
      return { ...p };
    },
    async markReceived(id, delivered) {
      await tick();
      const p = pledge(id);
      if (p.status !== 'Accepted') throw new UserError('Only accepted pledges can be marked received.');
      if (!Number.isInteger(delivered) || delivered < 0) throw new UserError('Enter the number of items delivered.');
      const i = item(p.itemId);
      Object.assign(i, applyReceived(i, p.quantity, delivered));
      Object.assign(p, { status: 'Received', qtyReceived: delivered, receivedAt: Date.now() });
      commit();
      return { ...p };
    },

    async platformAdmins() {
      return db.users.filter((u) => u.role === 'platformAdmin').map(pub);
    },
    async homeManagers(homeId) {
      return db.users.filter((u) => u.role === 'homeAdmin' && u.homeId === homeId).map(pub);
    },
    async invites({ role, homeId }) {
      return (db.invites ?? []).filter((i) => i.role === role && (!homeId || i.homeId === homeId));
    },
    async invite(by, rawEmail, role, home) {
      await tick();
      const email = rawEmail.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new UserError('Enter a valid email address.');
      const u = db.users.find((x) => x.email === email);
      if (u && u.role !== 'donor') throw new UserError('This account already manages a home or the platform. Remove it there first.');
      if (u && by.role === 'platformAdmin') {
        u.role = role;
        u.homeId = role === 'homeAdmin' ? home?.id ?? null : null;
        commit();
        return 'added';
      }
      db.invites = [...(db.invites ?? []).filter((i) => i.email !== email), { email, role, homeId: home?.id ?? null, homeName: home?.name ?? null, invitedBy: by.id, invitedByName: by.fullName, createdAt: Date.now() }];
      commit();
      return 'invited';
    },
    async cancelInvite(email) {
      db.invites = (db.invites ?? []).filter((i) => i.email !== email);
      commit();
    },
    async demote(id) {
      const u = db.users.find((x) => x.id === id);
      if (u) Object.assign(u, { role: 'donor', homeId: null });
      commit();
      if (id === db.session) emitAuth();
    },
  };
}
