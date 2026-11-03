import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar, Cat, ErrorBox, Field, PriorityTag, StatusTag, useToast } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { compressImage } from '../../lib/image';
import { sortItems } from '../../lib/logic';
import { CATEGORIES, type Category, type Home, type ItemStatus, type NewItem, type Priority, type WishlistItem } from '../../lib/types';
import { useData, useIsDesktop } from '../../lib/useData';
import { HomeAdminPage, PageHeader } from './AdminShell';

/** A2b / drawer: add or edit a need (W6). */
function NeedForm({ home, item, onClose }: { home: Home; item?: WishlistItem; onClose: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [v, setV] = useState<NewItem>({
    name: item?.name ?? '', category: item?.category ?? 'HYG', priority: item?.priority ?? 'High',
    neededBy: item?.neededBy ?? '', qtyNeeded: item?.qtyNeeded ?? 10, image: item?.image ?? null,
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof NewItem>(k: K, val: NewItem[K]) => setV((s) => ({ ...s, [k]: val }));
  const minQty = item ? Math.max(1, item.qtyPledged, item.qtyReceived) : 1;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!v.name.trim()) return setErr('Enter the item name.');
    if (!Number.isInteger(v.qtyNeeded) || v.qtyNeeded < minQty) return setErr(item ? `Quantity can't be lower than ${minQty} (already pledged or received).` : 'Quantity must be at least 1.');
    setBusy(true);
    setErr(null);
    try {
      const data = { ...v, name: v.name.trim(), neededBy: v.neededBy || null };
      if (item) await api.updateItem(item.id, data);
      else await api.addItem(user!, home, data);
      toast(item ? 'Need updated' : 'Need added to your wishlist');
      onClose();
    } catch (e2) {
      setErr((e2 as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="overlay drawer" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={save} style={{ gap: 16 }}>
        <div className="between">
          <div className="row" style={{ gap: 12 }}>
            <button type="button" className="hide-d" onClick={onClose} aria-label="Back" style={{ width: 36, height: 36, borderRadius: 18, background: '#fff', border: '1px solid var(--line)', fontSize: 22, fontWeight: 700 }}>‹</button>
            <h2 style={{ fontWeight: 800 }}>{item ? 'Edit need' : 'Add a need'}</h2>
          </div>
          <button type="button" className="x hide-m" onClick={onClose} aria-label="Close">×</button>
        </div>
        <Field label="Item name"><input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Adult diapers, size M" autoFocus /></Field>
        <Field label="Category">
          <select className="input select" value={v.category} onChange={(e) => set('category', e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </Field>
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <div className="grow"><Field label="Quantity needed"><input className="input" inputMode="numeric" value={v.qtyNeeded || ''} onChange={(e) => set('qtyNeeded', parseInt(e.target.value.replace(/\D/g, '') || '0', 10))} /></Field></div>
          <div className="grow"><Field label="Needed by"><input className="input" type="date" value={v.neededBy ?? ''} onChange={(e) => set('neededBy', e.target.value)} /></Field></div>
        </div>
        <Field label="Priority" hint="High-priority items get the red Urgent tag for donors.">
          <div className="seg">
            {(['High', 'Medium', 'Low'] as Priority[]).map((p) => (
              <button type="button" key={p} className={v.priority === p ? 'on' : ''} style={v.priority === p && p === 'High' ? { color: 'var(--red)' } : undefined} onClick={() => set('priority', p)}>{p}</button>
            ))}
          </div>
        </Field>
        <Field label="Photo (optional)">
          <label className="upload" style={v.image ? { backgroundImage: `url(${v.image})`, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.6)' } : undefined}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set('image', await compressImage(f, 600).catch(() => null)); }} />
            {v.image ? 'Tap to change photo' : 'Tap to take or upload a photo'}
            <span className="small">JPG or PNG</span>
          </label>
        </Field>
        <ErrorBox msg={err} />
        <div style={{ flex: 1 }} />
        <div className="pledge-actions" style={{ flexDirection: 'row' }}>
          <button className="btn pledge-confirm" style={{ flex: 1 }} disabled={busy}>{busy ? 'Saving…' : 'Save need'}</button>
          <button type="button" className="btn btn-plain hide-m" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

const FILTERS: { key: string; label: string; test: (s: ItemStatus) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'open', label: 'Open', test: (s) => s === 'Open' },
  { key: 'part', label: 'Partially pledged', test: (s) => s === 'Partially pledged' },
  { key: 'full', label: 'Fully pledged', test: (s) => s === 'Fully pledged' },
  { key: 'done', label: 'Fulfilled', test: (s) => s === 'Fulfilled' },
  { key: 'paused', label: 'Paused', test: (s) => s === 'Paused' },
];

/** A2 Manage wishlist */
function Wishlist({ home }: { home: Home }) {
  const desktop = useIsDesktop();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState('all');
  const { data } = useData(() => api.homeItems(home.id, true), [home.id]);
  const all = sortItems(data ?? []);
  const list = all.filter((i) => FILTERS.find((x) => x.key === f)!.test(i.status));
  const editId = params.get('edit');
  const editing = all.find((i) => i.id === editId);
  const adding = params.get('add') === '1';
  const close = () => setParams({}, { replace: true });
  const pause = async (i: WishlistItem) => {
    await api.setPaused(i.id, i.status !== 'Paused');
    toast(i.status === 'Paused' ? 'Need is visible to donors again' : 'Need paused – hidden from donors');
  };
  const qtyLine = (i: WishlistItem) => <><b>{i.qtyNeeded}</b> / <b>{i.qtyPledged}</b> / <b>{i.qtyReceived}</b></>;
  const actions = (i: WishlistItem) => (
    <div className="row" style={{ gap: 6 }}>
      <button className="btn btn-sm btn-plain" onClick={() => setParams({ edit: i.id })}>Edit</button>
      <button className="btn btn-sm btn-plain" onClick={() => pause(i)}>{i.status === 'Paused' ? 'Resume' : 'Pause'}</button>
    </div>
  );

  return (
    <>
      <PageHeader title="Wishlist" sub={desktop ? `${all.length} items · donors see these on your public page` : undefined} right={<button className={`btn${desktop ? '' : ' btn-sm'}`} onClick={() => setParams({ add: '1' })}>+ Add need</button>} />
      <div className="chips">
        {FILTERS.map((x) => {
          const n = all.filter((i) => x.test(i.status)).length;
          if (x.key !== 'all' && !n) return null;
          return <button key={x.key} className={`chip${f === x.key ? ' on' : ''}`} onClick={() => setF(x.key)}>{x.label} ({n})</button>;
        })}
      </div>
      {!desktop && list.length > 0 && <p className="small">Numbers show needed / pledged / received.</p>}
      {data && list.length === 0 && <div className="card empty">{all.length ? 'Nothing with this status.' : 'No needs yet. Add the first item your home needs.'}</div>}
      {list.length > 0 && desktop && (
        <table className="table">
          <thead><tr><th>Item</th><th>Priority</th><th>Needed by</th><th>Need / Pledged / Rec.</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td><div className="row" style={{ gap: 10 }}><Cat c={i.category} size={32} /><b style={{ fontWeight: 600 }}>{i.name}</b></div></td>
                <td><PriorityTag p={i.priority} /></td>
                <td>{i.neededBy ? new Date(i.neededBy).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '—'}</td>
                <td className="qty" style={{ fontSize: 13 }}>{qtyLine(i)}</td>
                <td><StatusTag s={i.status} /></td>
                <td>{actions(i)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!desktop &&
        list.map((i) => (
          <div key={i.id} className="item">
            <div className="row" style={{ gap: 10 }}>
              <Cat c={i.category} />
              <div className="grow stack" style={{ gap: 4 }}>
                <h3>{i.name}</h3>
                <div className="row" style={{ gap: 6 }}><PriorityTag p={i.priority} /><StatusTag s={i.status} /></div>
              </div>
            </div>
            <Bar pct={i.qtyNeeded ? i.qtyPledged / i.qtyNeeded : 0} green={i.status === 'Fully pledged' || i.status === 'Fulfilled'} />
            <div className="between">
              <span className="qty" title="Needed / pledged / received">{qtyLine(i)}</span>
              {actions(i)}
            </div>
          </div>
        ))}
      {(adding || editing) && <NeedForm key={editing?.id ?? 'new'} home={home} item={editing} onClose={close} />}
    </>
  );
}

export default function WishlistPage() {
  return <HomeAdminPage>{(home) => <Wishlist home={home} />}</HomeAdminPage>;
}
