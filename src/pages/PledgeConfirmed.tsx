import { Link, useParams } from 'react-router-dom';
import { DonorLayout, PushPrompt } from '../components/layout';
import { Icon, PledgeTag, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { formatDate } from '../lib/logic';
import { useData, useIsDesktop } from '../lib/useData';

/** D5 Pledge confirmed */
export default function PledgeConfirmed() {
  const { id = '' } = useParams();
  const desktop = useIsDesktop();
  const { data } = useData(async () => {
    const p = await api.getPledge(id);
    const h = p ? await api.getHome(p.homeId) : null;
    return { p, h };
  }, [id]);
  if (!data) return <DonorLayout noTabs><Spinner /></DonorLayout>;
  const { p, h } = data;
  if (!p) return <DonorLayout><div className="content container"><div className="card empty">Pledge not found.</div></div></DonorLayout>;

  const kv = (k: string, v: React.ReactNode) => (
    <div className="between"><span className="small" style={{ fontSize: desktop ? 13 : 12 }}>{k}</span><b style={{ textAlign: 'right' }}>{v}</b></div>
  );
  const body = (
    <div className="stack" style={{ alignItems: 'center', textAlign: 'center', gap: desktop ? 18 : 16, width: '100%' }}>
      <div style={{ width: 88, height: 88, borderRadius: 44, background: 'var(--green-l)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 40, height: 40, stroke: 'var(--green)', display: 'flex' }}>{Icon.check}</span>
      </div>
      <h1 style={{ fontSize: desktop ? 30 : 26 }}>Pledge sent!</h1>
      <p className="sub">{p.homeName} will review it. We've emailed you the details.</p>
      <div className={desktop ? 'stack' : 'card stack'} style={{ width: '100%', textAlign: 'left', gap: 10, ...(desktop ? { background: 'var(--bg)', borderRadius: 16, padding: 16 } : {}) }}>
        {kv('Pledge no.', p.pledgeNo)}
        {kv('Item', `${p.itemName} × ${p.quantity}`)}
        {kv('Drop-off', formatDate(p.dropoffDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))}
        {kv('Status', <PledgeTag s={p.status} />)}
      </div>
      <div className={desktop ? '' : 'card'} style={{ width: '100%', textAlign: desktop ? 'center' : 'left', padding: desktop ? 0 : 12 }}>
        <p className="small" style={{ fontSize: desktop ? 13 : 12 }}><b style={{ color: 'var(--ink)' }}>Drop-off address:</b> {h?.address} · {h?.dropoffHours}</p>
      </div>
      <div style={{ width: '100%' }}><PushPrompt text="Get a notification when the home accepts your pledge." /></div>
      <div className={desktop ? 'row' : 'stack'} style={{ width: '100%', gap: desktop ? 12 : 10 }}>
        <Link to="/my-pledges" className={`btn${desktop ? ' grow' : ' btn-block'}`}>View my pledges</Link>
        <Link to="/homes" className={`btn btn-ghost${desktop ? ' grow' : ' btn-block'}`}>Back to homes</Link>
      </div>
    </div>
  );
  return (
    <DonorLayout noTabs hideMobileHeader>
      {desktop ? (
        <div className="container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 72px)' }}>
          <div className="card" style={{ width: 560, padding: 40, borderRadius: 24 }}>{body}</div>
        </div>
      ) : (
        <div className="content" style={{ minHeight: '100vh', justifyContent: 'center', padding: '40px 20px' }}>{body}</div>
      )}
    </DonorLayout>
  );
}
