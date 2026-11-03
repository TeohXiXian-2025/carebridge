import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DemoBanner } from '../components/layout';
import { ErrorBox, Field, Logo } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { UserError } from '../lib/store';
import type { UserProfile } from '../lib/types';

const home = (u: UserProfile) => (u.role === 'homeAdmin' ? '/admin' : u.role === 'platformAdmin' ? '/platform' : '/homes');
const INTENT = 'carebridge-signup-as';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
  </svg>
);

/** D7 Log in / Sign up */
export default function Login() {
  const [params] = useSearchParams();
  const next = params.get('next');
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [as, setAs] = useState<'donor' | 'home'>(params.get('as') === 'home' ? 'home' : 'donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  async function forgot() {
    setErr(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Type your email in the Email box first, then tap Forgot password.');
    try {
      await api.resetPassword(email);
      setInfo(`If ${email.trim()} has a CareBridge password, a reset link is on its way. Check your inbox and spam folder.`);
    } catch (e2) {
      setErr(e2 instanceof UserError ? e2.message : 'Could not send the reset email.');
    }
  }

  useEffect(() => {
    if (!user) return;
    let wantsHome = false;
    try {
      wantsHome = sessionStorage.getItem(INTENT) === 'home';
      sessionStorage.removeItem(INTENT);
    } catch {
      /* storage blocked */
    }
    if (wantsHome && user.role === 'donor') nav('/register-home', { replace: true });
    else nav(next && next.startsWith('/') ? next : home(user), { replace: true });
  }, [user, next, nav]);

  const remember = () => {
    try {
      if (mode === 'signup' && as === 'home') sessionStorage.setItem(INTENT, 'home');
      else sessionStorage.removeItem(INTENT);
    } catch {
      /* storage blocked */
    }
  };
  async function google() {
    setErr(null);
    remember();
    setBusy(true);
    try {
      await api.signInWithGoogle();
    } catch (e2) {
      setErr(e2 instanceof UserError ? e2.message : 'Google sign-in failed. Please try again.');
    }
    setBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (mode === 'signup' && (!name.trim() || phone.replace(/\D/g, '').length < 9)) return setErr('Enter your full name and a valid phone number.');
    remember();
    setBusy(true);
    try {
      if (mode === 'login') await api.signIn(email, password);
      else await api.signUp(email, password, name.trim(), phone.trim());
    } catch (e2) {
      setErr(e2 instanceof UserError ? e2.message : 'Something went wrong. Please try again.');
    }
    setBusy(false);
  }

  return (
    <>
      <DemoBanner />
      <div className="auth-split">
        <aside className="brand-panel">
          <Link to="/"><Logo size={28} white /></Link>
          <div className="stack" style={{ gap: 16 }}>
            <h1 style={{ fontSize: 40, lineHeight: 1.15, color: '#fff' }}>Give what is needed, not what is guessed.</h1>
            <p style={{ fontSize: 16, lineHeight: 1.5, color: '#CFEAE4' }}>Welfare homes post what they need. You pledge it, drop it off, and watch the wishlist update.</p>
          </div>
          <p style={{ fontSize: 13, color: '#CFEAE4' }}>A WIX2002 project · Universiti Malaya</p>
        </aside>
        <div className="auth-form">
          <form className="stack" style={{ padding: '40px 20px', gap: 18 }} onSubmit={submit}>
            <Link to="/" className="hide-d"><Logo size={30} /></Link>
            <div className="stack" style={{ gap: 6 }}>
              <h1 style={{ fontSize: 28 }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
              <p className="sub">{mode === 'login' ? 'Log in to pledge items and track your donations.' : 'Sign up to pledge items to welfare homes.'}</p>
            </div>
            <div className="seg">
              <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
              <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Sign up</button>
            </div>
            {mode === 'signup' && (
              <Field label="I am signing up as">
                <div className="seg">
                  <button type="button" className={as === 'donor' ? 'on' : ''} onClick={() => setAs('donor')}>A donor</button>
                  <button type="button" className={as === 'home' ? 'on' : ''} onClick={() => setAs('home')}>A welfare home</button>
                </div>
              </Field>
            )}
            {mode === 'signup' && as === 'home' && (
              <p className="note">After signing up you'll fill in your home's details. The home is linked to this Google account or email, and our team reviews it before donors can see it.</p>
            )}
            <button type="button" className="btn btn-plain btn-block" onClick={google} disabled={busy}>
              <GoogleLogo /> Continue with Google
            </button>
            <div className="row" style={{ gap: 12 }}>
              <span className="grow" style={{ height: 1, background: 'var(--line)' }} />
              <span className="small">or {mode === 'login' ? 'log in' : 'sign up'} with email</span>
              <span className="grow" style={{ height: 1, background: 'var(--line)' }} />
            </div>
            {mode === 'signup' && (
              <>
                <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></Field>
                <Field label="Phone number"><input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 012-345 6789" autoComplete="tel" required /></Field>
              </>
            )}
            <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
            <Field label="Password" hint={mode === 'signup' ? 'At least 6 characters.' : undefined}>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} />
            </Field>
            {mode === 'login' && (
              <button type="button" className="link" style={{ alignSelf: 'flex-end', marginTop: -8 }} onClick={forgot}>
                Forgot password?
              </button>
            )}
            {info && <div className="note">{info}</div>}
            <ErrorBox msg={err} />
            <button className="btn btn-block" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
            {mode === 'login' && (
              <div className="note stack" style={{ gap: 6, padding: 14, borderRadius: 18 }}>
                <b style={{ fontSize: 15 }}>Run a welfare home?</b>
                <span style={{ fontSize: 13 }}>Sign up as a welfare home to post a wishlist. Our team reviews every home before it goes public.</span>
                <button type="button" className="link" style={{ fontSize: 14, textAlign: 'left' }} onClick={() => { setMode('signup'); setAs('home'); }}>Sign up as a welfare home →</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
