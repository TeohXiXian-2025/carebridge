import { Link, useNavigate } from 'react-router-dom';
import { DonorLayout } from '../components/layout';
import { HomeForm } from '../components/HomeForm';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useIsDesktop } from '../lib/useData';

/** Register a home (W8). Needs a logged-in donor account. */
export default function RegisterHome() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const desktop = useIsDesktop();
  const wrapper = (children: React.ReactNode) => (
    <DonorLayout title="Register a home" noTabs={!desktop}>
      <div className={desktop ? 'container' : 'content'} style={desktop ? { maxWidth: 720 } : { paddingBottom: 32 }}>
        {desktop && <h1>Register a welfare home</h1>}
        {children}
      </div>
    </DonorLayout>
  );

  if (!user)
    return wrapper(
      <div className="card stack">
        <p className="sub">Create an account or log in first. Then you can register your home here.</p>
        <Link className="btn" to="/login?next=/register-home&mode=signup">Sign up / Log in</Link>
      </div>,
    );
  if (user.role !== 'donor')
    return wrapper(
      <div className="card stack">
        <p className="sub">This account already manages {user.role === 'homeAdmin' ? 'a home' : 'the platform'}. Use a separate account to register another home.</p>
        <Link className="btn" to={user.role === 'homeAdmin' ? '/admin' : '/platform'}>Go to my dashboard</Link>
      </div>,
    );

  return wrapper(
    <>
      <div className="note">Our team reviews every home before donors can see it. You can set up your wishlist while you wait.</div>
      <HomeForm
        submitLabel="Submit for review"
        initial={{ notifyEmail: user.email }}
        onSubmit={async (v) => {
          await api.registerHome(user, v);
          await refresh();
          nav('/admin', { replace: true });
        }}
      />
    </>,
  );
}
