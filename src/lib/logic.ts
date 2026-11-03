import type { ItemStatus, WishlistItem, Home, Priority } from './types';

/** Spec §4: recalculate an item's status from its counts. Paused stays Paused. */
export function calcStatus(i: Pick<WishlistItem, 'qtyNeeded' | 'qtyPledged' | 'qtyReceived' | 'status'>): ItemStatus {
  if (i.status === 'Paused') return 'Paused';
  if (i.qtyReceived >= i.qtyNeeded) return 'Fulfilled';
  if (i.qtyPledged >= i.qtyNeeded) return 'Fully pledged';
  if (i.qtyPledged > 0) return 'Partially pledged';
  return 'Open';
}

export const stillNeeded = (i: Pick<WishlistItem, 'qtyNeeded' | 'qtyPledged'>) => Math.max(0, i.qtyNeeded - i.qtyPledged);
export const canPledge = (i: Pick<WishlistItem, 'status'>) => i.status === 'Open' || i.status === 'Partially pledged';
export const isUrgent = (i: Pick<WishlistItem, 'priority' | 'status'>) => i.priority === 'High' && canPledge(i);

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
const STATUS_ORDER: Record<ItemStatus, number> = { Open: 0, 'Partially pledged': 1, 'Fully pledged': 2, Fulfilled: 3, Paused: 4 };
export function sortItems(items: WishlistItem[]) {
  return [...items].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.name.localeCompare(b.name),
  );
}

export function fulfilment(items: WishlistItem[]) {
  const counted = items.filter((i) => i.status !== 'Paused');
  const done = counted.filter((i) => i.status === 'Fulfilled').length;
  return { done, total: counted.length, pct: counted.length ? done / counted.length : 0 };
}

export function homeSummary(home: Home, items: WishlistItem[]) {
  const mine = items.filter((i) => i.homeId === home.id);
  return { ...fulfilment(mine), urgent: mine.some(isUrgent), open: mine.filter(canPledge).length };
}

export function makePledgeNo(d = new Date()) {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let k = 0; k < 4; k++) code += chars[Math.floor(Math.random() * chars.length)];
  return `CB-${yy}${mm}${dd}-${code}`;
}

export const initials = (name: string) =>
  name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter((w) => w && !['of', 'the', 'home', 'Home'].includes(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'CB';

export function formatDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-MY', opts);
}
export const formatTs = (ts?: number | null) => (ts ? new Date(ts).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export const GRADIENTS = [
  ['#BFDCD5', '#8FC3B7'],
  ['#F6D9B8', '#EDB27C'],
  ['#D7D0F0', '#A99AD9'],
  ['#C9E4F2', '#8EC1DE'],
  ['#FBE0C8', '#F2B98A'],
];
export const gradientFor = (id: string) => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [a, b] = GRADIENTS[h % GRADIENTS.length];
  return `linear-gradient(90deg, ${a}, ${b})`;
};
