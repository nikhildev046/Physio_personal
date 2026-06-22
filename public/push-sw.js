/* eslint-disable no-restricted-globals */
// ---------------------------------------------------------------------------
// Push & notification-click handlers.
//
// This file is imported into the generated service worker (see
// vite.config.js → workbox.importScripts). It is what makes alerts arrive on
// the phone *even when the app is closed*.
//
// - The `push` listener handles real Web Push messages sent from a backend.
//   It's fully working; it just needs a server pushing messages (see
//   src/lib/push.js → subscribeToPush for the client subscription side).
// - Until that backend exists, the app shows the same notifications locally
//   via registration.showNotification (also handled by this same SW).
// ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "PhysioFlow", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "PhysioFlow";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: payload.tag,
      data: payload.data || { url: "/notifications" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            if ("navigate" in client) client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});
