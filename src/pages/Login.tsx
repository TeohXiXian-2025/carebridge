import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DemoBanner } from '../components/layout';
import { ErrorBox, Field, Logo } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { UserError } from '../lib/store';
import type { UserProfile } from '../lib/types';

const home = (u: UserProfile) => (u.role === 'homeAdmin' ? '/admin' : u.role === 'platformAdmin' ? '/platform' : '/homes');

/** D7 Log in / Sign up */
export default function Login() {
  const [params] = useSearchParams();
  const next = params.get('next');
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav(next && next.startsWith('/') ? next : home(user), { replace: true });
  }, [user, next, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (mode === 'signup' && (!name.trim() || phone.replace(/\D/g, '').length < 9)) return setErr('Enter your full name and a valid phone number.');
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
              <>
                <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></Field>
                <Field label="Phone number"><input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 012-345 6789" autoComplete="tel" required /></Field>
              </>
            )}
            <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
            <Field label="Password" hint={mode === 'signup' ? 'At least 6 characters.' : undefined}>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} />
            </Field>
            <ErrorBox msg={err} />
            <button className="btn btn-block" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
            <div className="note stack" style={{ gap: 6, padding: 14, borderRadius: 18 }}>
              <b style={{ fontSize: 15 }}>Run a welfare home?</b>
              <span style={{ fontSize: 13 }}>Register your home to post a wishlist. Our team reviews every home before it goes public.</span>
              <Link to="/register-home" className="link" style={{ fontSize: 14 }}>Register a home →</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
