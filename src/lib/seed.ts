import type { Home, Pledge, UserProfile, WishlistItem } from './types';
import { calcStatus } from './logic';

/**
 * Sample data for demo mode (no Firebase config) and for the platform admin's
 * "Load sample data" button. Demo-mode accounts only exist in the browser's local storage.
 */
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_USERS: UserProfile[] = [
  { id: 'u-donor', email: 'donor@demo.test', fullName: 'Teoh Xi Xian', phone: '012-345 6789', role: 'donor' },
  { id: 'u-admin', email: 'admin@demo.test', fullName: 'Mdm. Siew', phone: '03-9131 2200', role: 'homeAdmin', homeId: 'h-sridamai' },
  { id: 'u-admin2', email: 'kasih@demo.test', fullName: 'Ms. Kavitha', phone: '03-7955 1180', role: 'homeAdmin', homeId: 'h-kasih' },
  { id: 'u-admin3', email: 'sinar@demo.test', fullName: 'Mr. Azman', phone: '03-3341 7720', role: 'homeAdmin', homeId: 'h-sinar' },
  { id: 'u-admin4', email: 'bakti@demo.test', fullName: 'Mr. Rajan', phone: '012-778 3301', role: 'homeAdmin', homeId: 'h-bakti' },
  { id: 'u-admin5', email: 'ceria@demo.test', fullName: 'Ms. Farah', phone: '019-334 5520', role: 'homeAdmin', homeId: 'h-ceria' },
  { id: 'u-platform', email: 'platform@demo.test', fullName: 'Lee Xin Yi', phone: '011-2000 3000', role: 'platformAdmin' },
];

const day = 86400000;
const now = Date.now();
const iso = (offsetDays: number) => new Date(now + offsetDays * day).toISOString().slice(0, 10);

export function seedHomes(adminIds: Record<string, string> = {}): Home[] {
  const a = (id: string, fallback: string) => adminIds[id] ?? fallback;
  return [
    { id: 'h-sridamai', name: 'Sri Damai Elderly Home', type: 'Elderly', area: 'Cheras', about: 'Home for 38 elderly residents, many bedridden. We most need hygiene and medical supplies.', address: 'Jalan Damai 3, Cheras, Kuala Lumpur', dropoffHours: 'Mon–Sat, 10am–5pm', status: 'Approved', adminId: a('h-sridamai', 'u-admin'), notifyEmail: 'admin@demo.test', createdAt: now - 20 * day, reviewedAt: now - 18 * day },
    { id: 'h-kasih', name: "Kasih Harapan Children's Home", type: 'Children', area: 'Petaling Jaya', about: 'Home for 26 children aged 5–17. School supplies and clothing help the most.', address: 'Jalan SS 2/24, Petaling Jaya', dropoffHours: 'Daily, 9am–6pm', status: 'Approved', adminId: a('h-kasih', 'u-admin2'), notifyEmail: 'kasih@demo.test', createdAt: now - 19 * day, reviewedAt: now - 18 * day },
    { id: 'h-sinar', name: "Sinar Pelangi Children's Home", type: 'Children', area: 'Klang', about: 'Shelter for 32 children. We run short on packaged food and exercise books every month.', address: 'Jalan Meru 8, Klang', dropoffHours: 'Mon–Fri, 9am–5pm', status: 'Approved', adminId: a('h-sinar', 'u-admin3'), notifyEmail: 'sinar@demo.test', createdAt: now - 17 * day, reviewedAt: now - 16 * day },
    { id: 'h-bakti', name: 'Rumah Bakti Seri Mesra', type: 'Elderly', area: 'Kajang', about: 'Care home for 24 elderly residents. Needs mainly hygiene and medical supplies.', address: 'Jalan Reko 5, Kajang', dropoffHours: 'Mon–Sat, 10am–4pm', status: 'Pending', adminId: a('h-bakti', 'u-admin4'), notifyEmail: 'bakti@demo.test', createdAt: now - 1 * day },
    { id: 'h-ceria', name: "Taman Ceria Children's Shelter", type: 'Children', area: 'Shah Alam', about: 'Shelter for 30 children aged 4–17. Requests school supplies, clothing and packaged food.', address: 'Seksyen 7, Shah Alam', dropoffHours: 'Daily, 10am–5pm', status: 'Pending', adminId: a('h-ceria', 'u-admin5'), notifyEmail: 'ceria@demo.test', createdAt: now - 2 * day },
  ];
}

type Raw = [id: string, homeId: string, name: string, category: WishlistItem['category'], priority: WishlistItem['priority'], need: number, pledged: number, received: number, neededBy: number | null, paused?: boolean];
const RAW: Raw[] = [
  ['i-1', 'h-sridamai', 'Adult diapers, size L', 'HYG', 'High', 50, 20, 10, 12],
  ['i-2', 'h-sridamai', 'Wet wipes (pack)', 'HYG', 'High', 40, 12, 0, 10],
  ['i-3', 'h-sridamai', 'Disposable gloves (box)', 'MED', 'Medium', 10, 5, 0, 28],
  ['i-4', 'h-sridamai', 'Diabetic milk formula', 'FOOD', 'Low', 12, 12, 4, 40],
  ['i-5', 'h-sridamai', 'Cotton bedsheets, single', 'CLO', 'Low', 20, 20, 20, null],
  ['i-6', 'h-sridamai', 'Walking frame', 'MED', 'Medium', 2, 0, 0, null, true],
  ['i-7', 'h-kasih', 'Exercise books', 'EDU', 'Medium', 60, 30, 30, 20],
  ['i-8', 'h-kasih', 'School shoes (size 3–6)', 'CLO', 'Medium', 15, 15, 15, null],
  ['i-9', 'h-kasih', 'Toothpaste (tube)', 'HYG', 'Low', 30, 30, 30, null],
  ['i-10', 'h-kasih', 'Colour pencils (box)', 'EDU', 'Low', 20, 6, 0, 30],
  ['i-11', 'h-sinar', 'Rice, 5 kg bag', 'FOOD', 'High', 20, 4, 0, 7],
  ['i-12', 'h-sinar', 'Exercise books', 'EDU', 'High', 60, 12, 0, 14],
  ['i-13', 'h-sinar', 'Canned sardines', 'FOOD', 'Medium', 48, 0, 0, 21],
  ['i-14', 'h-sinar', 'Children’s T-shirts (M)', 'CLO', 'Low', 30, 30, 30, null],
];

export function seedItems(homes: Home[]): WishlistItem[] {
  return RAW.map(([id, homeId, name, category, priority, need, pledged, received, neededBy, paused], k) => {
    const h = homes.find((x) => x.id === homeId)!;
    const base = { qtyNeeded: need, qtyPledged: pledged, qtyReceived: received, status: (paused ? 'Paused' : 'Open') as WishlistItem['status'] };
    return {
      id, homeId, homeName: h.name, homeArea: h.area, homeApproved: h.status === 'Approved', homeAdminId: h.adminId,
      name, category, priority, image: null, neededBy: neededBy === null ? null : iso(neededBy),
      ...base, status: calcStatus(base), createdAt: now - (20 - k) * day,
    };
  });
}

export function seedPledges(items: WishlistItem[], donor: UserProfile): Pledge[] {
  const it = (id: string) => items.find((x) => x.id === id)!;
  const mk = (id: string, no: string, itemId: string, qty: number, status: Pledge['status'], drop: number, received = 0): Pledge => {
    const i = it(itemId);
    return { id, pledgeNo: no, donorId: donor.id, donorEmail: donor.email, itemId, itemName: i.name, homeId: i.homeId, homeName: i.homeName, homeAdminId: i.homeAdminId, quantity: qty, qtyReceived: received, dropoffDate: iso(drop), contactName: donor.fullName, contactPhone: donor.phone, status, createdAt: now - 3 * day, receivedAt: status === 'Received' ? now + drop * day : null };
  };
  return [
    mk('p-1', 'CB-261208-4F2A', 'i-1', 10, 'Pending', 4),
    mk('p-2', 'CB-261205-A311', 'i-2', 12, 'Accepted', 1),
    mk('p-3', 'CB-261203-5D02', 'i-4', 8, 'Accepted', 2),
    mk('p-4', 'CB-261201-0E7C', 'i-1', 10, 'Received', -2, 10),
    mk('p-5', 'CB-261128-B9A4', 'i-7', 30, 'Received', -5, 30),
    mk('p-6', 'CB-261207-7B10', 'i-3', 5, 'Pending', 3),
  ];
}
