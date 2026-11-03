import type { Home, NewHome, NewItem, NewPledge, Pledge, UserProfile, WishlistItem } from './types';
import { calcStatus } from './logic';

export interface Store {
  mode: 'local' | 'firebase';
  onAuth(cb: (u: UserProfile | null) => void): () => void;
  signUp(email: string, password: string, fullName: string, phone: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  getProfile(uid: string): Promise<UserProfile | null>;
  updateProfile(uid: string, data: { fullName?: string; phone?: string; emailNotifications?: boolean }): Promise<void>;
  saveFcmToken(uid: string, token: string): Promise<void>;

  approvedHomes(): Promise<Home[]>;
  allHomes(): Promise<Home[]>;
  getHome(id: string): Promise<Home | null>;
  publicItems(): Promise<WishlistItem[]>;
  homeItems(homeId: string, asAdmin: boolean): Promise<WishlistItem[]>;
  allItems(): Promise<WishlistItem[]>;
  getPledge(id: string): Promise<Pledge | null>;
  myPledges(uid: string): Promise<Pledge[]>;
  homePledges(user: UserProfile): Promise<Pledge[]>;
  allPledges(): Promise<Pledge[]>;
  countDonors(): Promise<number>;

  registerHome(user: UserProfile, data: NewHome & { notifyEmail: string }): Promise<string>;
  updateHome(id: string, data: Partial<NewHome> & { notifyEmail?: string }): Promise<void>;
  reviewHome(id: string, approve: boolean): Promise<void>;
  addItem(user: UserProfile, home: Home, data: NewItem): Promise<void>;
  updateItem(id: string, data: Partial<NewItem>): Promise<void>;
  setPaused(id: string, paused: boolean): Promise<void>;
  createPledge(user: UserProfile, input: NewPledge): Promise<Pledge>;
  setPledgeStatus(id: string, status: 'Accepted' | 'Declined' | 'Cancelled'): Promise<Pledge>;
  markReceived(id: string, delivered: number): Promise<Pledge>;
}

/* ---------- change notifications: pages re-fetch after any write ---------- */
type Listener = () => void;
const listeners = new Set<Listener>();
export const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const bump = () => listeners.forEach((l) => l());

/* ---------- shared workflow maths (Spec §5) ---------- */
type Counts = Pick<WishlistItem, 'qtyNeeded' | 'qtyPledged' | 'qtyReceived' | 'status'>;

/** W1: add a pledge's quantity to the item. */
export function applyPledge(item: Counts, qty: number) {
  const next = { ...item, qtyPledged: item.qtyPledged + qty };
  return { qtyPledged: next.qtyPledged, status: calcStatus(next) };
}
/** W3/W4: release a declined or cancelled pledge. */
export function applyRelease(item: Counts, qty: number) {
  const next = { ...item, qtyPledged: Math.max(0, item.qtyPledged - qty) };
  return { qtyPledged: next.qtyPledged, status: calcStatus(next) };
}
/** W5: delivered may differ from pledged. */
export function applyReceived(item: Counts, pledged: number, delivered: number) {
  const next = { ...item, qtyReceived: item.qtyReceived + delivered, qtyPledged: Math.max(0, item.qtyPledged + (delivered - pledged)) };
  return { qtyReceived: next.qtyReceived, qtyPledged: next.qtyPledged, status: calcStatus(next) };
}

export class UserError extends Error {}
