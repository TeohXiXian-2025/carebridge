import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { canPledge, isUrgent, stillNeeded } from '../lib/logic';
import { UserError } from '../lib/store';
import type { Home, WishlistItem } from '../lib/types';
import { Bar, Cat, ErrorBox, Field, PriorityTag, Qty, StatusTag, Stepper, UrgentTag } from './ui';

const pct = (i: WishlistItem) => (i.qtyNeeded ? Math.min(1, i.qtyPledged / i.qtyNeeded) : 0);
const done = (i: WishlistItem) => i.status === 'Fully pledged' || i.status === 'Fulfilled';

export function PledgeButton({ item, onPledge, desktop }: { item: WishlistItem; onPledge: (i: WishlistItem) => void; desktop?: boolean }) {
  if (canPledge(item))
    return (
      <button className="btn btn-sm" style={desktop ? { minWidth: 92 } : undefined} onClick={() => onPledge(item)}>
        Pledge
      </button>
    );
  const label = item.status === 'Fulfilled' ? 'Fulfilled' : item.status === 'Paused' ? 'Paused' : 'Pledged';
  return <span className="btn btn-sm btn-off">{label}</span>;
}

/** Mobile wishlist card (also used for "Urgent needs" on the home page). */
export function ItemCard({ item, showHome, onPledge }: { item: WishlistItem; showHome?: boolean; onPledge?: (i: WishlistItem) => void }) {
  return (
    <div className="item">
      <div className="row" style={{ gap: 10 }}>
        <Cat c={item.category} />
        <div className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3>{item.name}</h3>
          {showHome ? (
            <p className="small">{item.homeName} · {item.homeArea}</p>
          ) : (
            <div className="row" style={{ gap: 6 }}>
              <PriorityTag p={item.priority} />
              <StatusTag s={item.status} />
            </div>
          )}
        </div>
        {showHome && isUrgent(item) && <UrgentTag />}
      </div>
      <Bar pct={pct(item)} green={done(item)} />
      <div className="between">
        <Qty n={item.qtyNeeded} p={item.qtyPledged} r={item.qtyReceived} />
        {onPledge && <PledgeButton item={item} onPledge={onPledge} />}
      </div>
    </div>
  );
}

/** Desktop wishlist row on the home profile page. */
export function ItemRow({ item, onPledge }: { item: WishlistItem; onPledge: (i: WishlistItem) => void }) {
  return (
    <div className="item-row">
      <Cat c={item.category} />
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ fontSize: 15 }}>{item.name}</h3>
        <div className="row" style={{ gap: 6 }}>
          <PriorityTag p={item.priority} />
          <StatusTag s={item.status} />
        </div>
      </div>
      <div className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ maxWidth: 260 }}>
          <Bar pct={pct(item)} green={done(item)} />
        </div>
        <Qty n={item.qtyNeeded} p={item.qtyPledged} r={item.qtyReceived} />
      </div>
      <PledgeButton item={item} onPledge={onPledge} desktop />
    </div>
  );
}

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

/** D4: pledge form – bottom sheet on phones, centred pop-up on desktop. */
export function PledgeSheet({ item, home, onClose }: { item: WishlistItem; home: Home; onClose: () => void }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const max = stillNeeded(item);
  const [qty, setQty] = useState(Math.min(max, Math.max(1, Math.ceil(max / 2))));
  const [date, setDate] = useState(tomorrow());
  const [name, setName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (qty < 1 || qty > max) return setErr(`Choose between 1 and ${max}.`);
    if (!date || date < new Date().toISOString().slice(0, 10)) return setErr('Pick a drop-off date from today onwards.');
    if (!name.trim() || phone.replace(/\D/g, '').length < 9) return setErr('Enter your name and a valid phone number.');
    setBusy(true);
    setErr(null);
    try {
      const p = await api.createPledge(user, { itemId: item.id, quantity: qty, dropoffDate: date, contactName: name.trim(), contactPhone: phone.trim() });
      nav(`/pledges/${p.id}/confirmed`);
    } catch (e2) {
      setErr(e2 instanceof UserError ? e2.message : 'Could not save your pledge. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit} aria-label="Pledge form">
        <div className="grab" />
        <div className="between hide-m">
          <h2 style={{ fontWeight: 800 }}>Pledge an item</h2>
          <button type="button" className="x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Cat c={item.category} />
          <div>
            <h3>{item.name}</h3>
            <p className="small">{home.name}</p>
          </div>
        </div>
        <div className="note">
          <b>{max} still needed</b> · {item.qtyNeeded} needed · {item.qtyPledged} pledged
        </div>
        <Field label="Quantity" hint={`Max ${max} (what is still needed)`}>
          <Stepper value={qty} max={max} onChange={setQty} />
        </Field>
        <div className="pledge-pair">
          <Field label="Planned drop-off date">
            <input className="input" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Contact name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
        </div>
        <Field label="Phone number">
          <input className="input" type="tel" placeholder="e.g. 012-345 6789" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </Field>
        <p className="small">Drop-off: {home.address} · {home.dropoffHours}</p>
        <ErrorBox msg={err} />
        <div className="pledge-actions">
          <button type="button" className="btn btn-plain hide-m" onClick={onClose}>Cancel</button>
          <button className="btn pledge-confirm" disabled={busy}>{busy ? 'Saving…' : 'Confirm pledge'}</button>
        </div>
      </form>
    </div>
  );
}
