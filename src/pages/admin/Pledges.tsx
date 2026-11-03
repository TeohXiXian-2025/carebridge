import { useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Home, Pledge } from '../../lib/types';
import { useData, useIsDesktop } from '../../lib/useData';
import { HomeAdminPage, PageHeader } from './AdminShell';
import { MarkReceived, PledgeCard, PledgeTable } from './PledgeActions';

const FILTERS: { key: string; label: string; test: (p: Pledge) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'pending', label: 'Pending', test: (p) => p.status === 'Pending' },
  { key: 'accepted', label: 'Accepted', test: (p) => p.status === 'Accepted' },
  { key: 'received', label: 'Received', test: (p) => p.status === 'Received' },
  { key: 'closed', label: 'Declined / cancelled', test: (p) => p.status === 'Declined' || p.status === 'Cancelled' },
];
const ORDER: Record<Pledge['status'], number> = { Pending: 0, Accepted: 1, Received: 2, Declined: 3, Cancelled: 4 };

/** A3 Manage pledges + A4 Mark as received */
function Pledges({ home }: { home: Home }) {
  const { user } = useAuth();
  const desktop = useIsDesktop();
  const [f, setF] = useState('all');
  const [receiving, setReceiving] = useState<Pledge | null>(null);
  const { data } = useData(async () => {
    const [pledges, items] = await Promise.all([user ? api.homePledges(user) : [], api.homeItems(home.id, true)]);
    return { pledges, items };
  }, [user?.id, home.id]);
  const all = (data?.pledges ?? []).sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.createdAt - a.createdAt);
  const filter = FILTERS.find((x) => x.key === f)!;
  const list = all.filter(filter.test);
  const label = (x: (typeof FILTERS)[number]) => `${x.label} (${all.filter(x.test).length})`;

  return (
    <>
      <PageHeader title="Pledges" sub={desktop ? 'Accept pledges, then mark them received when the donor drops off' : undefined} />
      {desktop ? (
        <div className="tabs">{FILTERS.map((x) => <button key={x.key} className={f === x.key ? 'on' : ''} onClick={() => setF(x.key)}>{label(x)}</button>)}</div>
      ) : (
        <div className="chips">{FILTERS.slice(0, 4).map((x) => <button key={x.key} className={`chip${f === x.key ? ' on' : ''}`} onClick={() => setF(x.key)}>{label(x)}</button>)}</div>
      )}
      {data && list.length === 0 && <div className="card empty">No pledges here yet.</div>}
      {list.length > 0 && (desktop ? <PledgeTable list={list} onReceive={setReceiving} /> : list.map((p) => <PledgeCard key={p.id} p={p} onReceive={setReceiving} />))}
      {receiving && <MarkReceived p={receiving} item={data?.items.find((i) => i.id === receiving.itemId)} onClose={() => setReceiving(null)} />}
    </>
  );
}

export default function PledgesPage() {
  return <HomeAdminPage>{(home) => <Pledges home={home} />}</HomeAdminPage>;
}
