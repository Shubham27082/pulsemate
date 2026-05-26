import { useEffect, useRef } from 'react';
import { registerFcmToken, removeFcmToken } from '../api/notification.api';
import useAuthStore from '../store/authStore';

/**
 * useFcm — registers the browser for Firebase push notifications.
 *
 * HOW TO ENABLE:
 *   1. npm install firebase
 *   2. Add these to frontend/.env:
 *        VITE_FIREBASE_API_KEY=...
 *        VITE_FIREBASE_AUTH_DOMAIN=...
 *        VITE_FIREBASE_PROJECT_ID=...
 *        VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *        VITE_FIREBASE_APP_ID=...
 *        VITE_FIREBASE_VAPID_KEY=...
 *   3. Uncomment the Firebase block below.
 *
 * Without Firebase installed this hook is a no-op — the app works fine.
 */
const useFcm = () => {
  const { isAuthenticated } = useAuthStore();
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!import.meta.env.VITE_FIREBASE_API_KEY) return; // FCM not configured

    // ── Uncomment this block after running: npm install firebase ──────────────
    //
    // const init = async () => {
    //   try {
    //     const { initializeApp, getApps } = await import('firebase/app');
    //     const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    //     const firebaseConfig = {
    //       apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    //       authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    //       projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    //       messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    //       appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    //     };
    //     const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    //     const messaging = getMessaging(app);
    //     const permission = await Notification.requestPermission();
    //     if (permission !== 'granted') return;
    //     const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
    //     if (!token) return;
    //     tokenRef.current = token;
    //     await registerFcmToken(token, 'web');
    //     onMessage(messaging, (payload) => {
    //       const { title, body } = payload.notification || {};
    //       if (title && 'Notification' in window) new Notification(title, { body });
    //     });
    //   } catch (err) {
    //     console.warn('[FCM] Setup skipped:', err.message);
    //   }
    // };
    // init();
    //
    // return () => {
    //   if (tokenRef.current) {
    //     removeFcmToken(tokenRef.current).catch(() => {});
    //     tokenRef.current = null;
    //   }
    // };
    // ─────────────────────────────────────────────────────────────────────────
  }, [isAuthenticated]);
};

export default useFcm;
