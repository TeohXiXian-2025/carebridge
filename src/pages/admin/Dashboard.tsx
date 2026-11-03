import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PushPrompt } from '../../components/layout';
import { Tag } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { canPledge } from '../../lib/logic';
import type { Home, Pledge } from '../../lib/types';
import { useData, useIsDesktop } from '../../lib/useData';
import { HomeAdminPage, PageHeader } from './AdminShell';
import { MarkReceived, PledgeCard, PledgeTable } from './PledgeActions';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** A1 Dashboard */
function Dashboard({ home }: { home: Home }) {
  const { user } = useAuth();
  const desktop = useIsDesktop();
  const [receiving, setReceiving] = useState<Pledge | null>(null);
  const { data } = useData(async () => {
    const [items, pledges] = await Promise.all([api.homeItems(home.id, true), user ? api.homePledges(user) : []]);
    return { items, pledges };
  }, [home.id, user?.id]);
  const items = data?.items ?? [];
  const pledges = data?.pledges ?? [];
  const open = items.filter(canPledge);
  const pending = pledges.filter((p) => p.status === 'Pending').sort((a, b) => a.createdAt - b.createdAt);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const receivedMonth = pledges.filter((p) => p.status === 'Received' && (p.receivedAt ?? 0) >= monthStart);
  const short = home.name.replace(/(Elderly|Children's|Children’s)?\s*(Home|Shelter)$/i, '').trim();
  const month = new Date().toLocaleDateString('en-MY', { month: 'short' });

  const stat = (l: string, v: number, sub: string, c: string) => (
    <div className="stat"><span className="l">{l}</span><span className="v" style={{ color: c }}>{v}</span>{desktop && <span className="small">{sub}</span>}</div>
  );
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${short}`}
        sub={new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        right={desktop && <Link to="/admin/wishlist?add=1" className="btn">+ Add need</Link>}
      />
      <div className="stats">
        {stat('Open needs', open.length, `${open.filter((i) => i.priority === 'High').length} marked High priority`, 'var(--red)')}
        {stat(desktop ? 'Pending pledges' : 'Pending', pending.length, 'Waiting for you to accept', 'var(--yel)')}
        {stat(desktop ? 'Items received this month' : `Received (${month})`, receivedMonth.reduce((s, p) => s + p.qtyReceived, 0), `From ${new Set(receivedMonth.map((p) => p.donorId)).size} donors`, 'var(--green)')}
      </div>
      <PushPrompt text="Get a notification on this device for every new pledge." />
      <div className="between">
        <div className="row"><h3>{desktop ? 'New pledges waiting for action' : 'New pledges'}</h3><Tag cls="t-yel">{pending.length}</Tag></div>
        <Link to="/admin/pledges" className="link">See all</Link>
      </div>
      {pending.length === 0 ? (
        <div className="card empty">No new pledges right now.</div>
      ) : desktop ? (
        <PledgeTable list={pending} onReceive={setReceiving} showStatus={false} />
      ) : (
        pending.map((p) => <PledgeCard key={p.id} p={p} onReceive={setReceiving} />)
      )}
      {!desktop && <Link to="/admin/wishlist?add=1" className="btn btn-ghost btn-block">+ Add a need</Link>}
      {receiving && <MarkReceived p={receiving} item={items.find((i) => i.id === receiving.itemId)} onClose={() => setReceiving(null)} />}
    </>
  );
}

export default function DashboardPage() {
  return <HomeAdminPage>{(home) => <Dashboard home={home} />}</HomeAdminPage>;
}
