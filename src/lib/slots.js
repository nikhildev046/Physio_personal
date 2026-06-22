// ---------------------------------------------------------------------------
// Slot engine — the single source of truth for "what can be booked when".
//
// This is a PURE function: give it the weekly availability template, holidays,
// existing bookings, per-date overrides and settings, and it returns concrete
// dated slots with a status of "open" | "booked" | "blocked".
//
// >>> PHASE 2 NOTE <<<
// The patient-facing app will call exactly this (via availabilityApi.openSlots)
// to show patients the physiotherapist's free slots and let them book one.
// Keeping the logic here means the physio app and the patient app can never
// disagree about availability.
// ---------------------------------------------------------------------------

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
    x.getDate()
  ).padStart(2, "0")}`;
};

// Combine a date key + "HH:mm" into a real Date in local time.
const at = (key, hhmm) => new Date(`${key}T${hhmm}:00`);

function slotsForRanges(key, ranges, stepMin) {
  const out = [];
  for (const r of ranges) {
    let m = toMin(r.start);
    const end = toMin(r.end);
    while (m + stepMin <= end) {
      out.push({ time: toHHMM(m), start: at(key, toHHMM(m)), end: at(key, toHHMM(m + stepMin)) });
      m += stepMin;
    }
  }
  return out;
}

/**
 * Build dated slots between two dates (inclusive).
 * @returns Array<{ dateKey, date, isHoliday, holidayReason, slots: Slot[] }>
 *   Slot = { time, start: Date, end: Date, status, booking? }
 */
export function generateSlots({
  availability = {},
  holidays = [],
  bookings = [],
  overrides = {},
  settings = { slotDurationMin: 45 },
  from,
  to,
}) {
  const step = settings.slotDurationMin || 45;
  const holidayByDate = Object.fromEntries(holidays.map((h) => [h.date, h.reason || "Blocked"]));
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");

  const days = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(to);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last) {
    const key = dateKey(cursor);
    const isHoliday = key in holidayByDate;
    const wd = WEEKDAY_KEYS[cursor.getDay()];
    const override = overrides[key] || {};

    // Base ranges from the weekly template (skipped on holidays), plus any
    // extra ranges the physio opened for this specific date.
    const ranges = isHoliday ? [] : [...(availability[wd] || []), ...(override.extraRanges || [])];
    let slots = slotsForRanges(key, ranges, step);

    // De-duplicate by start time (overlapping ranges).
    const seen = new Set();
    slots = slots.filter((s) => (seen.has(s.time) ? false : seen.add(s.time)));
    slots.sort((a, b) => a.start - b.start);

    const closed = new Set(override.closed || []);

    // Bookings that fall on this date.
    const dayBookings = activeBookings.filter((b) => dateKey(b.start) === key);

    slots = slots.map((s) => {
      const booking = dayBookings.find((b) => {
        const bs = new Date(b.start).getTime();
        return bs >= s.start.getTime() && bs < s.end.getTime();
      });
      if (booking) return { ...s, status: "booked", booking };
      if (closed.has(s.time)) return { ...s, status: "blocked" };
      return { ...s, status: "open" };
    });

    // Surface bookings that don't line up with any generated slot (e.g. a manual
    // booking at an odd time) so they still appear on the calendar.
    for (const b of dayBookings) {
      if (!slots.some((s) => s.booking?.id === b.id)) {
        const start = new Date(b.start);
        const end = new Date(start.getTime() + (b.durationMin || step) * 60000);
        slots.push({
          time: toHHMM(start.getHours() * 60 + start.getMinutes()),
          start,
          end,
          status: "booked",
          booking: b,
        });
      }
    }
    slots.sort((a, b) => a.start - b.start);

    days.push({
      dateKey: key,
      date: new Date(cursor),
      isHoliday,
      holidayReason: holidayByDate[key],
      slots,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

// Monday-based start of the week containing `d`.
export function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = (x.getDay() + 6) % 7; // Mon=0 … Sun=6
  x.setDate(x.getDate() - diff);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
