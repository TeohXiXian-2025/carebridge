import { Link, useNavigate } from 'react-router-dom';
import { DonorLayout } from '../components/layout';
import { AccountSettings } from '../components/AccountSettings';
import { Avatar } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

/** Mobile "Profile" tab for donors. */
export default function Profile() {
  const { user } = useAuth();
  const nav = useNavigate();
  return (
    <DonorLayout title="Profile">
      <div className="content container" style={{ maxWidth: 640 }}>
        {!user ? (
          <div className="card stack">
            <p className="sub">Log in to pledge items and track your donations.</p>
            <Link to="/login" className="btn">Log in</Link>
            <Link to="/login?mode=signup" className="btn btn-ghost">Create an account</Link>
          </div>
        ) : (
          <>
            <div className="card row" style={{ gap: 14 }}>
              <Avatar name={user.fullName} />
              <div className="grow">
                <h3>{user.fullName}</h3>
                <p className="small">{user.role === 'donor' ? 'Donor' : user.role === 'homeAdmin' ? 'Welfare home admin' : 'Platform admin'}</p>
              </div>
            </div>
            <AccountSettings />
            {user.role === 'homeAdmin' && <Link to="/admin" className="btn">Open my home dashboard</Link>}
            {user.role === 'platformAdmin' && <Link to="/platform" className="btn">Open platform admin</Link>}
            {user.role === 'donor' && (
              <div className="note stack" style={{ gap: 6 }}>
                <b>Run a welfare home?</b>
                <span>Register it to post a wishlist.</span>
                <Link to="/register-home" className="link">Register a home →</Link>
                <span className="small">Tip: use a separate account for your home, so your personal donations stay separate.</span>
              </div>
            )}
            <button className="btn btn-muted" onClick={() => api.signOut().then(() => nav('/'))}>Log out</button>
          </>
        )}
        <p className="small" style={{ textAlign: 'center' }}>Tip: install CareBridge on your phone from the browser menu (“Install app” or “Add to Home Screen”).</p>
      </div>
    </DonorLayout>
  );
}
