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

/** Asks permission, registers the messaging service worker, and saves this device's token. */
export async function enablePush(uid: string): Promise<PushState> {
  const state = pushState();
  if (state === 'unsupported' || state === 'needs-install' || state === 'denied') return state;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm as PushState;
  const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
  if (!(await isSupported())) return 'unsupported';
  const cfg = encodeURIComponent(JSON.stringify(firebaseConfig));
  const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${cfg}`, { scope: '/firebase-cloud-messaging-push-scope' });
  const token = await getToken(getMessaging(firebaseApp()), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
  if (token) await api.saveFcmToken(uid, token);
  return 'granted';
}

/** Shows notifications that arrive while the app is open. */
export async function listenForeground() {
  if (pushState() !== 'granted') return;
  const { getMessaging, onMessage, isSupported } = await import('firebase/messaging');
  if (!(await isSupported())) return;
  onMessage(getMessaging(firebaseApp()), (m) => {
    const t = m.notification?.title ?? 'CareBridge';
    navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope').then((r) =>
      r?.showNotification(t, { body: m.notification?.body, icon: '/icon-192.png', data: { url: m.data?.url ?? '/' } }),
    );
  });
}
