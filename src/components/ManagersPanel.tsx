import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatTs } from '../lib/logic';
import type { Home } from '../lib/types';
import { useData } from '../lib/useData';
import { Avatar, ErrorBox, Spinner, Tag, useToast } from './ui';

/**
 * Who can manage the platform, or one welfare home. Add someone by their Gmail / email,
 * remove them, or hand the home over (add the new person, then leave).
 */
export function ManagersPanel({ home }: { home?: Home }) {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const role = home ? 'homeAdmin' : 'platformAdmin';
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data } = useData(async () => {
    const [people, invites] = await Promise.all([home ? api.homeManagers(home.id) : api.platformAdmins(), api.invites({ role, homeId: home?.id })]);
    return { people, invites };
  }, [home?.id, role]);
  if (!user) return null;
  if (!data) return <Spinner />;

  const people = [...data.people].sort((a, b) => Number(b.id === user.id) - Number(a.id === user.id));
  const onlyOne = people.length <= 1;
  const what = home ? `manage ${home.name}` : 'be a platform admin';

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await api.invite(user!, email, role, home);
      toast(r === 'added' ? `${email} can now ${what}` : `Invite sent to ${email}`);
      setEmail('');
    } catch (e2) {
      setErr((e2 as Error).message);
    }
    setBusy(false);
  }
  async function remove(id: string, name: string, self: boolean) {
    if (onlyOne) return toast(home ? 'A home needs at least one manager. Add the new manager first.' : 'Keep at least one platform admin.');
    const q = self ? `Leave ${home ? home.name : 'platform admin'}? Your account becomes a normal donor account.` : `Remove ${name}? Their account becomes a normal donor account.`;
    if (!confirm(q)) return;
    try {
      await api.demote(id);
      if (self) {
        await refresh();
        nav('/', { replace: true });
      }
      toast(self ? 'You left' : `${name} removed`);
    } catch (e) {
      toast((e as Error).message);
    }
  }

  return (
    <div className="card stack" style={{ gap: 14, borderRadius: 16 }}>
      <div>
        <h3>{home ? 'Home managers' : 'Platform admins'}</h3>
        <p className="small">
          {home
            ? 'Everyone here can manage the wishlist and pledges and gets the notifications. To move the home to a new Gmail, add it first, then leave.'
            : 'Platform admins approve homes and see the overview.'}
        </p>
      </div>
      {people.map((p) => {
        const self = p.id === user.id;
        return (
          <div key={p.id} className="row" style={{ gap: 12 }}>
            <Avatar name={p.fullName} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 6 }}><b style={{ fontSize: 14 }}>{p.fullName}</b>{self && <Tag cls="t-teal">You</Tag>}</div>
              <p className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email}</p>
            </div>
            <button className="btn btn-sm btn-muted" onClick={() => remove(p.id, p.fullName, self)} disabled={onlyOne} title={onlyOne ? 'At least one is needed' : undefined}>
              {self ? 'Leave' : 'Remove'}
            </button>
          </div>
        );
      })}
      {data.invites.map((i) => (
        <div key={i.email} className="row" style={{ gap: 12 }}>
          <div className="avatar" style={{ background: 'var(--yel-l)', color: 'var(--yel)' }}>@</div>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 6 }}><b style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.email}</b><Tag cls="t-yel">Invited</Tag></div>
            <p className="small">By {i.invitedByName} · {formatTs(i.createdAt)} · joins on first sign-in</p>
          </div>
          <button className="btn btn-sm btn-muted" onClick={() => api.cancelInvite(i.email).then(() => toast('Invite cancelled'))}>Cancel</button>
        </div>
      ))}
      <form className="stack" style={{ gap: 8 }} onSubmit={add}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Add by Gmail or email</label>
        <div className="row" style={{ gap: 8 }}>
          <input className="input grow" type="email" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn" disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
        </div>
        <p className="small">They get an email and join when they sign in with Google using that address{user.role === 'platformAdmin' ? '. If they already have an account, they are added right away' : ''}.</p>
        <ErrorBox msg={err} />
      </form>
    </div>
  );
}
