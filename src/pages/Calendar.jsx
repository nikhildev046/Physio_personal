import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { availabilityApi, bookingsApi, patientsApi, settingsApi, sessionsApi } from "../api/services.js";
import { useApp } from "../store/AppContext.jsx";
import { startOfWeek, addDays, dateKey } from "../lib/slots.js";
import { Avatar, Badge, Spinner, Modal, Field, EmptyState } from "../components/ui.jsx";
import { Chevron, Plus, Calendar as CalIcon, X, Check, Clipboard } from "../components/Icons.jsx";
import RecordSessionModal from "../components/RecordSessionModal.jsx";
import { fmtDate, fmtTime, relativeDay, inr } from "../lib/format.js";

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ROW_H = 22; // px per 30-min row
const minutesOf = (d) => d.getHours() * 60 + d.getMinutes();

export default function Calendar() {
  const navigate = useNavigate();
  const { pushAlert } = useApp();
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [days, setDays] = useState([]);
  const [patients, setPatients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({ slotDurationMin: 45, dayStart: "08:00", dayEnd: "20:00" });
  const [loading, setLoading] = useState(true);

  // Modal state for booking / blocking a slot.
  const [slotModal, setSlotModal] = useState(null); // { slot } or { preset:false }
  const [form, setForm] = useState({ patientId: "", date: "", time: "10:00", type: "Follow-up" });
  const [busy, setBusy] = useState(false);

  // Booked-slot detail + session linkage.
  const [detail, setDetail] = useState(null); // { day, slot }
  const [sessionPreset, setSessionPreset] = useState(null);

  // Visible date range depends on the view.
  const range = useMemo(() => {
    if (view === "month") {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const from = startOfWeek(first);
      return { from, to: addDays(from, 41) };
    }
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 6) };
  }, [view, anchor]);

  const byId = useMemo(() => Object.fromEntries(patients.map((p) => [p.id, p])), [patients]);

  const load = useCallback(async () => {
    const [d, p, s, b, sess] = await Promise.all([
      availabilityApi.getSlots(range.from, range.to),
      patientsApi.list(),
      settingsApi.get(),
      bookingsApi.list(),
      sessionsApi.list(),
    ]);
    setDays(d);
    setPatients(p);
    setSettings(s);
    setBookings(b);
    setSessions(sess);
  }, [range.from, range.to]);

  // Which bookings already have a session recorded.
  const sessionByBooking = useMemo(() => {
    const m = {};
    sessions.forEach((s) => s.bookingId && (m[s.bookingId] = s));
    return m;
  }, [sessions]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const step = (dir) =>
    setAnchor((a) => {
      const x = new Date(a);
      if (view === "month") x.setMonth(x.getMonth() + dir);
      else x.setDate(x.getDate() + dir * 7);
      return x;
    });

  const title = useMemo(() => {
    if (view === "month")
      return anchor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const ws = startOfWeek(anchor);
    const we = addDays(ws, 6);
    const sameMonth = ws.getMonth() === we.getMonth();
    return `${ws.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${we.toLocaleDateString(
      "en-IN",
      sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" }
    )}`;
  }, [view, anchor]);

  // --- slot actions -------------------------------------------------------
  const openBookFromSlot = (day, slot) => {
    if (slot.status === "booked") {
      setDetail({ day, slot });
      return;
    }
    setForm({ patientId: "", date: day.dateKey, time: slot.time, type: "Follow-up" });
    setSlotModal({ slot, day });
  };

  const recordSessionFor = (slot) => {
    setDetail(null);
    setSessionPreset({
      patientId: slot.booking.patientId,
      bookingId: slot.booking.id,
      date: new Date(slot.booking.start).toISOString().slice(0, 10),
    });
  };

  const cancelBooking = async (booking) => {
    setBusy(true);
    await bookingsApi.update(booking.id, { status: "cancelled" });
    await load();
    setBusy(false);
    setDetail(null);
  };

  const book = async () => {
    if (!form.patientId) return;
    setBusy(true);
    const start = new Date(`${form.date}T${form.time}:00`).toISOString();
    await bookingsApi.create({
      patientId: form.patientId,
      start,
      durationMin: settings.slotDurationMin,
      type: form.type,
      status: "confirmed",
    });
    const name = patients.find((p) => p.id === form.patientId)?.name || "Patient";
    await pushAlert({
      type: "booking",
      title: "New booking",
      body: `${name} · ${fmtDate(start, { day: "numeric", month: "short" })} ${fmtTime(start)}`,
    });
    await load();
    setBusy(false);
    setSlotModal(null);
  };

  const toggleBlock = async () => {
    const { slot, day } = slotModal;
    setBusy(true);
    if (slot.status === "blocked") await availabilityApi.openSlot(day.dateKey, slot.time);
    else await availabilityApi.closeSlot(day.dateKey, slot.time);
    await load();
    setBusy(false);
    setSlotModal(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-lg text-brand-600 hover:bg-brand-50">
            <Chevron width={18} height={18} className="rotate-180" />
          </button>
          <button onClick={() => setAnchor(new Date())} className="btn-outline px-3 py-1.5 text-sm">Today</button>
          <button onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-lg text-brand-600 hover:bg-brand-50">
            <Chevron width={18} height={18} />
          </button>
          <h2 className="ml-2 text-lg font-bold text-brand-900">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-brand-100/70 p-1">
            {[["week", "Week"], ["month", "Month"], ["list", "List"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                  view === k ? "bg-white text-brand-800 shadow-sm" : "text-brand-500"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setForm({ patientId: "", date: dateKey(new Date()), time: "10:00", type: "Follow-up" });
              setSlotModal({ slot: null });
            }}
            className="btn-primary px-3 py-2"
          >
            <Plus width={16} height={16} /> <span className="hidden sm:inline">Booking</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-brand-500">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-brand-600" /> Booked</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-brand-300 bg-brand-50" /> Open slot</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-slate-200" /> Blocked</span>
      </div>

      {loading ? (
        <Spinner label="Loading calendar…" />
      ) : view === "week" ? (
        <WeekGrid days={days} settings={settings} byId={byId} onSlot={openBookFromSlot} />
      ) : view === "month" ? (
        <MonthGrid days={days} anchor={anchor} onPickDay={(d) => { setAnchor(d); setView("week"); }} />
      ) : (
        <ListView days={days} byId={byId} navigate={navigate} onReload={load} />
      )}

      {/* Slot / booking modal */}
      <Modal
        open={!!slotModal}
        onClose={() => setSlotModal(null)}
        title={
          slotModal?.slot?.status === "blocked"
            ? "Blocked slot"
            : slotModal?.slot
            ? "Slot"
            : "Add booking"
        }
        footer={
          slotModal?.slot?.status === "blocked" ? (
            <>
              <button onClick={() => setSlotModal(null)} className="btn-outline">Close</button>
              <button onClick={toggleBlock} className="btn-primary" disabled={busy}>Re-open slot</button>
            </>
          ) : (
            <>
              {slotModal?.slot && (
                <button onClick={toggleBlock} className="btn-outline mr-auto text-rose-600" disabled={busy}>
                  Block slot
                </button>
              )}
              <button onClick={() => setSlotModal(null)} className="btn-outline">Cancel</button>
              <button onClick={book} className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Book slot"}
              </button>
            </>
          )
        }
      >
        {slotModal?.slot?.status === "blocked" ? (
          <p className="text-sm text-brand-600">
            {fmtDate(slotModal.day.dateKey, { weekday: "long", day: "numeric", month: "long" })} at{" "}
            {slotModal.slot.time} is currently closed for bookings.
          </p>
        ) : (
          <div className="space-y-4">
            {slotModal?.slot ? (
              <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700">
                {fmtDate(slotModal.day.dateKey, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
                {slotModal.slot.time} ({settings.slotDurationMin} min)
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <input type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </Field>
                <Field label="Time">
                  <input type="time" className="input" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
                </Field>
              </div>
            )}
            <Field label="Patient">
              <select className="input" value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}>
                <option value="">Select a patient…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option>Follow-up</option><option>Assessment</option><option>Rehab session</option><option>Consultation</option>
              </select>
            </Field>
          </div>
        )}
      </Modal>

      {/* Booked-slot detail — links the appointment to its session */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Appointment"
        footer={
          detail && (
            <>
              <button onClick={() => cancelBooking(detail.slot.booking)} className="btn-outline mr-auto text-rose-600" disabled={busy}>
                Cancel booking
              </button>
              <button onClick={() => navigate(`/patients/${detail.slot.booking.patientId}`)} className="btn-outline">
                Open patient
              </button>
              {sessionByBooking[detail.slot.booking.id] ? (
                <button onClick={() => navigate(`/patients/${detail.slot.booking.patientId}`)} className="btn-primary">
                  View session
                </button>
              ) : (
                <button onClick={() => recordSessionFor(detail.slot)} className="btn-primary">
                  Record session
                </button>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={byId[detail.slot.booking.patientId]?.name || "?"} size={44} />
              <div>
                <div className="font-semibold text-brand-900">{byId[detail.slot.booking.patientId]?.name || "Unknown"}</div>
                <div className="text-sm text-brand-500">{byId[detail.slot.booking.patientId]?.condition}</div>
              </div>
            </div>
            <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-700">
              {detail.slot.booking.type} ·{" "}
              {fmtDate(detail.slot.booking.start, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
              {fmtTime(detail.slot.booking.start)}
            </div>
            {sessionByBooking[detail.slot.booking.id] ? (
              <div className="flex items-start gap-2 rounded-xl border border-brand-100 px-3.5 py-2.5 text-sm">
                <Clipboard width={16} height={16} className="mt-0.5 shrink-0 text-brand-500" />
                <div>
                  <div className="font-semibold text-brand-800">Session recorded</div>
                  <div className="text-brand-500">{sessionByBooking[detail.slot.booking.id].workDone}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-400">No session recorded for this appointment yet.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Shared record-session form, pre-linked to the booked slot */}
      <RecordSessionModal
        open={!!sessionPreset}
        onClose={() => setSessionPreset(null)}
        patients={patients}
        bookings={bookings}
        sessions={sessions}
        preset={sessionPreset}
        onSaved={load}
      />
    </div>
  );
}

// --- Week time-grid ---------------------------------------------------------
function WeekGrid({ days, settings, byId, onSlot }) {
  // Grid bounds: from settings, expanded to fit any slot that falls outside.
  const bounds = useMemo(() => {
    let lo = toMinSafe(settings.dayStart, 480);
    let hi = toMinSafe(settings.dayEnd, 1200);
    days.forEach((d) =>
      d.slots.forEach((s) => {
        lo = Math.min(lo, minutesOf(s.start));
        hi = Math.max(hi, minutesOf(s.end));
      })
    );
    lo = Math.floor(lo / 60) * 60;
    hi = Math.ceil(hi / 60) * 60;
    return { lo, hi };
  }, [days, settings]);

  const rows = (bounds.hi - bounds.lo) / 30;
  const height = rows * ROW_H;
  const hours = [];
  for (let m = bounds.lo; m < bounds.hi; m += 60) hours.push(m);

  return (
    <div className="card overflow-x-auto p-0">
      <div className="min-w-[680px]">
        {/* Day headers */}
        <div className="flex border-b border-brand-100">
          <div className="w-12 shrink-0" />
          {days.map((d) => {
            const isToday = d.dateKey === dateKey(new Date());
            return (
              <div key={d.dateKey} className="flex-1 border-l border-brand-100 px-1 py-2 text-center">
                <div className="text-[11px] font-medium uppercase text-brand-400">{WEEK_LABELS[(d.date.getDay() + 6) % 7]}</div>
                <div className={`mx-auto mt-0.5 grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${isToday ? "bg-brand-700 text-white" : "text-brand-900"}`}>
                  {d.date.getDate()}
                </div>
                {d.isHoliday && <div className="mt-0.5 text-[10px] font-semibold text-rose-500">Holiday</div>}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex">
          {/* time gutter */}
          <div className="relative w-12 shrink-0" style={{ height }}>
            {hours.map((m) => (
              <div key={m} className="absolute right-1.5 -translate-y-1/2 text-[10px] font-medium text-brand-400" style={{ top: ((m - bounds.lo) / 30) * ROW_H }}>
                {labelHour(m)}
              </div>
            ))}
          </div>

          {days.map((d) => (
            <div
              key={d.dateKey}
              className="relative flex-1 border-l border-brand-100"
              style={{
                height,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ROW_H * 2 - 1}px, #eef6f4 ${ROW_H * 2 - 1}px, #eef6f4 ${ROW_H * 2}px)`,
              }}
            >
              {d.slots.map((s, i) => {
                const top = ((minutesOf(s.start) - bounds.lo) / 30) * ROW_H;
                const h = Math.max(ROW_H, ((s.end - s.start) / 60000 / 30) * ROW_H);
                const styleBase = "absolute inset-x-0.5 overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight";
                if (s.status === "booked") {
                  return (
                    <button key={i} onClick={() => onSlot(d, s)} className={`${styleBase} bg-brand-600 text-white hover:bg-brand-700`} style={{ top, height: h }}>
                      <div className="truncate font-semibold">{byId[s.booking?.patientId]?.name || s.time}</div>
                      <div className="truncate opacity-90">{s.booking?.type || "Booked"}</div>
                    </button>
                  );
                }
                if (s.status === "blocked") {
                  return (
                    <button key={i} onClick={() => onSlot(d, s)} className={`${styleBase} bg-slate-200 text-slate-500 hover:bg-slate-300`} style={{ top, height: h }}>
                      <div className="truncate">{s.time} · closed</div>
                    </button>
                  );
                }
                return (
                  <button key={i} onClick={() => onSlot(d, s)} className={`${styleBase} border border-dashed border-brand-300 bg-brand-50 text-brand-600 hover:bg-brand-100`} style={{ top, height: h }}>
                    <div className="font-medium">{s.time}</div>
                    <div className="opacity-70">Open</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Month grid -------------------------------------------------------------
function MonthGrid({ days, anchor, onPickDay }) {
  const month = anchor.getMonth();
  return (
    <div className="card overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-brand-100 bg-brand-50/50">
        {WEEK_LABELS.map((l) => (
          <div key={l} className="py-2 text-center text-[11px] font-semibold uppercase text-brand-400">{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const inMonth = d.date.getMonth() === month;
          const isToday = d.dateKey === dateKey(new Date());
          const booked = d.slots.filter((s) => s.status === "booked").length;
          const open = d.slots.filter((s) => s.status === "open").length;
          return (
            <button
              key={d.dateKey}
              onClick={() => onPickDay(d.date)}
              className={`min-h-[78px] border-b border-l border-brand-100 p-1.5 text-left transition hover:bg-brand-50 ${inMonth ? "" : "bg-brand-50/30 text-brand-300"}`}
            >
              <div className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${isToday ? "bg-brand-700 text-white" : inMonth ? "text-brand-900" : "text-brand-300"}`}>
                {d.date.getDate()}
              </div>
              <div className="mt-1 space-y-0.5">
                {d.isHoliday && <span className="block truncate rounded bg-rose-50 px-1 text-[10px] font-semibold text-rose-500">Holiday</span>}
                {booked > 0 && <span className="block truncate rounded bg-brand-600 px-1 text-[10px] font-semibold text-white">{booked} booked</span>}
                {open > 0 && <span className="block truncate text-[10px] font-medium text-brand-500">{open} open</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- List view --------------------------------------------------------------
function ListView({ days, byId, navigate, onReload }) {
  const groups = days
    .map((d) => ({ d, items: d.slots.filter((s) => s.status === "booked") }))
    .filter((g) => g.items.length > 0);

  const cancel = async (booking) => {
    await bookingsApi.update(booking.id, { status: "cancelled" });
    onReload();
  };

  if (groups.length === 0)
    return <EmptyState icon={CalIcon} title="No bookings in this range" hint="Use the arrows to browse other weeks/months." />;

  return (
    <div className="space-y-5">
      {groups.map(({ d, items }) => (
        <div key={d.dateKey}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-400">{relativeDay(d.date.toISOString())}</h3>
          <div className="space-y-2.5">
            {items.map((s) => {
              const p = byId[s.booking.patientId];
              const past = s.start < new Date();
              return (
                <div key={s.booking.id} className="card flex items-center gap-3 p-3.5">
                  <div className="w-16 shrink-0 text-center">
                    <div className="text-sm font-bold text-brand-800">{fmtTime(s.start)}</div>
                    <div className="text-[11px] text-brand-400">{s.booking.durationMin || ""} min</div>
                  </div>
                  <div className="h-10 w-px bg-brand-100" />
                  <button onClick={() => p && navigate(`/patients/${p.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Avatar name={p?.name || "?"} size={40} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-brand-900">{p?.name || "Unknown"}</div>
                      <div className="truncate text-xs text-brand-500">{s.booking.type}</div>
                    </div>
                  </button>
                  <Badge tone={s.booking.status === "completed" ? "brand" : "green"}>{s.booking.status}</Badge>
                  {!past && (
                    <button onClick={() => cancel(s.booking)} title="Cancel" className="grid h-8 w-8 place-items-center rounded-lg text-rose-400 hover:bg-rose-50">
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
  );
}

// helpers
function toMinSafe(hhmm, fallback) {
  if (!hhmm) return fallback;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function labelHour(m) {
  const h = Math.floor(m / 60);
  const ampm = h >= 12 ? "p" : "a";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ampm}`;
}
