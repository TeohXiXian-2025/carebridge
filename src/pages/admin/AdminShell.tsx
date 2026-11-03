import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout, HOME_ADMIN_NAV, RequireRole } from '../../components/layout';
import { Spinner, useToast } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Home } from '../../lib/types';
import { useData } from '../../lib/useData';

/** Wraps every home-admin page: role check, sidebar/tab bar, and loads the admin's home. */
export function HomeAdminPage({ children }: { children: (home: Home) => ReactNode }) {
  return (
    <RequireRole role="homeAdmin">
      <Inner>{children}</Inner>
    </RequireRole>
  );
}
function Inner({ children }: { children: (home: Home) => ReactNode }) {
  const { user } = useAuth();
  const { data: home } = useData(() => (user?.homeId ? api.getHome(user.homeId) : Promise.resolve(null)), [user?.homeId]);
  return (
    <AdminLayout nav={HOME_ADMIN_NAV} subtitle={home?.name ?? 'Welfare home'}>
      {home === undefined ? <Spinner /> : home === null ? <div className="card empty">Home not found.</div> : (
        <>
          {home.status === 'Pending' && <div className="note"><b>Waiting for approval.</b> Donors can't see your home yet. Add your wishlist now so it's ready.</div>}
          {home.status === 'Rejected' && <RejectedNote home={home} />}
          {children(home)}
        </>
      )}
    </AdminLayout>
  );
}

function RejectedNote({ home }: { home: Home }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const again = async () => {
    setBusy(true);
    try {
      await api.resubmitHome(home.id);
      toast('Sent for review again');
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <div className="error stack" style={{ gap: 8 }}>
      <span>Your registration was not approved.{home.reviewNote ? ` Reason: ${home.reviewNote}` : ''}</span>
      <span style={{ fontWeight: 500 }}>Update your details under Profile, then ask the CareBridge team to review it again.</span>
      <div className="row wrap" style={{ gap: 8 }}>
        <Link to="/admin/profile" className="btn btn-sm btn-plain">Edit home details</Link>
        <button className="btn btn-sm" disabled={busy} onClick={again}>Ask for review again</button>
      </div>
    </div>
  );
}

export const PageHeader = ({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) => (
  <div className="between" style={{ alignItems: 'flex-end' }}>
    <div className="stack" style={{ gap: 4 }}>
      <h1 style={{ fontSize: 24 }}>{title}</h1>
      {sub && <p className="small" style={{ fontSize: 13 }}>{sub}</p>}
    </div>
    {right}
  </div>
);
