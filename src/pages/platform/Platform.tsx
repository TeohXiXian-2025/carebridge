import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout, PLATFORM_NAV, PushPrompt, RequireRole } from '../../components/layout';
import { Bar, HomePhoto, Spinner, Tag, useToast } from '../../components/ui';
import { api } from '../../lib/api';
import { formatTs, homeSummary } from '../../lib/logic';
import type { Home } from '../../lib/types';
import { useData, useIsDesktop } from '../../lib/useData';
import { PageHeader } from '../admin/AdminShell';
import { AccountSettings } from '../../components/AccountSettings';
import { ManagersPanel } from '../../components/ManagersPanel';

const Shell = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role="platformAdmin">
    <AdminLayout nav={PLATFORM_NAV} subtitle="Platform admin">{children}</AdminLayout>
  </RequireRole>
);
const kv = (k: string, v: string) => (
  <div key={k} className="stack grow" style={{ gap: 2, minWidth: 0 }}>
    <span className="small" style={{ fontSize: 11, fontWeight: 600 }}>{k}</span>
    <span className="wrap-any" style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
  </div>
);

const STATUS_CLS: Record<Home['status'], string> = { Approved: 't-green', Pending: 't-yel', Rejected: 't-red' };
const StatusTag = ({ h }: { h: Home }) => <Tag cls={STATUS_CLS[h.status]}>{h.status === 'Pending' ? 'Pending review' : h.status}</Tag>;

/** Approve, reject (with an optional reason) or move back to pending – any time, from any status. */
function useReview(h: Home) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const set = async (status: Home['status']) => {
    let note: string | undefined;
    if (status === 'Rejected') {
      const r = prompt(`Reject ${h.name}? Optional: tell the home why, so they can fix it and ask again.`, '');
      if (r === null) return;
      note = r;
    } else if (h.status === 'Approved' && !confirm(`${status === 'Pending' ? 'Move' : 'Change'} ${h.name} back to ${status.toLowerCase()}? Donors will stop seeing it.`)) return;
    setBusy(true);
    try {
      await api.setHomeStatus(h.id, status, note);
      toast(status === 'Approved' ? `${h.name} is now visible to donors` : status === 'Rejected' ? 'Registration rejected' : 'Moved back to pending');
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(false);
  };
  return { busy, set };
}
function StatusActions({ h }: { h: Home }) {
  const { busy, set } = useReview(h);
  return (
    <div className="row wrap" style={{ gap: 6 }}>
      {h.status !== 'Approved' && <button className="btn btn-sm" disabled={busy} onClick={() => set('Approved')}>Approve</button>}
      {h.status !== 'Rejected' && <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => set('Rejected')}>Reject</button>}
      {h.status !== 'Pending' && <button className="btn btn-sm btn-plain" disabled={busy} onClick={() => set('Pending')}>Back to pending</button>}
    </div>
  );
}

function PendingCard({ h }: { h: Home }) {
  const desktop = useIsDesktop();
  const { busy, set } = useReview(h);
  const review = (approve: boolean) => set(approve ? 'Approved' : 'Rejected');
  const buttons = (
    <div className={desktop ? 'stack' : 'row'} style={{ gap: 8, width: desktop ? 130 : '100%' }}>
      <button className="btn btn-sm grow" disabled={busy} onClick={() => review(true)}>Approve</button>
      <button className="btn btn-sm btn-danger grow" disabled={busy} onClick={() => review(false)}>Reject</button>
    </div>
  );
  const facts = [kv('Type', h.type), kv('Area', h.area), kv('Contact', h.notifyEmail ?? '—'), kv('Submitted', formatTs(h.createdAt))];
  return (
    <div className="card" style={{ padding: desktop ? 20 : 16, display: 'flex', flexDirection: desktop ? 'row' : 'column', gap: desktop ? 18 : 12 }}>
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        <HomePhoto home={h} w={desktop ? 84 : 56} h={desktop ? 84 : 56} radius={desktop ? 14 : 12} />
        {!desktop && <div className="stack grow" style={{ gap: 6, minWidth: 0 }}><h3>{h.name}</h3><span><StatusTag h={h} />{h.resubmittedAt ? <span className="small"> · asked again</span> : null}</span></div>}
      </div>
      <div className="stack grow" style={{ gap: 10 }}>
        {desktop && <div className="row wrap"><h3 style={{ fontSize: 17 }}>{h.name}</h3><StatusTag h={h} />{h.resubmittedAt ? <span className="small">Asked for review again {formatTs(h.resubmittedAt)}</span> : null}</div>}
        {desktop ? <div className="row" style={{ gap: 28 }}>{facts}</div> : <><div className="row" style={{ gap: 12 }}>{facts.slice(0, 2)}</div><div className="row" style={{ gap: 12 }}>{facts.slice(2)}</div></>}
        <p className="sub" style={{ fontSize: desktop ? 13 : 12 }}>{h.about}</p>
        <p className="small">Drop-off: {h.address} · {h.dropoffHours}</p>
        <Link to={`/homes/${h.id}`} className="link">Preview public page →</Link>
      </div>
      {buttons}
    </div>
  );
}

/** P1 Home approvals */
export function Approvals() {
  const desktop = useIsDesktop();
  const { data: homes } = useData(() => api.allHomes(), []);
  const pending = (homes ?? []).filter((h) => h.status === 'Pending').sort((a, b) => a.createdAt - b.createdAt);
  const reviewed = (homes ?? []).filter((h) => h.status !== 'Pending').sort((a, b) => (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0));
  return (
    <Shell>
      <PageHeader title="Home approvals" sub={desktop ? 'New homes stay hidden from donors until your team approves them' : `${pending.length} homes waiting for review`} />
      <PushPrompt text="Get notified when a new home registers." />
      {!homes ? <Spinner /> : pending.length === 0 ? <div className="card empty">No homes waiting for review.</div> : pending.map((h) => <PendingCard key={h.id} h={h} />)}
      {reviewed.length > 0 && (
        <>
          <h3>Recently reviewed</h3>
          {desktop ? (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Home</th><th>Area</th><th>Reviewed</th><th>Decision</th><th>Change</th></tr></thead>
              <tbody>
                {reviewed.map((h) => (
                  <tr key={h.id}>
                    <td><Link to={`/homes/${h.id}`} style={{ fontWeight: 600 }}>{h.name}</Link>{h.reviewNote && <div className="small">Reason: {h.reviewNote}</div>}</td><td>{h.area}</td><td className="nowrap">{formatTs(h.reviewedAt)}</td>
                    <td className="nowrap"><StatusTag h={h} /></td>
                    <td><StatusActions h={h} /></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            reviewed.map((h) => (
              <div key={h.id} className="card stack" style={{ borderRadius: 14, gap: 10 }}>
                <div className="between" style={{ alignItems: 'flex-start' }}>
                  <div className="grow" style={{ minWidth: 0 }}><b>{h.name}</b><p className="small">{h.area} · {formatTs(h.reviewedAt)}</p>{h.reviewNote && <p className="small">Reason: {h.reviewNote}</p>}</div>
                  <StatusTag h={h} />
                </div>
                <StatusActions h={h} />
              </div>
            ))
          )}
        </>
      )}
    </Shell>
  );
}

/** P2 Platform overview */
export function Overview() {
  const desktop = useIsDesktop();
  const { data } = useData(async () => {
    const [homes, items, pledges, donors] = await Promise.all([api.allHomes(), api.allItems(), api.allPledges(), api.countDonors()]);
    return { homes, items, pledges, donors };
  }, []);
  if (!data) return <Shell><Spinner /></Shell>;
  const approved = data.homes.filter((h) => h.status === 'Approved');
  const pendingHomes = data.homes.length - approved.length - data.homes.filter((h) => h.status === 'Rejected').length;
  const by = (s: string[]) => data.pledges.filter((p) => s.includes(p.status)).length;
  const counts = [
    ['Pending', by(['Pending']), 'var(--yel)'],
    ['Accepted', by(['Accepted']), 'var(--teal)'],
    ['Received', by(['Received']), 'var(--green)'],
    [desktop ? 'Declined / cancelled' : 'Declined', by(['Declined', 'Cancelled']), 'var(--red)'],
  ] as const;
  const max = Math.max(1, ...counts.map((c) => c[1]));
  const itemsReceived = data.pledges.reduce((s, p) => s + (p.status === 'Received' ? p.qtyReceived : 0), 0);
  const stat = (l: string, v: number, s: string, c?: string) => (
    <div className="stat"><span className="l">{l}</span><span className="v" style={{ color: c }}>{v}</span><span className="small" style={{ fontSize: 11 }}>{s}</span></div>
  );
  return (
    <Shell>
      <PageHeader title="Overview" sub="Live numbers from the database" />
      <div className="stats" style={{ gridTemplateColumns: desktop ? 'repeat(4,1fr)' : '1fr 1fr' }}>
        {stat('Approved homes', approved.length, `${pendingHomes} waiting for review`)}
        {stat('Donors', data.donors, 'Registered accounts')}
        {stat('Pledges', data.pledges.length, `${by(['Pending'])} pending now`)}
        {stat('Items received', itemsReceived, 'Across all homes', 'var(--green)')}
      </div>
      <div className="card stack" style={{ padding: desktop ? 20 : 16, borderRadius: 16, gap: 12 }}>
        <h3>Pledges by status</h3>
        {counts.map(([l, v, c]) => (
          <div key={l} className="row" style={{ gap: 14 }}>
            <span style={{ width: desktop ? 170 : 84, fontSize: desktop ? 13 : 12, fontWeight: 600, flexShrink: 0 }}>{l}</span>
            <div className="grow"><div className="bar"><i style={{ width: `${Math.max(2, (v / max) * 100)}%`, background: c }} /></div></div>
            <b style={{ width: 28, fontSize: 13 }}>{v}</b>
          </div>
        ))}
      </div>
      <h3>Fulfilment by home</h3>
      {desktop ? (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Home</th><th>Open needs</th><th>Pledges</th><th>Fulfilment</th></tr></thead>
          <tbody>
            {approved.map((h) => {
              const s = homeSummary(h, data.items);
              return (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.name}</td><td>{s.open}</td><td>{data.pledges.filter((p) => p.homeId === h.id).length}</td>
                  <td><div className="row" style={{ gap: 10 }}><div style={{ width: 140 }}><Bar pct={s.pct} /></div><b className="nowrap">{Math.round(s.pct * 100)}%</b></div></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      ) : (
        approved.map((h) => {
          const s = homeSummary(h, data.items);
          return (
            <div key={h.id} className="card stack" style={{ gap: 8, borderRadius: 14 }}>
              <div className="between" style={{ alignItems: 'flex-start' }}><b>{h.name}</b><b className="nowrap" style={{ color: 'var(--teal)' }}>{Math.round(s.pct * 100)}%</b></div>
              <Bar pct={s.pct} />
              <span className="small">{s.open} open needs · {data.pledges.filter((p) => p.homeId === h.id).length} pledges</span>
            </div>
          );
        })
      )}
    </Shell>
  );
}

/** Platform admins (add / remove by email) and your own account settings. */
export function PlatformAdmins() {
  return (
    <Shell>
      <PageHeader title="Admins" sub="Who can approve homes, and your own settings" />
      <div className="stack" style={{ maxWidth: 640 }}>
        <ManagersPanel />
        <AccountSettings logout />
      </div>
    </Shell>
  );
}

/** All homes, with each home's managers (change the Gmail linked to a home). */
export function PlatformHomes() {
  const desktop = useIsDesktop();
  const [open, setOpen] = useState<Home | null>(null);
  const { data: homes } = useData(() => api.allHomes(), []);
  const list = (homes ?? []).sort((a, b) => a.name.localeCompare(b.name));
  const statusTag = (h: Home) => <StatusTag h={h} />;
  return (
    <Shell>
      <PageHeader title="Homes" sub="Every registered home. Use Managers to change which Gmail runs a home." />
      {!homes ? <Spinner /> : desktop ? (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Home</th><th>Status</th><th>Change status</th><th>Managers</th></tr></thead>
          <tbody>
            {list.map((h) => (
              <tr key={h.id}>
                <td><Link to={`/homes/${h.id}`} style={{ fontWeight: 600 }}>{h.name}</Link><div className="small">{h.type} · {h.area}</div></td><td className="nowrap">{statusTag(h)}</td>
                <td><StatusActions h={h} /></td>
                <td><button className="btn btn-sm btn-plain" onClick={() => setOpen(h)}>Managers</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      ) : (
        list.map((h) => (
          <div key={h.id} className="card stack" style={{ borderRadius: 14, gap: 10 }}>
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <div className="grow" style={{ minWidth: 0 }}><b>{h.name}</b><p className="small">{h.type} · {h.area}</p></div>
              {statusTag(h)}
            </div>
            <div className="between wrap" style={{ gap: 8 }}>
              <StatusActions h={h} />
              <button className="btn btn-sm btn-plain" onClick={() => setOpen(h)}>Managers</button>
            </div>
          </div>
        ))
      )}
      {open && (
        <div className="overlay" onClick={() => setOpen(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="between"><h2 style={{ fontWeight: 800 }}>{open.name}</h2><button className="x" onClick={() => setOpen(null)} aria-label="Close">×</button></div>
            <ManagersPanel home={open} />
          </div>
        </div>
      )}
    </Shell>
  );
}

/** Platform admin's own account and notification settings. */
export function PlatformAccount() {
  return (
    <Shell>
      <PageHeader title="Account" sub="Your details and notification settings" />
      <div style={{ maxWidth: 640 }}><AccountSettings logout /></div>
    </Shell>
  );
}
