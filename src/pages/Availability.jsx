import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { availabilityApi, settingsApi } from "../api/services.js";
import { Badge, SectionHeader, Spinner, Modal, Field, EmptyState } from "../components/ui.jsx";
import { Plus, X, Clock, Trash, Calendar } from "../components/Icons.jsx";
import { fmtDate } from "../lib/format.js";

const DAYS = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];

export default function Availability() {
  const [week, setWeek] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [holModal, setHolModal] = useState(false);
  const [holForm, setHolForm] = useState({ date: "", reason: "" });

  useEffect(() => {
    Promise.all([availabilityApi.get(), availabilityApi.holidays(), settingsApi.get()])
      .then(([w, h, s]) => {
        setWeek(w);
        setHolidays(h);
        setSettings(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const changeSlotLength = async (min) => {
    setSettings((s) => ({ ...s, slotDurationMin: min }));
    await settingsApi.update({ slotDurationMin: min });
  };

  const addSlot = (day) =>
    setWeek((w) => ({ ...w, [day]: [...w[day], { start: "09:00", end: "13:00" }] }));

  const removeSlot = (day, i) =>
    setWeek((w) => ({ ...w, [day]: w[day].filter((_, idx) => idx !== i) }));

  const updateSlot = (day, i, key, value) =>
    setWeek((w) => ({
      ...w,
      [day]: w[day].map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
    }));

  const save = async () => {
    setSaving(true);
    await availabilityApi.update(week);
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  const addHoliday = async () => {
    if (!holForm.date) return;
    const h = await availabilityApi.addHoliday(holForm);
    setHolidays((prev) => [...prev, h].sort((a, b) => a.date.localeCompare(b.date)));
    setHolModal(false);
    setHolForm({ date: "", reason: "" });
  };

  const removeHoliday = async (id) => {
    await availabilityApi.removeHoliday(id);
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  if (loading || !week || !settings) return <Spinner label="Loading availability…" />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Weekly availability"
        subtitle="These hours become the bookable slots patients will choose from."
        action={
          <button onClick={save} className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : savedAt ? "Saved ✓" : "Save changes"}
          </button>
        }
      />

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-brand-900">Slot length</div>
          <div className="text-sm text-brand-500">
            Each open window is split into bookable slots of this length.
          </div>
        </div>
        <div className="inline-flex rounded-xl bg-brand-100/70 p-1">
          {[30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => changeSlotLength(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                settings.slotDurationMin === m ? "bg-white text-brand-800 shadow-sm" : "text-brand-500"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
        <span>Want to open or close individual slots on a specific day?</span>
        <Link to="/calendar" className="font-semibold text-brand-700 hover:underline">Open calendar →</Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {DAYS.map(([key, label]) => (
          <div key={key} className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-900">{label}</span>
                {week[key].length === 0 ? (
                  <Badge tone="slate">Closed</Badge>
                ) : (
                  <Badge tone="green">{week[key].length} slot{week[key].length > 1 ? "s" : ""}</Badge>
                )}
              </div>
              <button
                onClick={() => addSlot(key)}
                className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
              >
                <Plus width={16} height={16} /> Add
              </button>
            </div>

            {week[key].length === 0 ? (
              <p className="text-sm text-brand-400">No bookable hours.</p>
            ) : (
              <div className="space-y-2">
                {week[key].map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Clock width={16} height={16} className="text-brand-400" />
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateSlot(key, i, "start", e.target.value)}
                      className="input flex-1 px-2 py-1.5"
                    />
                    <span className="text-brand-400">–</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateSlot(key, i, "end", e.target.value)}
                      className="input flex-1 px-2 py-1.5"
                    />
                    <button
                      onClick={() => removeSlot(key, i)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-400 hover:bg-rose-50"
                    >
                      <X width={16} height={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <SectionHeader
          title="Holidays & blocked dates"
          subtitle="No bookings are taken on these days."
          action={
            <button onClick={() => setHolModal(true)} className="btn-ghost">
              <Plus width={16} height={16} /> Block a date
            </button>
          }
        />
        {holidays.length === 0 ? (
          <EmptyState icon={Calendar} title="No blocked dates" hint="Add holidays or personal leave here." />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {holidays.map((h) => (
              <div key={h.id} className="card flex items-center justify-between p-3.5">
                <div>
                  <div className="font-semibold text-brand-900">{fmtDate(h.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
                  <div className="text-sm text-brand-500">{h.reason || "Blocked"}</div>
                </div>
                <button
                  onClick={() => removeHoliday(h.id)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-rose-400 hover:bg-rose-50"
                >
                  <Trash width={18} height={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={holModal}
        onClose={() => setHolModal(false)}
        title="Block a date"
        footer={
          <>
            <button onClick={() => setHolModal(false)} className="btn-outline">Cancel</button>
            <button onClick={addHoliday} className="btn-primary">Block date</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Date">
            <input
              type="date"
              className="input"
              value={holForm.date}
              onChange={(e) => setHolForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>
          <Field label="Reason (optional)">
            <input
              className="input"
              placeholder="Personal leave, conference…"
              value={holForm.reason}
              onChange={(e) => setHolForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
