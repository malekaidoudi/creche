/**
 * SERVICE WORKER - Notifications Push OS (Web Push)
 *
 * Ce service worker gère uniquement les notifications push natives
 * (Android Chrome/Edge, iOS 16.4+ en PWA installée sur l'écran d'accueil).
 * Pas de cache offline pour l'instant (strategies: 'injectManifest' sans précache).
 */

import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

// Réception d'une notification push envoyée par le backend (web-push)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Mima El Ghalia', message: event.data.text() };
  }

  const { title = 'Mima El Ghalia', message = '', url = '/', metadata = null } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: message,
      icon: '/images/icon-192.png',
      badge: '/images/icon-192.png',
      data: { url, metadata },
    })
  );
});

// Clic sur la notification : ouvre (ou met au premier plan) l'app sur l'URL ciblée
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Une fenêtre de l'app est déjà ouverte (même sur une autre page) :
      // on la met au premier plan ET on la navigue vers l'URL ciblée, plutôt que
      // de simplement la focus (sinon le clic ne mène jamais à la conversation
      // si l'app était ouverte sur une autre page).
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // Aucune fenêtre ouverte (app fermée/swipée) : on en ouvre une nouvelle.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
