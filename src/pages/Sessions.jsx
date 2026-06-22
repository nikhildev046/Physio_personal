import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { sessionsApi, patientsApi, bookingsApi } from "../api/services.js";
import { Avatar, Badge, SectionHeader, Spinner, EmptyState } from "../components/ui.jsx";
import { Plus, Clipboard, Calendar } from "../components/Icons.jsx";
import RecordSessionModal from "../components/RecordSessionModal.jsx";
import { inr, fmtDate, fmtTime } from "../lib/format.js";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = () =>
    Promise.all([sessionsApi.list(), patientsApi.list(), bookingsApi.list()]).then(([s, p, b]) => {
      setSessions(s.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setPatients(p);
      setBookings(b);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const byId = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p])), [patients]);
  const bookingById = useMemo(() => Object.fromEntries(bookings.map((b) => [b.id, b])), [bookings]);

  const togglePaid = async (s) => {
    await sessionsApi.update(s.id, { paid: !s.paid });
    setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, paid: !x.paid } : x)));
  };

  if (loading) return <Spinner label="Loading sessions…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Session records"
        subtitle="The clinical record of each appointment."
        action={
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus width={16} height={16} /> Record session
          </button>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState icon={Clipboard} title="No sessions yet" hint="Record what was done after each appointment." />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const p = byId[s.patientId];
            const booking = s.bookingId ? bookingById[s.bookingId] : null;
            return (
              <div key={s.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={p?.name || "?"} size={42} />
                  <div className="min-w-0 flex-1">
                    <Link to={p ? `/patients/${p.id}` : "#"} className="font-semibold text-brand-900 hover:underline">
                      {p?.name || "Unknown"}
                    </Link>
                    <div className="text-xs text-brand-400">{fmtDate(s.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                  <Badge tone="sky">Pain {s.painLevel}/10</Badge>
                  <button onClick={() => togglePaid(s)}>
                    <Badge tone={s.paid ? "green" : "amber"}>{s.paid ? "Paid" : inr(s.amount) + " due"}</Badge>
                  </button>
                </div>

                {booking && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">
                    <Calendar width={13} height={13} />
                    {booking.type} · {fmtDate(booking.start, { day: "numeric", month: "short" })} {fmtTime(booking.start)}
                  </div>
                )}

                <p className="mt-3 text-sm text-brand-700"><span className="font-semibold">Done:</span> {s.workDone}</p>
                {s.progress && <p className="mt-1 text-sm text-brand-500"><span className="font-semibold">Progress:</span> {s.progress}</p>}
                {s.nextGoal && <p className="mt-1 text-sm text-brand-500"><span className="font-semibold">Next:</span> {s.nextGoal}</p>}
              </div>
            );
          })}
        </div>
      )}

      <RecordSessionModal
        open={modal}
        onClose={() => setModal(false)}
        patients={patients}
        bookings={bookings}
        sessions={sessions}
        onSaved={load}
      />
    </div>
  );
}
