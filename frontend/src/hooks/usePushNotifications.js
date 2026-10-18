import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Convertit une clé VAPID (base64url) en Uint8Array, format attendu par
 * PushManager.subscribe({ applicationServerKey }).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// Sur iOS, TOUS les navigateurs (Chrome, Firefox, Edge, Opera...) utilisent le moteur
// WebKit d'Apple, mais seule Safari a le droit d'installer une PWA avec support du Web
// Push : une app ajoutée à l'écran d'accueil via Chrome iOS reste dans le "bac à sable"
// de Chrome et n'a jamais accès à PushManager/Notification, même affichée en plein écran.
const isIosNonSafariBrowser = () => isIos() && /crios|fxios|edgios|opios|mercury/i.test(window.navigator.userAgent);

/**
 * Hook de gestion des notifications push OS (Web Push).
 *
 * - `isSupported` : le navigateur gère Service Worker + Push API
 * - `needsSafari` : sur iOS, seule une PWA installée depuis Safari supporte le Push
 *   (une installation via Chrome/Firefox/Edge iOS ne fonctionnera jamais)
 * - `needsInstall` : sur iOS Safari, le Push ne fonctionne que si la PWA est installée
 *   sur l'écran d'accueil (hors onglet Safari classique)
 * - `permission` : état de la permission navigateur ('default' | 'granted' | 'denied')
 * - `isSubscribed` : un abonnement push actif existe déjà sur cet appareil
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const needsSafari = isIosNonSafariBrowser();
  const needsInstall = isIos() && !needsSafari && !isStandalone();

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }

    if (supported) {
      navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => setIsSubscribed(Boolean(subscription)))
        .catch(() => setIsSubscribed(false));
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || needsInstall || needsSafari) return false;

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return false;

      const { data } = await api.get('/api/push/vapid-public-key');
      if (!data?.publicKey) {
        console.error('❌ Clé publique VAPID indisponible');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      await api.post('/api/push/subscribe', { subscription: subscription.toJSON() });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('❌ Erreur abonnement notifications push:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, needsInstall, needsSafari]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await api.delete('/api/push/unsubscribe', { data: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('❌ Erreur désabonnement notifications push:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return { isSupported, needsInstall, needsSafari, permission, isSubscribed, loading, subscribe, unsubscribe };
}
