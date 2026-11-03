import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DonorLayout } from '../components/layout';
import { ItemCard, ItemRow, PledgeSheet } from '../components/items';
import { Bar, HomePhoto, Spinner, Tag } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fulfilment, sortItems } from '../lib/logic';
import { CATEGORIES, type Category, type WishlistItem } from '../lib/types';
import { useData, useIsDesktop } from '../lib/useData';

/** D3 Home profile + D4 pledge pop-up */
export default function HomeProfile() {
  const { id = '' } = useParams();
  const desktop = useIsDesktop();
  const { user } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<Category | ''>('');
  const { data, error } = useData(async () => {
    const home = await api.getHome(id);
    const items = home ? await api.homeItems(id, false) : [];
    return { home, items: sortItems(items) };
  }, [id]);

  const pledgeId = params.get('pledge');
  const pledging = data?.items.find((i) => i.id === pledgeId) ?? null;
  const openPledge = (i: WishlistItem) => {
    if (!user) return nav(`/login?next=${encodeURIComponent(`/homes/${id}?pledge=${i.id}`)}`);
    setParams({ pledge: i.id });
  };
  const close = () => setParams({}, { replace: true });
  useEffect(() => {
    if (pledgeId && !user) nav(`/login?next=${encodeURIComponent(`/homes/${id}?pledge=${pledgeId}`)}`, { replace: true });
  }, [pledgeId, user, id, nav]);

  if (error) return <DonorLayout><div className="content"><div className="error">{error}</div></div></DonorLayout>;
  if (!data) return <DonorLayout><Spinner /></DonorLayout>;
  const { home, items } = data;
  if (!home || (home.status !== 'Approved' && user?.id !== home.adminId && user?.role !== 'platformAdmin'))
    return (
      <DonorLayout>
        <div className="content container"><div className="card empty">This home isn't available. <Link className="link" to="/homes">Back to homes</Link></div></div>
      </DonorLayout>
    );

  const f = fulfilment(items);
  // Donors only see what is still useful: no paused or already-fulfilled needs.
  const shown = items.filter((i) => i.status !== 'Paused' && i.status !== 'Fulfilled' && (!cat || i.category === cat));
  const doneCount = items.filter((i) => i.status === 'Fulfilled').length;
  const doneNote = doneCount > 0 && <p className="small">{doneCount} need{doneCount === 1 ? ' is' : 's are'} already fulfilled. Thank you, donors!</p>;
  const cover = (
    <div style={{ position: 'relative' }}>
      <HomePhoto home={home} w="100%" h={desktop ? 200 : 150} radius={0} font={28} />
      <button className="hide-d" onClick={() => nav(-1)} aria-label="Back" style={{ position: 'absolute', top: 12, left: 16, width: 36, height: 36, borderRadius: 18, background: '#fff', fontSize: 22, fontWeight: 700 }}>‹</button>
    </div>
  );
  const sheet = pledging && user && <PledgeSheet item={pledging} home={home} onClose={close} />;
  const pending = home.status !== 'Approved' && <div className="note">Preview: this home is <b>{home.status.toLowerCase()}</b>, so donors can't see it yet.</div>;

  if (!desktop)
    return (
      <DonorLayout hideMobileHeader>
        {cover}
        <div className="content" style={{ paddingTop: 14 }}>
          {pending}
          <div className="stack" style={{ gap: 6 }}>
            <h2>{home.name}</h2>
            <div className="row"><Tag cls="t-teal">{home.type}</Tag><span className="small">{home.area}</span></div>
          </div>
          <div className="card stack" style={{ gap: 6, padding: 12 }}>
            <p className="sub" style={{ fontSize: 13 }}>{home.about}</p>
            <p className="small"><b style={{ color: 'var(--ink)' }}>Drop-off:</b> {home.dropoffHours} · {home.address}</p>
          </div>
          <div className="between"><h3>Wishlist ({shown.length})</h3><span className="small">Sorted by priority</span></div>
          {shown.length === 0 && <div className="card empty">No open needs right now.</div>}
          {shown.map((i) => <ItemCard key={i.id} item={i} onPledge={openPledge} />)}
          {doneNote}
        </div>
        {sheet}
      </DonorLayout>
    );

  return (
    <DonorLayout>
      {cover}
      <div className="container" style={{ paddingTop: 28 }}>
        {pending}
        <div className="row" style={{ gap: 32, alignItems: 'flex-start' }}>
          <aside className="stack" style={{ width: 340, flexShrink: 0, gap: 16 }}>
            <h1>{home.name}</h1>
            <div className="row"><Tag cls="t-teal">{home.type}</Tag><span className="small" style={{ fontSize: 13 }}>{home.area}</span></div>
            <div className="card stack" style={{ gap: 8, borderRadius: 16, padding: 16 }}>
              <p className="qty" style={{ fontSize: 13 }}><b>{f.done} of {f.total}</b> needs fulfilled</p>
              <Bar pct={f.pct} />
            </div>
            <div className="card stack" style={{ gap: 8, borderRadius: 16, padding: 16 }}>
              <h3 style={{ fontSize: 14 }}>About us</h3>
              <p className="sub" style={{ fontSize: 13, lineHeight: 1.5 }}>{home.about}</p>
            </div>
            <div className="note stack" style={{ gap: 6, padding: 16, borderRadius: 16, fontSize: 13 }}>
              <b style={{ fontSize: 14 }}>Drop-off</b>
              <span>{home.address}</span>
              <span>{home.dropoffHours}</span>
            </div>
          </aside>
          <section className="stack grow">
            <div className="between"><h2>Wishlist ({shown.length})</h2><span className="small" style={{ fontSize: 13 }}>Sorted by priority</span></div>
            <div className="chips">
              <button className={`chip${cat === '' ? ' on' : ''}`} onClick={() => setCat('')}>All</button>
              {CATEGORIES.map((c) => (
                <button key={c.code} className={`chip${cat === c.code ? ' on' : ''}`} onClick={() => setCat(c.code)}>{c.label}</button>
              ))}
            </div>
            {shown.length === 0 && <div className="card empty">No needs in this category right now.</div>}
            {shown.map((i) => <ItemRow key={i.id} item={i} onPledge={openPledge} />)}
            {doneNote}
          </section>
        </div>
      </div>
      {sheet}
    </DonorLayout>
  );
}
