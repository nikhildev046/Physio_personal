import { useEffect, useMemo, useState } from "react";
import { bookingsApi, patientsApi } from "../api/services.js";
import { Avatar, Badge, SectionHeader, Spinner, Modal, Field, EmptyState } from "../components/ui.jsx";
import { Plus, Calendar, X } from "../components/Icons.jsx";
import { fmtTime, relativeDay } from "../lib/format.js";

const TABS = [
  ["upcoming", "Upcoming"],
  ["past", "Past"],
  ["all", "All"],
];

const emptyForm = { patientId: "", date: "", time: "10:00", durationMin: 45, type: "Follow-up" };

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([bookingsApi.list(), patientsApi.list()]).then(([b, p]) => {
      setBookings(b);
      setPatients(p);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const byId = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p])), [patients]);
  const now = Date.now();

  const filtered = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => new Date(a.start) - new Date(b.start));
    if (tab === "upcoming")
      return sorted.filter((b) => new Date(b.start) >= now && b.status !== "cancelled");
    if (tab === "past")
      return sorted.filter((b) => new Date(b.start) < now).reverse();
    return sorted;
  }, [bookings, tab, now]);

  // Group by day label.
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((b) => {
      const key = relativeDay(b.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return [...map.entries()];
  }, [filtered]);

  const create = async () => {
    if (!form.patientId || !form.date) return;
    setSaving(true);
    const start = new Date(`${form.date}T${form.time}:00`).toISOString();
    await bookingsApi.create({
      patientId: form.patientId,
      start,
      durationMin: Number(form.durationMin),
      type: form.type,
      status: "confirmed",
    });
    await load();
    setSaving(false);
    setModal(false);
    setForm(emptyForm);
  };

  const cancel = async (id) => {
    await bookingsApi.update(id, { status: "cancelled" });
    load();
  };

  if (loading) return <Spinner label="Loading bookings…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Bookings"
        subtitle="Upcoming and past appointments."
        action={
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus width={16} height={16} /> Add booking
          </button>
        }
      />

      <div className="inline-flex rounded-xl bg-brand-100/70 p-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              tab === key ? "bg-white text-brand-800 shadow-sm" : "text-brand-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Calendar} title="Nothing here" hint="Add a booking for a phone or walk-in patient." />
      ) : (
        <div className="space-y-5">
          {groups.map(([day, items]) => (
            <div key={day}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-400">{day}</h3>
              <div className="space-y-2.5">
                {items.map((b) => {
                  const p = byId[b.patientId];
                  return (
                    <div key={b.id} className="card flex items-center gap-3 p-3.5">
                      <div className="w-16 shrink-0 text-center">
                        <div className="text-sm font-bold text-brand-800">{fmtTime(b.start)}</div>
                        <div className="text-[11px] text-brand-400">{b.durationMin} min</div>
                      </div>
                      <div className="h-10 w-px bg-brand-100" />
                      <Avatar name={p?.name || "?"} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-brand-900">{p?.name || "Unknown"}</div>
                        <div className="truncate text-xs text-brand-500">{b.type}</div>
                      </div>
                      <Badge
                        tone={
                          b.status === "confirmed"
                            ? "green"
                            : b.status === "completed"
                            ? "brand"
                            : b.status === "cancelled"
                            ? "rose"
                            : "amber"
                        }
                      >
                        {b.status}
                      </Badge>
                      {new Date(b.start) >= now && b.status !== "cancelled" && (
                        <button
                          onClick={() => cancel(b.id)}
                          title="Cancel"
                          className="grid h-8 w-8 place-items-center rounded-lg text-rose-400 hover:bg-rose-50"
                        >
                          <X width={16} height={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add a booking"
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={create} className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Add booking"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Patient">
            <select
              className="input"
              value={form.patientId}
              onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
            >
              <option value="">Select a patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <Field label="Time">
              <input
                type="time"
                className="input"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (min)">
              <input
                type="number"
                min="15"
                step="15"
                className="input"
                value={form.durationMin}
                onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
              />
            </Field>
            <Field label="Type">
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option>Follow-up</option>
                <option>Assessment</option>
                <option>Rehab session</option>
                <option>Consultation</option>
              </select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
