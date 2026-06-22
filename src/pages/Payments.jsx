import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { sessionsApi, patientsApi } from "../api/services.js";
import { Avatar, Badge, StatCard, SectionHeader, Spinner, EmptyState } from "../components/ui.jsx";
import { Rupee, Check } from "../components/Icons.jsx";
import { inr, fmtDate } from "../lib/format.js";

export default function Payments() {
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("due");

  const load = () =>
    Promise.all([sessionsApi.list(), patientsApi.list()]).then(([s, p]) => {
      setSessions(s.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setPatients(p);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const byId = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p])), [patients]);

  const totals = useMemo(() => {
    const due = sessions.filter((s) => !s.paid).reduce((a, s) => a + (s.amount || 0), 0);
    const collected = sessions.filter((s) => s.paid).reduce((a, s) => a + (s.amount || 0), 0);
    return { due, collected };
  }, [sessions]);

  // Outstanding grouped per patient.
  const perPatient = useMemo(() => {
    const map = new Map();
    sessions.filter((s) => !s.paid).forEach((s) => {
      map.set(s.patientId, (map.get(s.patientId) || 0) + (s.amount || 0));
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const list = sessions.filter((s) => (tab === "due" ? !s.paid : s.paid));

  const markPaid = async (s) => {
    await sessionsApi.update(s.id, { paid: true });
    setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, paid: true } : x)));
  };

  if (loading) return <Spinner label="Loading payments…" />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Payments" subtitle="Track who has paid and who owes." />

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Rupee} label="Outstanding" value={inr(totals.due)} tone="amber" />
        <StatCard icon={Check} label="Collected" value={inr(totals.collected)} tone="brand" />
      </div>

      {perPatient.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-brand-800">Outstanding by patient</h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {perPatient.map(([pid, amt]) => {
              const p = byId[pid];
              return (
                <Link key={pid} to={`/patients/${pid}`} className="card flex items-center gap-3 p-3.5 transition hover:shadow-soft">
                  <Avatar name={p?.name || "?"} size={40} tone="amber" />
                  <span className="flex-1 truncate font-semibold text-brand-900">{p?.name || "Unknown"}</span>
                  <span className="font-bold text-amber-600">{inr(amt)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 inline-flex rounded-xl bg-brand-100/70 p-1">
          {[["due", "Due"], ["paid", "Paid"]].map(([k, l]) => (
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

        {list.length === 0 ? (
          <EmptyState icon={Rupee} title={tab === "due" ? "All settled up" : "No payments recorded"} />
        ) : (
          <div className="space-y-2.5">
            {list.map((s) => {
              const p = byId[s.patientId];
              return (
                <div key={s.id} className="card flex items-center gap-3 p-3.5">
                  <Avatar name={p?.name || "?"} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-brand-900">{p?.name || "Unknown"}</div>
                    <div className="text-xs text-brand-400">Session · {fmtDate(s.date)}</div>
                  </div>
                  <span className="font-bold text-brand-900">{inr(s.amount)}</span>
                  {s.paid ? (
                    <Badge tone="green">Paid</Badge>
                  ) : (
                    <button onClick={() => markPaid(s)} className="btn-ghost px-3 py-1.5 text-xs">
                      <Check width={14} height={14} /> Mark paid
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
