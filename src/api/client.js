// ---------------------------------------------------------------------------
// Dummy API client.
//
// Everything here is in-memory and simulates network latency so the UI behaves
// like it would against a real backend (loading states, async, etc.).
//
// >>> TO WIRE UP A REAL BACKEND LATER <<<
// Replace the body of `request()` with a real fetch call, e.g.:
//
//   export async function request(method, path, body) {
//     const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
//       method,
//       headers: { "Content-Type": "application/json", ...authHeader() },
//       body: body ? JSON.stringify(body) : undefined,
//     });
//     if (!res.ok) throw new Error(await res.text());
//     return res.json();
//   }
//
// The service functions in ./services.js are written so that only this file
// needs to change. They already use method + path + body semantics.
// ---------------------------------------------------------------------------

import * as seed from "./seed.js";

const LATENCY_MS = 350;

// Mutable in-memory database, deep-cloned from the seed so edits don't mutate
// the imported module.
const db = structuredClone({
  therapist: seed.therapist,
  patients: seed.patients,
  bookings: seed.bookings,
  sessions: seed.sessions,
  exercisePlans: seed.exercisePlans,
  notifications: seed.notifications,
  availability: seed.availability,
  holidays: seed.holidays,
  settings: seed.settings,
  slotOverrides: seed.slotOverrides,
});

const delay = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));
const uid = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 8)}`;

// A tiny router that maps method + path to operations on the in-memory db.
// This mimics REST so swapping in real fetch calls is mechanical.
async function route(method, path, body) {
  const [, resource, id, sub] = path.split("/"); // e.g. /patients/p1/sessions

  switch (resource) {
    case "therapist":
      if (method === "GET") return db.therapist;
      if (method === "PUT") return Object.assign(db.therapist, body);
      break;

    case "patients": {
      if (method === "GET" && !id) return db.patients;
      if (method === "GET" && id) return db.patients.find((p) => p.id === id) || null;
      if (method === "POST") {
        const p = { id: uid("p"), status: "active", progress: 0, ...body };
        db.patients.unshift(p);
        return p;
      }
      if (method === "PUT" && id) {
        const p = db.patients.find((x) => x.id === id);
        return p ? Object.assign(p, body) : null;
      }
      if (method === "DELETE" && id) {
        db.patients = db.patients.filter((x) => x.id !== id);
        return { ok: true };
      }
      break;
    }

    case "bookings": {
      if (method === "GET") return db.bookings;
      if (method === "POST") {
        const b = { id: uid("b"), status: "confirmed", source: "manual", ...body };
        db.bookings.push(b);
        return b;
      }
      if (method === "PUT" && id) {
        const b = db.bookings.find((x) => x.id === id);
        return b ? Object.assign(b, body) : null;
      }
      if (method === "DELETE" && id) {
        db.bookings = db.bookings.filter((x) => x.id !== id);
        return { ok: true };
      }
      break;
    }

    case "sessions": {
      if (method === "GET") return db.sessions;
      if (method === "POST") {
        const s = { id: uid("s"), ...body };
        db.sessions.unshift(s);
        // Recording a session for a booked slot completes that appointment.
        if (s.bookingId) {
          const b = db.bookings.find((x) => x.id === s.bookingId);
          if (b) b.status = "completed";
        }
        return s;
      }
      if (method === "PUT" && id) {
        const s = db.sessions.find((x) => x.id === id);
        return s ? Object.assign(s, body) : null;
      }
      break;
    }

    case "exercises": {
      if (method === "GET") return db.exercisePlans;
      if (method === "POST") {
        const e = { id: uid("e"), ...body };
        db.exercisePlans.push(e);
        return e;
      }
      if (method === "PUT" && id) {
        const e = db.exercisePlans.find((x) => x.id === id);
        return e ? Object.assign(e, body) : null;
      }
      if (method === "DELETE" && id) {
        db.exercisePlans = db.exercisePlans.filter((x) => x.id !== id);
        return { ok: true };
      }
      break;
    }

    case "notifications": {
      if (method === "GET") return db.notifications;
      if (method === "POST" && sub === "read-all") {
        db.notifications.forEach((n) => (n.read = true));
        return { ok: true };
      }
      if (method === "POST") {
        const n = { id: uid("n"), at: new Date().toISOString(), read: false, ...body };
        db.notifications.unshift(n);
        return n;
      }
      if (method === "PUT" && id) {
        const n = db.notifications.find((x) => x.id === id);
        return n ? Object.assign(n, body) : null;
      }
      break;
    }

    case "availability": {
      if (method === "GET") return db.availability;
      if (method === "PUT") {
        db.availability = body;
        return db.availability;
      }
      break;
    }

    case "holidays": {
      if (method === "GET") return db.holidays;
      if (method === "POST") {
        const h = { id: uid("h"), ...body };
        db.holidays.push(h);
        return h;
      }
      if (method === "DELETE" && id) {
        db.holidays = db.holidays.filter((x) => x.id !== id);
        return { ok: true };
      }
      break;
    }

    case "settings": {
      if (method === "GET") return db.settings;
      if (method === "PUT") return Object.assign(db.settings, body);
      break;
    }

    case "overrides": {
      // id here is the date string, e.g. /overrides/2026-06-25
      if (method === "GET") return db.slotOverrides;
      if (method === "PUT" && id) {
        db.slotOverrides[id] = { ...(db.slotOverrides[id] || {}), ...body };
        return db.slotOverrides[id];
      }
      break;
    }

    default:
      break;
  }

  throw new Error(`No dummy route for ${method} ${path}`);
}

export async function request(method, path, body) {
  await delay();
  // Return a clone so callers can't accidentally mutate the in-memory db.
  const result = await route(method, path, body);
  return structuredClone(result);
}
