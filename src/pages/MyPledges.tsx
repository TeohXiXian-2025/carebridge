import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DonorLayout, PushPrompt } from '../components/layout';
import { PledgeTag, Spinner, useToast } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDate } from '../lib/logic';
import type { Pledge } from '../lib/types';
import { useData, useIsDesktop } from '../lib/useData';

const STAGE: Record<Pledge['status'], number> = { Pending: 0, Accepted: 1, Received: 2, Declined: -1, Cancelled: -1 };
function Timeline({ p, compact }: { p: Pledge; compact?: boolean }) {
  const s = STAGE[p.status];
  if (s < 0) return null;
  return (
    <div className="stack" style={{ gap: 6, width: compact ? 150 : '100%' }}>
      <div className="tl">
        <span className="d on" /><span className={`l${s >= 1 ? ' on' : ''}`} /><span className={`d${s >= 1 ? ' on' : ''}`} />
        <span className={`l${s >= 2 ? ' on' : ''}`} /><span className={`d${s >= 2 ? ' on' : ''}`} />
      </div>
      {!compact && (
        <div className="between small" style={{ fontSize: 11, fontWeight: 600 }}><span>Pending</span><span>Accepted</span><span>Received</span></div>
      )}
    </div>
  );
}

const TABS = [
  { key: 'active', label: 'Active', test: (p: Pledge) => p.status === 'Pending' || p.status === 'Accepted' },
  { key: 'done', label: 'Completed', test: (p: Pledge) => p.status === 'Received' },
  { key: 'closed', label: 'Cancelled', test: (p: Pledge) => p.status === 'Cancelled' || p.status === 'Declined' },
];

/** D6 My pledges */
export default function MyPledges() {
  const { user } = useAuth();
  const desktop = useIsDesktop();
  const toast = useToast();
  const [tab, setTab] = useState('active');
  const [busy, setBusy] = useState<string | null>(null);
  const { data } = useData(() => (user ? api.myPledges(user.id) : Promise.resolve([])), [user?.id]);

  const cancel = async (p: Pledge) => {
    if (!confirm(`Cancel pledge ${p.pledgeNo}?`)) return;
    setBusy(p.id);
    try {
      await api.setPledgeStatus(p.id, 'Cancelled');
      toast('Pledge cancelled');
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(null);
  };

  const all = (data ?? []).sort((a, b) => b.createdAt - a.createdAt);
  const t = TABS.find((x) => x.key === tab)!;
  const list = all.filter(t.test);
  const seg = (
    <div className="seg" style={desktop ? { width: 460 } : undefined}>
      {TABS.map((x) => (
        <button key={x.key} className={tab === x.key ? 'on' : ''} onClick={() => setTab(x.key)}>
          {x.label}{x.key !== 'closed' && ` (${all.filter(x.test).length})`}
        </button>
      ))}
    </div>
  );
  const empty = (
    <div className="card empty">
      {tab === 'active' ? <>No active pledges. <Link to="/homes" className="link">Find a home to help</Link></> : 'Nothing here yet.'}
    </div>
  );
  const action = (p: Pledge) =>
    p.status === 'Pending' || p.status === 'Accepted' ? (
      <button className="btn btn-sm btn-muted" disabled={busy === p.id} onClick={() => cancel(p)}>Cancel pledge</button>
    ) : p.status === 'Received' ? (
      <span className="small">Received {p.qtyReceived} · thank you!</span>
    ) : null;

  if (!data) return <DonorLayout title="My pledges"><Spinner /></DonorLayout>;

  if (!desktop)
    return (
      <DonorLayout title="My pledges">
        <div className="content">
          {seg}
          <PushPrompt text="Get notified when homes accept or receive your pledges." />
          {list.length === 0 && empty}
          {list.map((p) => (
            <div key={p.id} className="card stack" style={{ gap: 10 }}>
              <div className="between"><span className="small">{p.pledgeNo}</span><PledgeTag s={p.status} /></div>
              <h3>{p.itemName} × {p.quantity}</h3>
              <p className="small">{p.homeName} · Drop off {formatDate(p.dropoffDate)}</p>
              <Timeline p={p} />
              {action(p) && <div>{action(p)}</div>}
            </div>
          ))}
        </div>
      </DonorLayout>
    );

  return (
    <DonorLayout>
      <div className="container">
        <div>
          <h1>My pledges</h1>
          <p className="sub">Track each pledge from Pending to Received.</p>
        </div>
        {seg}
        <PushPrompt text="Get notified when homes accept or receive your pledges." />
        {list.length === 0 ? empty : (
          <table className="table">
            <thead><tr><th>Pledge no.</th><th>Item</th><th>Home</th><th>Drop-off</th><th>Progress</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.pledgeNo}</td>
                  <td>{p.itemName} × {p.quantity}</td>
                  <td><Link to={`/homes/${p.homeId}`}>{p.homeName}</Link></td>
                  <td>{formatDate(p.dropoffDate)}</td>
                  <td><div className="stack" style={{ gap: 6 }}><PledgeTag s={p.status} /><Timeline p={p} compact /></div></td>
                  <td>{action(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="card row" style={{ gap: 24, padding: 20, alignItems: 'flex-start', borderRadius: 16 }}>
          {[
            ['Pending', 'The home checks your pledge. You get an email when they accept it.'],
            ['Accepted', 'Bring the items on your drop-off date during drop-off hours.'],
            ['Received', 'The home confirms delivery and the wishlist updates for everyone.'],
          ].map(([t2, d], k) => (
            <div key={t2} className="row grow" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span className="num">{k + 1}</span>
              <div><b>{t2}</b><p className="sub" style={{ fontSize: 13 }}>{d}</p></div>
            </div>
          ))}
        </div>
      </div>
    </DonorLayout>
  );
}
