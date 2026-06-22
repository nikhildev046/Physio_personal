// ---------------------------------------------------------------------------
// Seed data for the dummy API. This stands in for the real backend database.
// When you wire up the real API, you can delete this file and point the
// service methods in ./services.js at your endpoints instead.
// ---------------------------------------------------------------------------

// Helper to produce ISO date strings relative to "today" so the demo always
// looks current no matter when it is opened.
const day = 24 * 60 * 60 * 1000;
const now = new Date();
const iso = (offsetDays = 0, hour = 9, min = 0) => {
  const d = new Date(now.getTime() + offsetDays * day);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};
const dateOnly = (offsetDays = 0) => iso(offsetDays).slice(0, 10);

export const therapist = {
  id: "t1",
  name: "Dr. Shine Kumar",
  title: "Physiotherapist, MPT (Ortho)",
  clinic: "Shine Physiotherapy",
  email: "shine@shinephysio.in",
  phone: "+91 98765 43210",
};

export const patients = [
  {
    id: "p1",
    name: "Anita Rao",
    age: 34,
    gender: "Female",
    phone: "+91 90000 11111",
    condition: "Lower back pain (L4-L5)",
    status: "active",
    startedOn: dateOnly(-28),
    progress: 68,
    notes: "Desk worker. Responds well to core strengthening.",
  },
  {
    id: "p2",
    name: "Rohan Mehta",
    age: 27,
    gender: "Male",
    phone: "+91 90000 22222",
    condition: "ACL post-op rehab (right knee)",
    status: "active",
    startedOn: dateOnly(-45),
    progress: 52,
    notes: "Footballer. Surgery 6 weeks ago. Cleared for partial loading.",
  },
  {
    id: "p3",
    name: "Fatima Sheikh",
    age: 58,
    gender: "Female",
    phone: "+91 90000 33333",
    condition: "Frozen shoulder (left)",
    status: "active",
    startedOn: dateOnly(-14),
    progress: 30,
    notes: "Diabetic. Limited external rotation. Go gently.",
  },
  {
    id: "p4",
    name: "Vikram Nair",
    age: 41,
    gender: "Male",
    phone: "+91 90000 44444",
    condition: "Cervical spondylosis",
    status: "active",
    startedOn: dateOnly(-9),
    progress: 41,
    notes: "Frequent headaches. Postural correction in progress.",
  },
  {
    id: "p5",
    name: "Priya Desai",
    age: 31,
    gender: "Female",
    phone: "+91 90000 55555",
    condition: "Plantar fasciitis (right foot)",
    status: "discharged",
    startedOn: dateOnly(-70),
    progress: 100,
    notes: "Marathon runner. Fully recovered. Discharged with home plan.",
  },
];

export const bookings = [
  { id: "b1", patientId: "p1", start: iso(0, 10, 0), durationMin: 45, type: "Follow-up", status: "confirmed", source: "manual" },
  { id: "b2", patientId: "p2", start: iso(0, 11, 30), durationMin: 45, type: "Rehab session", status: "confirmed", source: "manual" },
  { id: "b3", patientId: "p3", start: iso(0, 16, 0), durationMin: 30, type: "Follow-up", status: "confirmed", source: "manual" },
  { id: "b4", patientId: "p4", start: iso(1, 9, 30), durationMin: 45, type: "Assessment", status: "confirmed", source: "manual" },
  { id: "b5", patientId: "p1", start: iso(2, 10, 0), durationMin: 45, type: "Follow-up", status: "pending", source: "manual" },
  { id: "b6", patientId: "p2", start: iso(-2, 11, 30), durationMin: 45, type: "Rehab session", status: "completed", source: "manual" },
  { id: "b7", patientId: "p3", start: iso(-5, 16, 0), durationMin: 30, type: "Follow-up", status: "completed", source: "manual" },
  // A past appointment that still needs its session recorded (demo of the link).
  { id: "b8", patientId: "p4", start: iso(-1, 9, 30), durationMin: 45, type: "Assessment", status: "confirmed", source: "manual" },
  { id: "b9", patientId: "p1", start: iso(-2, 10, 0), durationMin: 45, type: "Follow-up", status: "completed", source: "manual" },
  { id: "b10", patientId: "p1", start: iso(-9, 10, 0), durationMin: 45, type: "Assessment", status: "completed", source: "manual" },
];

export const sessions = [
  {
    id: "s1",
    patientId: "p1",
    bookingId: "b9",
    date: dateOnly(-2),
    workDone: "Manual therapy + core activation circuit",
    exercisesPerformed: "Dead bug, bird-dog, glute bridge",
    painLevel: 3,
    response: "Good",
    progress: "Improving — reduced morning stiffness",
    clinicalNotes: "ROM improving. Continue progressive loading.",
    nextGoal: "Add resisted rotation next visit",
    paid: true,
    amount: 800,
  },
  {
    id: "s2",
    patientId: "p2",
    bookingId: "b6",
    date: dateOnly(-2),
    workDone: "Quad sets, partial weight-bearing gait training",
    exercisesPerformed: "Straight leg raise, heel slides, mini squats",
    painLevel: 4,
    response: "Moderate",
    progress: "On track for 6-week milestone",
    clinicalNotes: "Mild effusion. Ice after session.",
    nextGoal: "Progress to full weight-bearing",
    paid: false,
    amount: 900,
  },
  {
    id: "s3",
    patientId: "p3",
    bookingId: "b7",
    date: dateOnly(-5),
    workDone: "Capsular stretching + pendulum exercises",
    exercisesPerformed: "Pendulum, wall walk, towel stretch",
    painLevel: 5,
    response: "Slow",
    progress: "External rotation still limited",
    clinicalNotes: "Monitor blood sugar effect on healing.",
    nextGoal: "Increase abduction by 10°",
    paid: true,
    amount: 700,
  },
  {
    id: "s4",
    patientId: "p1",
    bookingId: "b10",
    date: dateOnly(-9),
    workDone: "Initial assessment + education",
    exercisesPerformed: "Pelvic tilts, cat-camel",
    painLevel: 6,
    response: "Baseline",
    progress: "Baseline established",
    clinicalNotes: "Avoid heavy lifting. Ergonomic advice given.",
    nextGoal: "Begin core strengthening",
    paid: true,
    amount: 800,
  },
];

export const exercisePlans = [
  {
    id: "e1",
    patientId: "p1",
    name: "Glute Bridge",
    sets: 3,
    reps: 12,
    videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8",
    notes: "Squeeze at the top, hold 2s.",
  },
  { id: "e2", patientId: "p1", name: "Bird-Dog", sets: 3, reps: 10, videoUrl: "", notes: "Keep hips level." },
  { id: "e3", patientId: "p2", name: "Straight Leg Raise", sets: 3, reps: 15, videoUrl: "", notes: "Lock the knee first." },
  { id: "e4", patientId: "p2", name: "Mini Squat", sets: 3, reps: 12, videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U", notes: "Pain-free range only." },
  { id: "e5", patientId: "p3", name: "Pendulum Swing", sets: 2, reps: 20, videoUrl: "", notes: "Relax the arm, let gravity work." },
];

export const notifications = [
  { id: "n1", type: "appointment", title: "Upcoming appointment", body: "Anita Rao at 10:00 AM today", at: iso(0, 8, 0), read: false },
  { id: "n2", type: "booking", title: "New booking", body: "Rohan Mehta requested a slot for tomorrow", at: iso(0, 7, 30), read: false },
  { id: "n3", type: "payment", title: "Payment due", body: "Rohan Mehta — ₹900 outstanding", at: iso(-1, 18, 0), read: false },
  { id: "n4", type: "appointment", title: "Reminder", body: "Fatima Sheikh follow-up at 4:00 PM", at: iso(0, 8, 15), read: true },
];

// Weekly availability template. Each day holds bookable slot ranges.
export const availability = {
  mon: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "19:00" }],
  tue: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "19:00" }],
  wed: [{ start: "09:00", end: "13:00" }],
  thu: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "19:00" }],
  fri: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "19:00" }],
  sat: [{ start: "10:00", end: "14:00" }],
  sun: [],
};

// Blocked-out holiday dates (no bookings allowed).
export const holidays = [
  { id: "h1", date: dateOnly(4), reason: "Personal leave" },
  { id: "h2", date: dateOnly(11), reason: "Conference" },
];

// Scheduling settings. slotDurationMin drives how the weekly availability is
// chopped into discrete bookable slots. dayStart/dayEnd bound the calendar grid.
export const settings = {
  slotDurationMin: 45,
  dayStart: "08:00",
  dayEnd: "20:00",
};

// Per-date overrides on top of the recurring weekly template.
//   closed:      ["10:00"]  -> a generated slot the physio has closed for this date
//   extraRanges: [{start,end}] -> extra bookable hours opened just for this date
// Keyed by "YYYY-MM-DD". Empty by default.
export const slotOverrides = {};
