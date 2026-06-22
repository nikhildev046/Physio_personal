import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { patientsApi, bookingsApi, sessionsApi, exercisesApi } from "../api/services.js";
import { Avatar, Badge, Spinner, ProgressBar, EmptyState } from "../components/ui.jsx";
import { Phone, Clipboard, Dumbbell, Calendar, Rupee, Chevron, Video } from "../components/Icons.jsx";
import { inr, fmtDate, fmtTime, relativeDay } from "../lib/format.js";

const TABS = [
  ["overview", "Overview"],
  ["sessions", "Sessions"],
  ["exercises", "Exercises"],
];

export default function PatientProfile() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      patientsApi.get(id),
      bookingsApi.list(),
      sessionsApi.list(),
      exercisesApi.list(),
    ])
      .then(([p, b, s, e]) => {
        setPatient(p);
        setBookings(b.filter((x) => x.patientId === id));
        setSessions(s.filter((x) => x.patientId === id).sort((a, b) => new Date(b.date) - new Date(a.date)));
        setExercises(e.filter((x) => x.patientId === id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const outstanding = useMemo(
    () => sessions.filter((s) => !s.paid).reduce((sum, s) => sum + (s.amount || 0), 0),
    [sessions]
  );
  const bookingById = useMemo(
    () => Object.fromEntries(bookings.map((b) => [b.id, b])),
    [bookings]
  );

  if (loading) return <Spinner label="Loading profile…" />;
  if (!patient)
    return <EmptyState icon={Clipboard} title="Patient not found" hint={<Link to="/patients" className="text-brand-700 underline">Back to patients</Link>} />;

  return (
    <div className="space-y-5">
      <Link to="/patients" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
        <Chevron width={16} height={16} className="rotate-180" /> All patients
      </Link>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={patient.name} size={64} tone={patient.status === "active" ? "brand" : "slate"} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-brand-900">{patient.name}</h2>
              <Badge tone={patient.status === "active" ? "green" : "slate"}>{patient.status}</Badge>
            </div>
            <p className="text-sm text-brand-500">{patient.condition}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-400">
              <span>{patient.age ? `${patient.age} yrs` : "—"} · {patient.gender}</span>
              <span className="inline-flex items-center gap-1"><Phone width={14} height={14} /> {patient.phone || "—"}</span>
              <span>Since {fmtDate(patient.startedOn, { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-brand-400">
              <span>Recovery</span><span className="font-semibold text-brand-600">{patient.progress}%</span>
            </div>
            <ProgressBar value={patient.progress} tone={patient.progress >= 100 ? "emerald" : "brand"} />
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xs text-brand-400">Sessions</div>
            <div className="text-lg font-bold text-brand-900">{sessions.length}</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xs text-brand-400">Outstanding</div>
            <div className={`text-lg font-bold ${outstanding > 0 ? "text-amber-600" : "text-emerald-600"}`}>{inr(outstanding)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl bg-brand-100/70 p-1">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              tab === k ? "bg-white text-brand-800 shadow-sm" : "text-brand-500"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {patient.notes && (
            <div className="card p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-brand-400">Clinical notes</div>
              <p className="mt-1 text-sm text-brand-700">{patient.notes}</p>
            </div>
          )}
          <div>
            <h3 className="mb-2 text-sm font-bold text-brand-800">Appointment history</h3>
            {bookings.length === 0 ? (
              <EmptyState icon={Calendar} title="No appointments" />
            ) : (
              <div className="space-y-2">
                {[...bookings].sort((a, b) => new Date(b.start) - new Date(a.start)).map((b) => (
                  <div key={b.id} className="card flex items-center gap-3 p-3">
                    <Calendar width={18} height={18} className="text-brand-400" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-brand-900">{b.type}</div>
                      <div className="text-xs text-brand-400">{relativeDay(b.start)} · {fmtTime(b.start)}</div>
                    </div>
                    <Badge tone={b.status === "completed" ? "brand" : b.status === "confirmed" ? "green" : b.status === "cancelled" ? "rose" : "amber"}>{b.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "sessions" && (
        sessions.length === 0 ? (
          <EmptyState icon={Clipboard} title="No sessions recorded" hint="Session notes will appear here." />
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-brand-900">{fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })}</span>
                    {s.bookingId && bookingById[s.bookingId] && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600">
                        <Calendar width={12} height={12} /> {bookingById[s.bookingId].type} · {fmtTime(bookingById[s.bookingId].start)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="sky">Pain {s.painLevel}/10</Badge>
                    <Badge tone={s.paid ? "green" : "amber"}>{s.paid ? "Paid" : inr(s.amount) + " due"}</Badge>
                  </div>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <Detail label="Work done" value={s.workDone} />
                  <Detail label="Exercises" value={s.exercisesPerformed} />
                  <Detail label="Response" value={s.response} />
                  <Detail label="Progress" value={s.progress} />
                  <Detail label="Clinical notes" value={s.clinicalNotes} />
                  <Detail label="Goal next time" value={s.nextGoal} />
                </dl>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "exercises" && (
        exercises.length === 0 ? (
          <EmptyState icon={Dumbbell} title="No exercises assigned" hint="Assign exercises from the Exercises tab." />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {exercises.map((e) => (
              <div key={e.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-brand-900">{e.name}</div>
                    <div className="text-sm text-brand-500">{e.sets} sets × {e.reps} reps</div>
                  </div>
                  <Dumbbell width={20} height={20} className="text-brand-300" />
                </div>
                {e.notes && <p className="mt-2 text-sm text-brand-500">{e.notes}</p>}
                {e.videoUrl && (
                  <a href={e.videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                    <Video width={16} height={16} /> Watch demo
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-400">{label}</dt>
      <dd className="text-brand-800">{value}</dd>
    </div>
  );
}
