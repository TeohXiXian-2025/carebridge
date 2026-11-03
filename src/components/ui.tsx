import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Category, Home, ItemStatus, PledgeStatus, Priority } from '../lib/types';
import { gradientFor, initials } from '../lib/logic';

export const Logo = ({ size = 20, white = false }: { size?: number; white?: boolean }) => (
  <span className={`logo${white ? ' white' : ''}`} style={{ fontSize: size }}>
    Care<span>Bridge</span>
  </span>
);

const STATUS_CLASS: Record<ItemStatus, string> = { Open: 't-grey', 'Partially pledged': 't-yel', 'Fully pledged': 't-green', Fulfilled: 't-green', Paused: 't-grey' };
const PRIORITY_CLASS: Record<Priority, string> = { High: 't-red', Medium: 't-med', Low: 't-grey' };
const PLEDGE_CLASS: Record<PledgeStatus, string> = { Pending: 't-yel', Accepted: 't-teal', Received: 't-green', Declined: 't-red', Cancelled: 't-grey' };
export const Tag = ({ cls, children }: { cls: string; children: ReactNode }) => <span className={`tag ${cls}`}>{children}</span>;
export const StatusTag = ({ s }: { s: ItemStatus }) => <Tag cls={STATUS_CLASS[s]}>{s}</Tag>;
export const PriorityTag = ({ p }: { p: Priority }) => <Tag cls={PRIORITY_CLASS[p]}>{p}</Tag>;
export const PledgeTag = ({ s }: { s: PledgeStatus }) => <Tag cls={PLEDGE_CLASS[s]}>{s}</Tag>;
export const UrgentTag = ({ label = 'Urgent' }: { label?: string }) => <Tag cls="t-red">{label}</Tag>;

export const Bar = ({ pct, green }: { pct: number; green?: boolean }) => (
  <div className={`bar${green ? ' green' : ''}`} role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
    {pct > 0 && <i style={{ width: `${Math.min(100, Math.max(2, pct * 100))}%` }} />}
  </div>
);
export const Cat = ({ c, size = 40 }: { c: Category; size?: number }) => (
  <div className={`cat c-${c}`} style={{ width: size, height: size, fontSize: size < 40 ? 9 : 11 }} aria-label={c}>
    {c}
  </div>
);
export const Qty = ({ n, p, r }: { n: number; p: number; r: number }) => (
  <p className="qty">
    <b>{n}</b> needed · <b>{p}</b> pledged · <b>{r}</b> received
  </p>
);

export function HomePhoto({ home, w, h, radius = 14, font = 18 }: { home: Pick<Home, 'id' | 'name' | 'photo'>; w: number | string; h: number | string; radius?: number; font?: number }) {
  const style = home.photo ? { backgroundImage: `url(${home.photo})` } : { background: gradientFor(home.id) };
  return (
    <div className="photo" style={{ width: w, height: h, borderRadius: radius, fontSize: font, ...style }}>
      {!home.photo && initials(home.name)}
    </div>
  );
}

export function Stepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div className="stepper">
      <button type="button" aria-label="Less" onClick={() => set(value - 1)} disabled={value <= 1}>
        −
      </button>
      <input inputMode="numeric" aria-label="Quantity" value={value || ''} onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))} />
      <button type="button" aria-label="More" onClick={() => set(value + 1)} disabled={value >= max}>
        +
      </button>
    </div>
  );
}

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="field">
    <label>{label}</label>
    {children}
    {hint && <p className="small">{hint}</p>}
  </div>
);
export const ErrorBox = ({ msg }: { msg?: string | null }) => (msg ? <div className="error" role="alert">{msg}</div> : null);
export const Spinner = () => <div className="spin">Loading…</div>;
export const Avatar = ({ name }: { name?: string }) => <div className="avatar">{(name ?? '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</div>;

/* Toasts */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* Small icons for the tab bars */
const P = { fill: 'none', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const Icon = {
  home: <svg viewBox="0 0 24 24" {...P}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  homes: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  pledges: <svg viewBox="0 0 24 24" {...P}><path d="M20 12v8H4v-8M2 7h20v5H2zM12 21V7M12 7S10 3 7.5 3a2 2 0 0 0 0 4M12 7s2-4 4.5-4a2 2 0 0 1 0 4" /></svg>,
  profile: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></svg>,
  list: <svg viewBox="0 0 24 24" {...P}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  chart: <svg viewBox="0 0 24 24" {...P}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  check: <svg viewBox="0 0 24 24" {...P}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  users: <svg viewBox="0 0 24 24" {...P}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.5-5 6.5-5s5.7 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.5 5" /></svg>,
};
