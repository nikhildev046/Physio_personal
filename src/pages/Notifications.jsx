import { useEffect, useState } from "react";
import { notificationsApi } from "../api/services.js";
import { useApp } from "../store/AppContext.jsx";
import { SectionHeader, Spinner, EmptyState } from "../components/ui.jsx";
import { Bell, Calendar, Rupee, Check } from "../components/Icons.jsx";
import { fmtDateTime } from "../lib/format.js";
import { pushSupported, permission, requestPermission, notify, subscribeToPush } from "../lib/push.js";

const ICONS = { appointment: Calendar, booking: Bell, payment: Rupee };
const TONES = {
  appointment: "bg-brand-50 text-brand-600",
  booking: "bg-sky-50 text-sky-600",
  payment: "bg-amber-50 text-amber-600",
};

export default function Notifications() {
  const { refreshUnread } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perm, setPerm] = useState(permission());

  const load = () => notificationsApi.list().then((l) => setItems(l.sort((a, b) => new Date(b.at) - new Date(a.at))));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const enablePush = async () => {
    const p = await requestPermission();
    setPerm(p);
    if (p === "granted") {
      await subscribeToPush(); // no-op until a VAPID key + backend are set
      await notify("Phone alerts on", { body: "You'll now get reminders even when the app is closed." });
    }
  };

  const sendTest = () =>
    notify("Test alert · PhysioFlow", { body: "This is how reminders will appear on your phone." });

  const markRead = async (id) => {
    await notificationsApi.markRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    refreshUnread();
  };

  const markAll = async () => {
    await notificationsApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    refreshUnread();
  };

  if (loading) return <Spinner label="Loading alerts…" />;

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Alerts"
        subtitle={unread ? `${unread} unread` : "You're all caught up"}
        action={
          unread > 0 && (
            <button onClick={markAll} className="btn-ghost">
              <Check width={16} height={16} /> Mark all read
            </button>
          )
        }
      />

      {/* Phone / system notifications (outside the app) */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Bell width={20} height={20} />
          </div>
          <div>
            <div className="font-semibold text-brand-900">Phone alerts</div>
            <div className="text-sm text-brand-500">
              {perm === "granted"
                ? "On — reminders show on your phone even when the app is closed."
                : perm === "denied"
                ? "Blocked. Enable notifications for this site in your browser settings."
                : perm === "unsupported"
                ? "This browser doesn't support phone notifications."
                : "Get appointment, booking and payment alerts on your phone."}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {perm === "granted" ? (
            <button onClick={sendTest} className="btn-outline">Send test alert</button>
          ) : perm === "denied" || perm === "unsupported" ? null : (
            <button onClick={enablePush} className="btn-primary" disabled={!pushSupported()}>
              Enable phone alerts
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" hint="Appointment reminders, new bookings and payment alerts appear here." />
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <button
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`card flex w-full items-start gap-3 p-4 text-left transition ${
                  n.read ? "opacity-70" : "ring-1 ring-brand-200"
                }`}
              >
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONES[n.type] || "bg-brand-50 text-brand-600"}`}>
                  <Icon width={20} height={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand-900">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                  </div>
                  <p className="text-sm text-brand-600">{n.body}</p>
                  <p className="mt-1 text-xs text-brand-400">{fmtDateTime(n.at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
