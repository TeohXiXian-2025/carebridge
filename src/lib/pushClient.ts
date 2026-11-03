import { firebaseApp, firebaseConfig, hasFirebase, VAPID_KEY } from './firebase';
import { api } from './api';

export type PushState = 'unsupported' | 'needs-install' | 'default' | 'granted' | 'denied';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export function pushState(): PushState {
  if (!hasFirebase || !VAPID_KEY) return 'unsupported';
  if (isIOS() && !isStandalone()) return 'needs-install';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  return Notification.permission as PushState;
}

async function activeRegistration() {
  const cfg = encodeURIComponent(JSON.stringify(firebaseConfig));
  const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${cfg}`, { scope: '/firebase-cloud-messaging-push-scope' });
  void reg.update().catch(() => undefined); // pick up a newer notification worker straight away
  // getToken needs an *active* worker; a fresh install is still "installing" for a moment.
  const sw = reg.installing || reg.waiting;
  if (!reg.active && sw)
    await new Promise<void>((resolve) => {
      sw.addEventListener('statechange', () => sw.state === 'activated' && resolve());
      setTimeout(resolve, 8000);
    });
  return reg;
}

/** Registers this device for app notifications and saves its push token. Silent; safe to call on every app start. */
export async function syncPushToken(uid: string): Promise<boolean> {
  if (pushState() !== 'granted') return false;
  try {
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
    if (!(await isSupported())) return false;
    const reg = await activeRegistration();
    const token = await getToken(getMessaging(firebaseApp()), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return false;
    await api.saveFcmToken(uid, token);
    return true;
  } catch (e) {
    console.warn('Could not register this device for notifications:', e);
    return false;
  }
}

/** Asks permission (if needed), then registers this device. */
export async function enablePush(uid: string): Promise<PushState> {
  const state = pushState();
  if (state === 'unsupported' || state === 'needs-install' || state === 'denied') return state;
  const perm = state === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') return perm as PushState;
  return (await syncPushToken(uid)) ? 'granted' : 'unsupported';
}

/** Asks the server to send a test notification to the signed-in user's devices. */
export async function sendTestPush(): Promise<{ pushed: number; devices: number } | { error: string }> {
  try {
    const { getAuth } = await import('firebase/auth');
    const token = await getAuth(firebaseApp()).currentUser?.getIdToken();
    if (!token) return { error: 'Not signed in.' };
    const r = await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: 'test' }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.error ?? `Server error ${r.status}` };
    return { pushed: j.pushed ?? 0, devices: j.devices ?? 0 };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Shows notifications that arrive while the app is open. */
export async function listenForeground() {
  if (pushState() !== 'granted') return;
  const { getMessaging, onMessage, isSupported } = await import('firebase/messaging');
  if (!(await isSupported())) return;
  onMessage(getMessaging(firebaseApp()), (m) => {
    const t = m.data?.title ?? m.notification?.title ?? 'CareBridge';
    navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope').then((r) =>
      r?.showNotification(t, { body: m.data?.body ?? m.notification?.body, icon: '/icon-192.png', data: { url: m.data?.url ?? '/' } }),
    );
  });
}
