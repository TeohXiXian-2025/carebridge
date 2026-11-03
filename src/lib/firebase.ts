import { initializeApp, type FirebaseApp } from 'firebase/app';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** True when the Firebase web config is set; otherwise the app runs in demo mode. */
export const hasFirebase = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
export const firebaseConfig = cfg;
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

let app: FirebaseApp | null = null;
export function firebaseApp() {
  if (!hasFirebase) throw new Error('Firebase is not configured');
  if (!app) app = initializeApp(cfg as Required<typeof cfg>);
  return app;
}
