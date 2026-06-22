// ---------------------------------------------------------------------------
// Phone / system notifications.
//
// These appear outside the app — in the OS notification tray — as opposed to
// the in-app alert list. Two layers:
//
//   1. LOCAL (works today): notify() shows a notification through the service
//      worker's registration.showNotification, so it renders like a real push
//      even when the browser/PWA is in the background.
//   2. REAL WEB PUSH (bind later): subscribeToPush() registers the device with
//      a push service; your backend then sends messages that the SW's `push`
//      handler (public/push-sw.js) turns into notifications even when the app
//      is fully closed. Set VAPID_PUBLIC_KEY and POST the subscription to your
//      server to switch this on — no UI changes needed.
// ---------------------------------------------------------------------------

const VAPID_PUBLIC_KEY = ""; // TODO: your Web Push VAPID public key

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator;

export const permission = () => (pushSupported() ? Notification.permission : "unsupported");

export async function requestPermission() {
  if (!pushSupported()) return "unsupported";
  return Notification.requestPermission();
}

// Show a system notification right now (local). Returns true if shown.
export async function notify(title, opts = {}) {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const options = {
    body: opts.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: opts.tag,
    data: { url: "/notifications", ...(opts.data || {}) },
  };
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, options);
    return true;
  } catch {
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

// --- Real Web Push subscription (bind later) -------------------------------
export async function subscribeToPush() {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return null;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  // TODO: send `sub` (JSON) to your backend so it can push to this device.
  // await fetch("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub) });
  return sub;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
