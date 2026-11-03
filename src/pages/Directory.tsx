import { Link, useSearchParams } from 'react-router-dom';
import { DonorLayout } from '../components/layout';
import { Bar, HomePhoto, Spinner, Tag, UrgentTag } from '../components/ui';
import { api } from '../lib/api';
import { canPledge, homeSummary } from '../lib/logic';
import { CATEGORIES, type Category, type Home, type HomeType } from '../lib/types';
import { useData, useIsDesktop } from '../lib/useData';

type Summary = ReturnType<typeof homeSummary>;

function MobileCard({ h, s }: { h: Home; s: Summary }) {
  return (
    <Link to={`/homes/${h.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="row" style={{ gap: 12 }}>
        <HomePhoto home={h} w={72} h={72} />
        <div className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <h3>{h.name}</h3>
          <div className="row"><Tag cls="t-teal">{h.type}</Tag><span className="small">{h.area}</span></div>
          {s.urgent && <span><UrgentTag label="Urgent need" /></span>}
        </div>
      </div>
      <Bar pct={s.pct} />
      <p className="qty"><b>{s.done} of {s.total}</b> needs fulfilled</p>
    </Link>
  );
}

function DesktopCard({ h, s }: { h: Home; s: Summary }) {
  return (
    <div className="homecard">
      <HomePhoto home={h} w="100%" h={140} radius={0} font={28} />
      <div className="stack" style={{ padding: 16, gap: 10 }}>
        <h3>{h.name}</h3>
        <div className="row wrap"><Tag cls="t-teal">{h.type}</Tag><span className="small">{h.area}</span>{s.urgent && <UrgentTag label="Urgent need" />}</div>
        <Bar pct={s.pct} />
        <p className="qty"><b>{s.done} of {s.total}</b> needs fulfilled</p>
        <Link to={`/homes/${h.id}`} className="btn btn-sm btn-ghost btn-block">View wishlist</Link>
      </div>
    </div>
  );
}

/** D2 Home Directory */
export default function Directory() {
  const desktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const { data } = useData(async () => {
    const [homes, items] = await Promise.all([api.approvedHomes(), api.publicItems()]);
    return { homes, items };
  }, []);

  const q = params.get('q') ?? '';
  const urgentOnly = params.get('urgent') === '1';
  const type = (params.get('type') ?? '') as HomeType | '';
  const area = params.get('area') ?? '';
  const cat = (params.get('cat') ?? '') as Category | '';
  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  if (!data) return <DonorLayout title="Welfare homes"><Spinner /></DonorLayout>;
  const areas = [...new Set(data.homes.map((h) => h.area))].sort();
  const rows = data.homes
    .map((h) => ({ h, s: homeSummary(h, data.items) }))
    .filter(({ h, s }) => {
      if (q && !`${h.name} ${h.area}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (urgentOnly && !s.urgent) return false;
      if (type && h.type !== type) return false;
      if (area && h.area !== area) return false;
      if (cat && !data.items.some((i) => i.homeId === h.id && i.category === cat && canPledge(i))) return false;
      return true;
    })
    .sort((a, b) => Number(b.s.urgent) - Number(a.s.urgent) || a.s.pct - b.s.pct);

  const search = (
    <input className="input" placeholder="Search by home name or area" value={q} onChange={(e) => set('q', e.target.value || null)} aria-label="Search homes" />
  );
  const results = rows.length ? null : <div className="card empty">No homes match these filters.</div>;

  if (!desktop)
    return (
      <DonorLayout title="Welfare homes">
        <div className="content">
          {search}
          <div className="chips">
            <button className={`chip urg${urgentOnly ? ' on' : ''}`} onClick={() => set('urgent', urgentOnly ? null : '1')}>Urgent only</button>
            <select className={`chip select${type ? ' on' : ''}`} value={type} onChange={(e) => set('type', e.target.value || null)} aria-label="Home type">
              <option value="">All types</option><option>Children</option><option>Elderly</option>
            </select>
            <select className={`chip select${area ? ' on' : ''}`} value={area} onChange={(e) => set('area', e.target.value || null)} aria-label="Area">
              <option value="">Area</option>{areas.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select className={`chip select${cat ? ' on' : ''}`} value={cat} onChange={(e) => set('cat', e.target.value || null)} aria-label="Category">
              <option value="">Category</option>{CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <p className="small">{rows.length} approved home{rows.length === 1 ? '' : 's'}</p>
          {results}
          {rows.map(({ h, s }) => <MobileCard key={h.id} h={h} s={s} />)}
        </div>
      </DonorLayout>
    );

  const opt = (label: string, on: boolean, toggle: () => void) => (
    <label className="opt" key={label}><input type="checkbox" checked={on} onChange={toggle} />{label}</label>
  );
  return (
    <DonorLayout>
      <div className="container">
        <div>
          <h1>Welfare homes</h1>
          <p className="sub">Every home here has been reviewed by the CareBridge team.</p>
        </div>
        <div className="dir">
          <aside className="filters">
            <h3>Filters</h3>
            <div className="between">
              <span style={{ fontWeight: 600 }}>Urgent needs only</span>
              <button className={`toggle${urgentOnly ? ' on' : ''}`} aria-pressed={urgentOnly} aria-label="Urgent needs only" onClick={() => set('urgent', urgentOnly ? null : '1')} />
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <span className="small" style={{ fontWeight: 700 }}>Home type</span>
              {(['Children', 'Elderly'] as const).map((t) => opt(t, type === t, () => set('type', type === t ? null : t)))}
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <span className="small" style={{ fontWeight: 700 }}>Area</span>
              {areas.map((a) => opt(a, area === a, () => set('area', area === a ? null : a)))}
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <span className="small" style={{ fontWeight: 700 }}>Item category</span>
              {CATEGORIES.map((c) => opt(c.label, cat === c.code, () => set('cat', cat === c.code ? null : c.code)))}
            </div>
            <button className="btn btn-sm btn-muted" onClick={() => setParams({}, { replace: true })}>Clear filters</button>
          </aside>
          <div className="stack grow" style={{ gap: 16 }}>
            {search}
            <p className="small">{rows.length} approved home{rows.length === 1 ? '' : 's'} · most urgent first</p>
            {results}
            <div className="grid3">{rows.map(({ h, s }) => <DesktopCard key={h.id} h={h} s={s} />)}</div>
          </div>
        </div>
      </div>
    </DonorLayout>
  );
}
