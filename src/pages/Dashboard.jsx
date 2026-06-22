import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookingsApi, patientsApi, sessionsApi } from "../api/services.js";
import { useApp } from "../store/AppContext.jsx";
import { Avatar, Badge, StatCard, SectionHeader, Spinner, EmptyState } from "../components/ui.jsx";
import { Calendar, Users, Rupee, Bell, Clipboard } from "../components/Icons.jsx";
import { inr, fmtTime, relativeDay } from "../lib/format.js";

export default function Dashboard() {
  const { therapist, unread } = useApp();
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingsApi.list(), patientsApi.list(), sessionsApi.list()])
      .then(([b, p, s]) => {
        setBookings(b);
        setPatients(p);
        setSessions(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const byId = useMemo(
    () => Object.fromEntries(patients.map((p) => [p.id, p])),
    [patients]
  );

  const todayStr = new Date().toDateString();
  const todays = useMemo(
    () =>
      bookings
        .filter((b) => new Date(b.start).toDateString() === todayStr && b.status !== "cancelled")
        .sort((a, b) => new Date(a.start) - new Date(b.start)),
    [bookings, todayStr]
  );

  const outstanding = useMemo(
    () => sessions.filter((s) => !s.paid).reduce((sum, s) => sum + (s.amount || 0), 0),
    [sessions]
  );
  const activeCount = patients.filter((p) => p.status === "active").length;
  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4),
    [sessions]
  );

  if (loading) return <Spinner label="Loading your day…" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-brand-500">{relativeDay(new Date().toISOString())}, welcome back</p>
        <h2 className="text-2xl font-bold text-brand-900">{therapist?.name?.split(" ")[1] || "Doctor"} 👋</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Appointments today" value={todays.length} tone="brand" />
        <StatCard icon={Users} label="Active patients" value={activeCount} tone="sky" />
        <StatCard icon={Rupee} label="Outstanding" value={inr(outstanding)} tone="amber" />
        <StatCard icon={Bell} label="Unread alerts" value={unread} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionHeader
            title="Today's schedule"
            subtitle={`${todays.length} appointment${todays.length === 1 ? "" : "s"}`}
            action={
              <Link to="/calendar" className="text-sm font-semibold text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          {todays.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments today" hint="Enjoy the breather, or add a booking." />
          ) : (
            <div className="space-y-2.5">
              {todays.map((b) => {
                const p = byId[b.patientId];
                return (
                  <Link
                    to={p ? `/patients/${p.id}` : "/calendar"}
                    key={b.id}
                    className="card flex items-center gap-3 p-3.5 transition hover:shadow-soft"
                  >
                    <div className="w-16 shrink-0 text-center">
                      <div className="text-sm font-bold text-brand-800">{fmtTime(b.start)}</div>
                      <div className="text-[11px] text-brand-400">{b.durationMin} min</div>
                    </div>
                    <div className="h-10 w-px bg-brand-100" />
                    <Avatar name={p?.name || "?"} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-brand-900">{p?.name || "Unknown"}</div>
                      <div className="truncate text-xs text-brand-500">{b.type} · {p?.condition}</div>
                    </div>
                    <Badge tone={b.status === "confirmed" ? "green" : "amber"}>{b.status}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <SectionHeader
            title="Recent sessions"
            action={
              <Link to="/sessions" className="text-sm font-semibold text-brand-700 hover:underline">
                All
              </Link>
            }
          />
          {recentSessions.length === 0 ? (
            <EmptyState icon={Clipboard} title="No sessions yet" />
          ) : (
            <div className="space-y-2.5">
              {recentSessions.map((s) => {
                const p = byId[s.patientId];
                return (
                  <div key={s.id} className="card p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-brand-900">{p?.name || "Unknown"}</span>
                      <Badge tone={s.paid ? "green" : "amber"}>{s.paid ? "Paid" : "Due"}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-brand-500">{s.workDone}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-brand-400">
                      <span>{relativeDay(s.date)}</span>
                      <span>Pain {s.painLevel}/10</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
