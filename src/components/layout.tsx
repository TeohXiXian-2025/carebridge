import { useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { resetDemo } from '../lib/localStore';
import { enablePush, pushState, type PushState } from '../lib/pushClient';
import type { Role } from '../lib/types';
import { Avatar, Icon, Logo, Spinner, useToast } from './ui';

export function DemoBanner() {
  if (api.mode !== 'local') return null;
  return (
    <div className="banner">
      Demo mode: sample data saved in this browser only. Try donor@demo.test, admin@demo.test or platform@demo.test (password demo1234).{' '}
      <button onClick={resetDemo}>Reset demo</button>
    </div>
  );
}

function AccountMenu() {
  const { user } = useAuth();
  const nav = useNavigate();
  if (!user)
    return (
      <Link to="/login" className="btn btn-sm">
        Log in
      </Link>
    );
  const area = user.role === 'homeAdmin' ? '/admin' : user.role === 'platformAdmin' ? '/platform' : null;
  return (
    <div className="row" style={{ gap: 14 }}>
      {area && (
        <Link to={area} className="btn btn-sm btn-ghost">
          {user.role === 'homeAdmin' ? 'My home' : 'Admin'}
        </Link>
      )}
      <button title="Log out" onClick={() => api.signOut().then(() => nav('/'))} className="row">
        <Avatar name={user.fullName} />
      </button>
    </div>
  );
}

/** Donor pages: top nav on desktop, header + bottom tab bar on phones. */
export function DonorLayout({ children, title, noTabs, hideMobileHeader }: { children: ReactNode; title?: string; noTabs?: boolean; hideMobileHeader?: boolean }) {
  const { user } = useAuth();
  return (
    <div className={noTabs ? '' : 'with-tabs'}>
      <DemoBanner />
      <header className="topnav hide-m">
        <Link to="/">
          <Logo size={24} />
        </Link>
        <nav className="links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/homes">Homes</NavLink>
          <NavLink to="/my-pledges">My pledges</NavLink>
        </nav>
        <div className="row" style={{ gap: 14 }}>
          {(!user || user.role === 'donor') && (
            <Link to="/register-home" className="btn btn-sm btn-ghost">
              Register a home
            </Link>
          )}
          <AccountMenu />
        </div>
      </header>
      {!hideMobileHeader && (
        <header className="mnav hide-d">
          {title ? <h2>{title}</h2> : <Link to="/"><Logo /></Link>}
          {user ? (
            <Link to={user.role === 'homeAdmin' ? '/admin' : user.role === 'platformAdmin' ? '/platform' : '/profile'}>
              <Avatar name={user.fullName} />
            </Link>
          ) : (
            <Link to="/login" className="btn btn-sm">Log in</Link>
          )}
        </header>
      )}
      {children}
      {!noTabs && (
        <nav className="tabbar hide-d">
          <NavLink to="/" end><i>{Icon.home}</i>Home</NavLink>
          <NavLink to="/homes"><i>{Icon.homes}</i>Homes</NavLink>
          <NavLink to="/my-pledges"><i>{Icon.pledges}</i>My pledges</NavLink>
          <NavLink to="/profile"><i>{Icon.profile}</i>Profile</NavLink>
        </nav>
      )}
    </div>
  );
}

/** Redirect anyone without the right role (Spec §6 "Admin pages"). */
export function RequireRole({ role, children }: { role: Role | 'any'; children: ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (role !== 'any' && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean };
export const HOME_ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: Icon.home, end: true },
  { to: '/admin/wishlist', label: 'Wishlist', icon: Icon.list },
  { to: '/admin/pledges', label: 'Pledges', icon: Icon.pledges },
  { to: '/admin/profile', label: 'Profile', icon: Icon.profile },
];
export const PLATFORM_NAV: NavItem[] = [
  { to: '/platform', label: 'Approvals', icon: Icon.check, end: true },
  { to: '/platform/overview', label: 'Overview', icon: Icon.chart },
  { to: '/platform/homes', label: 'Homes', icon: Icon.homes },
  { to: '/platform/admins', label: 'Admins', icon: Icon.users },
];

/** Admin pages: sidebar on desktop, header + bottom tab bar on phones. */
export function AdminLayout({ nav, subtitle, children }: { nav: NavItem[]; subtitle: string; children: ReactNode }) {
  const { user } = useAuth();
  const go = useNavigate();
  const out = () => api.signOut().then(() => go('/'));
  return (
    <div className="with-tabs-m">
      <DemoBanner />
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <Link to="/"><Logo size={22} /></Link>
            <span className="small">{subtitle}</span>
          </div>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav">
              <i />
              {n.label}
            </NavLink>
          ))}
          <div style={{ flex: 1 }} />
          <div className="row" style={{ gap: 10, padding: 8 }}>
            <Avatar name={user?.fullName} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.fullName}</div>
              <button className="small" onClick={out}>Log out</button>
            </div>
          </div>
        </aside>
        <div className="grow">
          <header className="mnav hide-d">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link to="/"><Logo /></Link>
              <span className="small" style={{ fontSize: 11 }}>{subtitle}</span>
            </div>
            <button onClick={out} title="Log out"><Avatar name={user?.fullName} /></button>
          </header>
          <main className="main content-m">{children}</main>
        </div>
      </div>
      <nav className="tabbar hide-d">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <i>{n.icon}</i>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Small card asking to turn on push notifications. Hidden when not possible or already on. */
export function PushPrompt({ text }: { text: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const [state, setState] = useState<PushState>(() => pushState());
  if (!user || state === 'granted' || state === 'unsupported') return null;
  if (state === 'needs-install')
    return (
      <div className="note">
        <b>Get notifications on iPhone:</b> tap Share → <b>Add to Home Screen</b>, then open CareBridge from your home screen.
      </div>
    );
  if (state === 'denied') return <div className="note">Notifications are blocked. Turn them on for this site in your browser settings.</div>;
  return (
    <div className="note between">
      <span>{text}</span>
      <button
        className="btn btn-sm"
        onClick={async () => {
          const s = await enablePush(user.id).catch(() => 'unsupported' as PushState);
          setState(s);
          toast(s === 'granted' ? 'Notifications on' : 'Notifications not enabled');
        }}
      >
        Turn on
      </button>
    </div>
  );
}
