import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PushPrompt } from './layout';
import { Field, useToast } from './ui';

/** Name, phone and notification settings – shown to every role. */
export function AccountSettings() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const emailOn = user.emailNotifications !== false;

  const save = async () => {
    setBusy(true);
    try {
      await api.updateProfile(user.id, { fullName: name.trim() || user.fullName, phone: phone.trim() });
      await refresh();
      toast('Profile saved');
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(false);
  };
  const toggleEmail = async () => {
    await api.updateProfile(user.id, { emailNotifications: !emailOn });
    await refresh();
    toast(emailOn ? 'Email notifications off' : 'Email notifications on');
  };

  return (
    <div className="card stack" style={{ gap: 14, borderRadius: 16 }}>
      <h3>My account</h3>
      <p className="small">Signed in as <b style={{ color: 'var(--ink)' }}>{user.email}</b></p>
      <div className="pledge-pair">
        <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Phone number"><input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 012-345 6789" /></Field>
      </div>
      <button className="btn btn-sm btn-ghost" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={save}>Save</button>
      <div style={{ height: 1, background: 'var(--line)' }} />
      <h3>Notifications</h3>
      <div className="between">
        <div>
          <b style={{ fontSize: 14 }}>Email notifications</b>
          <p className="small">Pledge updates sent to {user.email}</p>
        </div>
        <button className={`toggle${emailOn ? ' on' : ''}`} aria-pressed={emailOn} aria-label="Email notifications" onClick={toggleEmail} />
      </div>
      <PushPrompt text="App notifications on this device are off." />
    </div>
  );
}
