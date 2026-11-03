export type Role = 'donor' | 'homeAdmin' | 'platformAdmin';
export type HomeType = 'Children' | 'Elderly';
export type HomeStatus = 'Pending' | 'Approved' | 'Rejected';
export type Category = 'FOOD' | 'HYG' | 'MED' | 'CLO' | 'EDU';
export type Priority = 'High' | 'Medium' | 'Low';
export type ItemStatus = 'Open' | 'Partially pledged' | 'Fully pledged' | 'Fulfilled' | 'Paused';
export type PledgeStatus = 'Pending' | 'Accepted' | 'Declined' | 'Received' | 'Cancelled';

export const AREAS = ['Cheras', 'Petaling Jaya', 'Klang', 'Shah Alam', 'Kajang', 'Subang Jaya', 'Kuala Lumpur', 'Other'] as const;
export const CATEGORIES: { code: Category; label: string }[] = [
  { code: 'FOOD', label: 'Packaged food' },
  { code: 'HYG', label: 'Hygiene' },
  { code: 'MED', label: 'Medical supplies' },
  { code: 'CLO', label: 'Clothing' },
  { code: 'EDU', label: 'Education' },
];
export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.code === c)?.label ?? c;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  homeId?: string | null;
  /** false = no notification emails (app notifications are controlled by the device). */
  emailNotifications?: boolean;
}

export interface Home {
  id: string;
  name: string;
  type: HomeType;
  area: string;
  about: string;
  address: string;
  dropoffHours: string;
  photo?: string | null;
  status: HomeStatus;
  adminId: string;
  /** Contact email the home publishes; also receives new-pledge emails. */
  notifyEmail?: string;
  createdAt: number;
  reviewedAt?: number | null;
}

export interface WishlistItem {
  id: string;
  homeId: string;
  homeName: string;
  homeArea: string;
  homeApproved: boolean;
  homeAdminId: string;
  name: string;
  category: Category;
  image?: string | null;
  priority: Priority;
  neededBy?: string | null;
  qtyNeeded: number;
  qtyPledged: number;
  qtyReceived: number;
  status: ItemStatus;
  createdAt: number;
}

export interface Pledge {
  id: string;
  pledgeNo: string;
  donorId: string;
  donorEmail: string;
  itemId: string;
  itemName: string;
  homeId: string;
  homeName: string;
  homeAdminId: string;
  quantity: number;
  qtyReceived: number;
  dropoffDate: string;
  contactName: string;
  contactPhone: string;
  status: PledgeStatus;
  createdAt: number;
  receivedAt?: number | null;
}

export type NewHome = Pick<Home, 'name' | 'type' | 'area' | 'about' | 'address' | 'dropoffHours' | 'photo'>;
export type NewItem = Pick<WishlistItem, 'name' | 'category' | 'priority' | 'neededBy' | 'qtyNeeded' | 'image'>;
export type NewPledge = { itemId: string; quantity: number; dropoffDate: string; contactName: string; contactPhone: string };
