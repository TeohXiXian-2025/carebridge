import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { AppNotification } from '../lib/types';
import { useToast } from './ui';

function ago(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(ts).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

/** The bell: live in-app notifications for the signed-in user (or their home, or platform admins). */
export function NotificationBell() {
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [list, setList] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    seen.current = null;
    const off = api.watchNotifications(user, (l) => {
      // A toast for anything that arrives while the app is open (not for the first load).
      if (seen.current) l.filter((n) => !seen.current!.has(n.id) && !n.read && n.from !== user.id).slice(0, 1).forEach((n) => toast(`🔔 ${n.title}`));
      seen.current = new Set(l.map((n) => n.id));
      setList(l);
    });
    return () => off();
  }, [user?.id, user?.role, user?.homeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!user) return null;
  const mine = list.filter((n) => n.from !== user.id);
  const unread = mine.filter((n) => !n.read);
  const go = (n: AppNotification) => {
    setOpen(false);
    if (!n.read) void api.markRead([n.id]);
    nav(n.path);
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="bell" aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread.length > 0 && <span className="badge">{unread.length > 9 ? '9+' : unread.length}</span>}
      </button>
      {open && (
        <div className="menu notif-menu" role="dialog" aria-label="Notifications">
          <div className="between" style={{ padding: '8px 10px 10px' }}>
            <b>Notifications</b>
            {unread.length > 0 && (
              <button className="link" style={{ padding: 0 }} onClick={() => api.markRead(unread.map((n) => n.id))}>
                Mark all read
              </button>
            )}
          </div>
          {mine.length === 0 && <p className="small" style={{ padding: '12px 12px 16px' }}>No notifications yet. Updates about pledges and homes appear here.</p>}
          <div className="notif-list">
            {mine.map((n) => (
              <button key={n.id} className={`notif${n.read ? '' : ' unread'}`} onClick={() => go(n)}>
                <span className="dot" aria-hidden="true" />
                <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <b className="wrap-any" style={{ fontSize: 14 }}>{n.title}</b>
                  <span className="small wrap-any" style={{ fontSize: 13 }}>{n.body}</span>
                  <span className="small" style={{ fontSize: 11 }}>{ago(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
