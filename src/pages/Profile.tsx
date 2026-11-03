import { Link, useNavigate } from 'react-router-dom';
import { DonorLayout, PushPrompt } from '../components/layout';
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
                <p className="small">{user.email} · {user.phone}</p>
              </div>
            </div>
            <PushPrompt text="Get notified when homes accept or receive your pledges." />
            {user.role === 'homeAdmin' && <Link to="/admin" className="btn">Open my home dashboard</Link>}
            {user.role === 'platformAdmin' && <Link to="/platform" className="btn">Open platform admin</Link>}
            {user.role === 'donor' && (
              <div className="note stack" style={{ gap: 6 }}>
                <b>Run a welfare home?</b>
                <span>Register it to post a wishlist.</span>
                <Link to="/register-home" className="link">Register a home →</Link>
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
