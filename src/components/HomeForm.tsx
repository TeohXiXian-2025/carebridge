import { useState } from 'react';
import { compressImage } from '../lib/image';
import { AREAS, type Home, type HomeType, type NewHome } from '../lib/types';
import { ErrorBox, Field } from './ui';

export type HomeFormValues = NewHome & { notifyEmail: string };

/** Used by "Register a home" (W8) and the home admin's profile settings. */
export function HomeForm({ initial, submitLabel, onSubmit }: { initial?: Partial<Home>; submitLabel: string; onSubmit: (v: HomeFormValues) => Promise<void> }) {
  const [v, setV] = useState<HomeFormValues>({
    name: initial?.name ?? '', type: initial?.type ?? 'Children', area: initial?.area ?? 'Cheras', address: initial?.address ?? '',
    dropoffHours: initial?.dropoffHours ?? 'Mon–Sat, 10am–5pm', about: initial?.about ?? '', photo: initial?.photo ?? null, notifyEmail: initial?.notifyEmail ?? '',
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof HomeFormValues>(k: K, val: HomeFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  async function pick(f?: File) {
    if (!f) return;
    try {
      set('photo', await compressImage(f));
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.name.trim() || !v.address.trim() || !v.about.trim()) return setErr('Fill in the home name, address and a short description.');
    if (!/^\S+@\S+\.\S+$/.test(v.notifyEmail)) return setErr('Enter a contact email for pledge notifications.');
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({ ...v, name: v.name.trim(), address: v.address.trim(), about: v.about.trim() });
    } catch (e2) {
      setErr((e2 as Error).message);
    }
    setBusy(false);
  }

  return (
    <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
      <Field label="Home name"><input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Sri Damai Elderly Home" /></Field>
      <div className="pledge-pair">
        <Field label="Type">
          <select className="input select" value={v.type} onChange={(e) => set('type', e.target.value as HomeType)}><option>Children</option><option>Elderly</option></select>
        </Field>
        <Field label="Area">
          <select className="input select" value={v.area} onChange={(e) => set('area', e.target.value)}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
        </Field>
      </div>
      <Field label="Drop-off address"><input className="input" value={v.address} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label="Drop-off hours"><input className="input" value={v.dropoffHours} onChange={(e) => set('dropoffHours', e.target.value)} /></Field>
      <Field label="About the home" hint="Who you care for and what you need most. Donors see this.">
        <textarea className="input" value={v.about} onChange={(e) => set('about', e.target.value)} maxLength={400} />
      </Field>
      <Field label="Contact email" hint="New pledges are emailed here. Donors can also see it.">
        <input className="input" type="email" value={v.notifyEmail} onChange={(e) => set('notifyEmail', e.target.value)} />
      </Field>
      <Field label="Home photo (optional)">
        <label className="upload" style={v.photo ? { backgroundImage: `url(${v.photo})`, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.6)' } : undefined}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pick(e.target.files?.[0])} />
          {v.photo ? 'Tap to change photo' : 'Tap to upload a JPG or PNG'}
        </label>
      </Field>
      <ErrorBox msg={err} />
      <button className="btn btn-block" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
    </form>
  );
}
