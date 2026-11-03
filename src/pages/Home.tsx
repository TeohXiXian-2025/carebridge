import { Link } from 'react-router-dom';
import { DonorLayout } from '../components/layout';
import { ItemCard } from '../components/items';
import { api } from '../lib/api';
import { isUrgent, sortItems } from '../lib/logic';
import { useData, useIsDesktop } from '../lib/useData';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  ['Find a home', 'Browse approved homes near you'],
  ['Pick a needed item', 'Every item shows what is still needed'],
  ['Pledge a quantity', 'The home accepts your pledge'],
  ['Drop it off', 'The home marks it received'],
];

/** D1 Home */
export default function HomePage() {
  const desktop = useIsDesktop();
  const nav = useNavigate();
  const { data: items } = useData(() => api.publicItems(), []);
  const urgent = sortItems((items ?? []).filter(isUrgent)).slice(0, desktop ? 3 : 2);

  return (
    <DonorLayout>
      <div className={desktop ? 'container' : 'content'}>
        <section className="hero">
          <div className="stack grow" style={{ gap: desktop ? 18 : 12 }}>
            <span className="tag">For welfare homes in Klang Valley</span>
            <h1>Give what is needed, not what is guessed.</h1>
            <p className="sub">
              See what children's and elderly homes {desktop && 'in the Klang Valley '}actually need right now, pledge an item, and drop it off{desktop && ' yourself'}.
            </p>
            <div className="row" style={{ gap: 12 }}>
              <Link to="/homes" className={`btn btn-inv${desktop ? '' : ' btn-block'}`}>Browse homes</Link>
              {desktop && <Link to="/register-home" className="btn btn-clear">Register a home</Link>}
            </div>
          </div>
          {desktop && (
            <div className="hero-steps">
              <h3>How it works</h3>
              {STEPS.map(([t, d], k) => (
                <div className="step" key={t}>
                  <span className="num">{k + 1}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t}</div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#CFEAE4' }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {!desktop && (
          <>
            <h3>How it works</h3>
            <div className="steps">
              {STEPS.map(([t], k) => (
                <div className="step" key={t}>
                  <span className="num">{k + 1}</span>
                  {t}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="between">
          {desktop ? <h2>Urgent needs right now</h2> : <h3>Urgent needs</h3>}
          <Link to="/homes?urgent=1" className="link">{desktop ? 'See all homes →' : 'See all'}</Link>
        </div>
        {items && urgent.length === 0 && <div className="card empty">No urgent needs right now. Thank you, donors!</div>}
        <div className="grid3">
          {urgent.map((i) => (
            <ItemCard key={i.id} item={i} showHome onPledge={() => nav(`/homes/${i.homeId}?pledge=${i.id}`)} />
          ))}
        </div>
      </div>
    </DonorLayout>
  );
}
