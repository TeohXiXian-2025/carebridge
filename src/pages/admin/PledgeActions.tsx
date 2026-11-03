import { useState } from 'react';
import { ErrorBox, Field, PledgeTag, Stepper, useToast } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/logic';
import type { Pledge, WishlistItem } from '../../lib/types';

/** Accept / Decline / Mark received buttons for one pledge (W2, W3, W5). */
export function PledgeActions({ p, onReceive, block }: { p: Pledge; onReceive: (p: Pledge) => void; block?: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (s: 'Accepted' | 'Declined') => {
    if (s === 'Declined' && !confirm(`Decline ${p.contactName}'s pledge of ${p.itemName} × ${p.quantity}?`)) return;
    setBusy(true);
    try {
      await api.setPledgeStatus(p.id, s);
      toast(s === 'Accepted' ? 'Pledge accepted – donor notified' : 'Pledge declined');
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(false);
  };
  const cls = block ? ' grow' : '';
  if (p.status === 'Pending')
    return (
      <div className="row" style={{ gap: 8, width: block ? '100%' : undefined }}>
        <button className={`btn btn-sm${cls}`} disabled={busy} onClick={() => run('Accepted')}>Accept</button>
        <button className={`btn btn-sm btn-plain${cls}`} disabled={busy} onClick={() => run('Declined')}>Decline</button>
      </div>
    );
  if (p.status === 'Accepted') return <button className={`btn btn-sm${block ? ' btn-block' : ''}`} onClick={() => onReceive(p)}>Mark received</button>;
  if (p.status === 'Received') return <span className="small">Received {p.qtyReceived} · {p.receivedAt ? new Date(p.receivedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : ''}</span>;
  return <span className="small">{p.status}</span>;
}

/** Mobile pledge card. */
export function PledgeCard({ p, onReceive }: { p: Pledge; onReceive: (p: Pledge) => void }) {
  return (
    <div className="card stack" style={{ gap: 8, borderRadius: 16 }}>
      <div className="between"><span className="small">{p.pledgeNo}</span><PledgeTag s={p.status} /></div>
      <h3 style={{ fontSize: 15 }}>{p.itemName} × {p.quantity}</h3>
      <p className="small">{p.contactName} · <a href={`tel:${p.contactPhone.replace(/\s/g, '')}`}>{p.contactPhone}</a> · Drop off {formatDate(p.dropoffDate)}</p>
      <PledgeActions p={p} onReceive={onReceive} block />
    </div>
  );
}

/** Desktop pledge table. */
export function PledgeTable({ list, onReceive, showStatus = true }: { list: Pledge[]; onReceive: (p: Pledge) => void; showStatus?: boolean }) {
  return (
    <div className="table-wrap"><table className="table">
      <thead><tr><th>Pledge no.</th><th>Donor</th><th>Item</th><th>Qty</th><th>Drop-off</th>{showStatus && <th>Status</th>}<th>Actions</th></tr></thead>
      <tbody>
        {list.map((p) => (
          <tr key={p.id}>
            <td style={{ fontWeight: 600 }}>{p.pledgeNo}</td>
            <td><div style={{ fontWeight: 600 }}>{p.contactName}</div><div className="small">{p.contactPhone}</div></td>
            <td>{p.itemName}</td>
            <td>{p.quantity}</td>
            <td>{formatDate(p.dropoffDate)}</td>
            {showStatus && <td><PledgeTag s={p.status} /></td>}
            <td><PledgeActions p={p} onReceive={onReceive} /></td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}

/** A4: Mark as received – sheet on phones, pop-up on desktop. */
export function MarkReceived({ p, item, onClose }: { p: Pledge; item?: WishlistItem; onClose: () => void }) {
  const toast = useToast();
  const [qty, setQty] = useState(p.quantity);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const after = item ? item.qtyReceived + qty : null;
  async function save() {
    setBusy(true);
    try {
      await api.markReceived(p.id, qty);
      toast('Marked received – wishlist updated');
      onClose();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="grab" />
        <div className="between"><h2 style={{ fontWeight: 800 }}>Mark as received</h2><button className="x hide-m" onClick={onClose} aria-label="Close">×</button></div>
        <div className="stack" style={{ gap: 4, background: 'var(--bg)', borderRadius: 12, padding: 12 }}>
          <b style={{ fontSize: 13 }}>{p.pledgeNo} · {p.contactName}</b>
          <span className="small" style={{ fontSize: 13 }}>{p.itemName} · pledged {p.quantity}</span>
        </div>
        <Field label="Quantity actually delivered" hint="Change this if the donor brought fewer or more than pledged.">
          <Stepper value={qty} max={9999} onChange={setQty} />
        </Field>
        {item && (
          <div className="note"><b>Wishlist update:</b> {item.name} received {item.qtyReceived} → {after} of {item.qtyNeeded}. The donor gets a thank-you message.</div>
        )}
        <ErrorBox msg={err} />
        <div className="pledge-actions" style={{ flexDirection: 'row-reverse', justifyContent: 'flex-start' }}>
          <button className="btn pledge-confirm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Confirm received'}</button>
          <button className="btn btn-plain" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
