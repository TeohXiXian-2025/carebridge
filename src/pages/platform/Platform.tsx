import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout, PLATFORM_NAV, PushPrompt, RequireRole } from '../../components/layout';
import { Bar, HomePhoto, Spinner, Tag, useToast } from '../../components/ui';
import { api } from '../../lib/api';
import { formatTs, homeSummary } from '../../lib/logic';
import type { Home } from '../../lib/types';
import { useData, useIsDesktop } from '../../lib/useData';
import { PageHeader } from '../admin/AdminShell';

const Shell = ({ children }: { children: React.ReactNode }) => (
  <RequireRole role="platformAdmin">
    <AdminLayout nav={PLATFORM_NAV} subtitle="Platform admin">{children}</AdminLayout>
  </RequireRole>
);
const kv = (k: string, v: string) => (
  <div key={k} className="stack grow" style={{ gap: 2, minWidth: 0 }}>
    <span className="small" style={{ fontSize: 11, fontWeight: 600 }}>{k}</span>
    <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
  </div>
);

function PendingCard({ h }: { h: Home }) {
  const desktop = useIsDesktop();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const review = async (approve: boolean) => {
    if (!approve && !confirm(`Reject ${h.name}?`)) return;
    setBusy(true);
    try {
      await api.reviewHome(h.id, approve);
      toast(approve ? `${h.name} is now visible to donors` : 'Registration rejected');
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };
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
        {!desktop && <div className="stack" style={{ gap: 6 }}><h3>{h.name}</h3><span><Tag cls="t-yel">Pending review</Tag></span></div>}
      </div>
      <div className="stack grow" style={{ gap: 10 }}>
        {desktop && <div className="row"><h3 style={{ fontSize: 17 }}>{h.name}</h3><Tag cls="t-yel">Pending review</Tag></div>}
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
            <table className="table">
              <thead><tr><th>Home</th><th>Type</th><th>Area</th><th>Reviewed</th><th>Decision</th></tr></thead>
              <tbody>
                {reviewed.map((h) => (
                  <tr key={h.id}>
                    <td><Link to={`/homes/${h.id}`} style={{ fontWeight: 600 }}>{h.name}</Link></td><td>{h.type}</td><td>{h.area}</td><td>{formatTs(h.reviewedAt)}</td>
                    <td><Tag cls={h.status === 'Approved' ? 't-green' : 't-red'}>{h.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            reviewed.map((h) => (
              <div key={h.id} className="card between" style={{ borderRadius: 14 }}>
                <div><b>{h.name}</b><p className="small">{h.area} · {formatTs(h.reviewedAt)}</p></div>
                <Tag cls={h.status === 'Approved' ? 't-green' : 't-red'}>{h.status}</Tag>
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
        <table className="table">
          <thead><tr><th>Home</th><th>Open needs</th><th>Pledges</th><th>Fulfilment</th></tr></thead>
          <tbody>
            {approved.map((h) => {
              const s = homeSummary(h, data.items);
              return (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.name}</td><td>{s.open}</td><td>{data.pledges.filter((p) => p.homeId === h.id).length}</td>
                  <td><div className="row" style={{ gap: 10 }}><div style={{ width: 140 }}><Bar pct={s.pct} /></div><b>{Math.round(s.pct * 100)}%</b></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        approved.map((h) => {
          const s = homeSummary(h, data.items);
          return (
            <div key={h.id} className="card stack" style={{ gap: 8, borderRadius: 14 }}>
              <div className="between"><b>{h.name}</b><b style={{ color: 'var(--teal)' }}>{Math.round(s.pct * 100)}%</b></div>
              <Bar pct={s.pct} />
              <span className="small">{s.open} open needs · {data.pledges.filter((p) => p.homeId === h.id).length} pledges</span>
            </div>
          );
        })
      )}
    </Shell>
  );
}
