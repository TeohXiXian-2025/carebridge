import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { resetDemo } from '../lib/localStore';
import { enablePush, pushState, type PushState } from '../lib/pushClient';
import type { Role } from '../lib/types';
import { Avatar, Icon, Logo, Spinner, useToast } from './ui';
import { NotificationBell } from './NotificationBell';

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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  if (!user)
    return (
      <Link to="/login" className="btn btn-sm">
        Log in
      </Link>
    );
  const area = user.role === 'homeAdmin' ? { to: '/admin', label: 'My home dashboard' } : user.role === 'platformAdmin' ? { to: '/platform', label: 'Platform admin' } : null;
  const roleLabel = user.role === 'donor' ? 'Donor' : user.role === 'homeAdmin' ? 'Welfare home manager' : 'Platform admin';
  const go = (to: string) => {
    setOpen(false);
    nav(to);
  };
  return (
    <div className="menu-wrap" ref={ref}>
      <button className="avatar-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} title="Account">
        <Avatar name={user.fullName} />
        <span className="caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <b className="wrap-any">{user.fullName}</b>
            <span className="small wrap-any">{user.email}</span>
            <span className="tag t-teal" style={{ alignSelf: 'flex-start', marginTop: 4 }}>{roleLabel}</span>
          </div>
          {area && <button role="menuitem" onClick={() => go(area.to)}>{area.label}</button>}
          <button role="menuitem" onClick={() => go('/my-pledges')}>My pledges</button>
          <button role="menuitem" onClick={() => go(user.role === 'homeAdmin' ? '/admin/profile' : user.role === 'platformAdmin' ? '/platform/admins' : '/profile')}>Account &amp; notifications</button>
          <button role="menuitem" className="danger" onClick={() => api.signOut().then(() => go('/'))}>Log out</button>
        </div>
      )}
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
          <NotificationBell />
          <AccountMenu />
        </div>
      </header>
      {!hideMobileHeader && (
        <header className="mnav hide-d">
          {title ? <h2>{title}</h2> : <Link to="/"><Logo /></Link>}
          {user ? (
            <div className="hdr-actions">
              <NotificationBell />
              <Link to={user.role === 'homeAdmin' ? '/admin' : user.role === 'platformAdmin' ? '/platform' : '/profile'}>
                <Avatar name={user.fullName} />
              </Link>
            </div>
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
          <div className="brand brand-row">
            <div className="stack" style={{ gap: 4, minWidth: 0 }}>
              <Link to="/"><Logo size={22} /></Link>
              <span className="small wrap-any">{subtitle}</span>
            </div>
            <NotificationBell />
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
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="wrap-any" style={{ fontSize: 13, fontWeight: 600 }}>{user?.fullName}</div>
              <div className="small wrap-any">{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-sm btn-muted" onClick={out}>Log out</button>
        </aside>
        <div className="grow">
          <header className="mnav hide-d">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link to="/"><Logo /></Link>
              <span className="small" style={{ fontSize: 11 }}>{subtitle}</span>
            </div>
            <div className="hdr-actions">
              <NotificationBell />
              <Link to={nav.find((n) => n.label === 'Profile' || n.label === 'Admins')?.to ?? '/profile'} title="Account"><Avatar name={user?.fullName} /></Link>
            </div>
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
