/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker for SOKOZA
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBm6UrplEdLznJdMkuHKkgr9UzszzgMeDI",
  authDomain: "power-family-b3ce2.firebaseapp.com",
  projectId: "power-family-b3ce2",
  storageBucket: "power-family-b3ce2.firebasestorage.app",
  messagingSenderId: "683959610569",
  appId: "1:683959610569:web:c0ad82d8b3d9f85a6af118"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background order message received:', payload);

  const title = payload.notification?.title || payload.data?.title || '🔔 SOKOZA: New Order Received!';
  const body = payload.notification?.body || payload.data?.body || 'A customer has placed an order in your shop.';

  const options = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.data?.orderReference || 'sokoza-order',
    data: {
      url: payload.data?.url || '/seller/orders',
      orderReference: payload.data?.orderReference,
    },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/seller/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/seller') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
