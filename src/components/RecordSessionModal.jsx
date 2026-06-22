import { useEffect, useMemo, useState } from "react";
import { sessionsApi } from "../api/services.js";
import { Modal, Field } from "./ui.jsx";
import { fmtDate, fmtTime } from "../lib/format.js";

const blank = {
  patientId: "",
  bookingId: "",
  date: new Date().toISOString().slice(0, 10),
  workDone: "",
  exercisesPerformed: "",
  painLevel: 3,
  response: "Good",
  progress: "",
  clinicalNotes: "",
  nextGoal: "",
  amount: 800,
  paid: false,
};

/**
 * Shared "record a session" form. Sessions are the clinical record of a booked
 * slot, so this can be opened either standalone or pre-linked to a booking.
 *
 * preset: { patientId?, bookingId?, date? } — when bookingId is given the
 *   session is locked to that appointment.
 * bookings / sessions: used to offer "link to an appointment" when not preset.
 */
export default function RecordSessionModal({ open, onClose, patients = [], bookings = [], sessions = [], preset, onSaved }) {
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...blank, ...(preset || {}) });
  }, [open, preset]);

  const lockedToBooking = !!preset?.bookingId;
  const lockedPatient = !!preset?.patientId;

  const presetBooking = useMemo(
    () => bookings.find((b) => b.id === preset?.bookingId),
    [bookings, preset]
  );

  // Bookings for the chosen patient that don't yet have a session recorded.
  const linkable = useMemo(() => {
    if (!form.patientId) return [];
    const used = new Set(sessions.map((s) => s.bookingId).filter(Boolean));
    return bookings
      .filter((b) => b.patientId === form.patientId && b.status !== "cancelled" && !used.has(b.id))
      .sort((a, b) => new Date(b.start) - new Date(a.start));
  }, [bookings, sessions, form.patientId]);

  const pickBooking = (id) => {
    const b = bookings.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      bookingId: id,
      date: b ? new Date(b.start).toISOString().slice(0, 10) : f.date,
    }));
  };

  const save = async () => {
    if (!form.patientId || !form.workDone) return;
    setBusy(true);
    const saved = await sessionsApi.create({
      ...form,
      painLevel: Number(form.painLevel),
      amount: Number(form.amount),
      bookingId: form.bookingId || undefined,
    });
    setBusy(false);
    onSaved?.(saved);
    onClose?.();
  };

  const patientName = patients.find((p) => p.id === form.patientId)?.name;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a session"
      wide
      footer={
        <>
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={save} className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save session"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {lockedToBooking && presetBooking ? (
          <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-700">
            <span className="font-semibold">{patientName}</span> · {presetBooking.type}
            <div className="text-xs text-brand-500">
              {fmtDate(presetBooking.start, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(presetBooking.start)} — recording this completes the appointment.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Patient">
              {lockedPatient ? (
                <div className="input bg-brand-50 font-medium text-brand-800">{patientName}</div>
              ) : (
                <select className="input" value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value, bookingId: "" }))}>
                  <option value="">Select…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </Field>
            <Field label="Date">
              <input type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
          </div>
        )}

        {!lockedToBooking && form.patientId && linkable.length > 0 && (
          <Field label="Link to appointment (optional)">
            <select className="input" value={form.bookingId} onChange={(e) => pickBooking(e.target.value)}>
              <option value="">Not linked</option>
              {linkable.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.type} · {fmtDate(b.start, { day: "numeric", month: "short" })} {fmtTime(b.start)}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="What was done">
          <textarea rows={2} className="input" value={form.workDone} onChange={(e) => setForm((f) => ({ ...f, workDone: e.target.value }))} placeholder="Manual therapy, exercises…" />
        </Field>
        <Field label="Exercises performed">
          <input className="input" value={form.exercisesPerformed} onChange={(e) => setForm((f) => ({ ...f, exercisesPerformed: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Pain level — ${form.painLevel}/10`}>
            <input type="range" min="0" max="10" className="w-full accent-brand-600" value={form.painLevel} onChange={(e) => setForm((f) => ({ ...f, painLevel: e.target.value }))} />
          </Field>
          <Field label="Response">
            <select className="input" value={form.response} onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))}>
              <option>Good</option><option>Moderate</option><option>Slow</option><option>Baseline</option>
            </select>
          </Field>
        </div>
        <Field label="Progress">
          <input className="input" value={form.progress} onChange={(e) => setForm((f) => ({ ...f, progress: e.target.value }))} />
        </Field>
        <Field label="Clinical notes">
          <textarea rows={2} className="input" value={form.clinicalNotes} onChange={(e) => setForm((f) => ({ ...f, clinicalNotes: e.target.value }))} />
        </Field>
        <Field label="Goal for next time">
          <input className="input" value={form.nextGoal} onChange={(e) => setForm((f) => ({ ...f, nextGoal: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 items-end gap-3">
          <Field label="Fee (₹)">
            <input type="number" className="input" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </Field>
          <label className="flex h-[46px] cursor-pointer items-center gap-2 rounded-xl border border-brand-200 px-3.5">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.paid} onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))} />
            <span className="text-sm font-medium text-brand-700">Marked as paid</span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
