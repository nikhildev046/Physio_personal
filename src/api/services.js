// ---------------------------------------------------------------------------
// Service layer — the only thing the UI imports.
//
// Each function is a thin wrapper around request(method, path, body). When the
// real backend is ready, you usually won't touch this file at all — just swap
// the implementation of request() in ./client.js.
// ---------------------------------------------------------------------------

import { request } from "./client.js";
import { generateSlots, dateKey } from "../lib/slots.js";

export const authApi = {
  // Dummy auth — accepts any non-empty credentials.
  login: async ({ email, password }) => {
    if (!email || !password) throw new Error("Email and password are required");
    const therapist = await request("GET", "/therapist");
    return { token: "dummy-token", therapist };
  },
  me: () => request("GET", "/therapist"),
  updateProfile: (patch) => request("PUT", "/therapist", patch),
};

export const patientsApi = {
  list: () => request("GET", "/patients"),
  get: (id) => request("GET", `/patients/${id}`),
  create: (data) => request("POST", "/patients", data),
  update: (id, patch) => request("PUT", `/patients/${id}`, patch),
  remove: (id) => request("DELETE", `/patients/${id}`),
};

export const bookingsApi = {
  list: () => request("GET", "/bookings"),
  create: (data) => request("POST", "/bookings", data),
  update: (id, patch) => request("PUT", `/bookings/${id}`, patch),
  cancel: (id) => request("DELETE", `/bookings/${id}`),
};

export const sessionsApi = {
  list: () => request("GET", "/sessions"),
  create: (data) => request("POST", "/sessions", data),
  update: (id, patch) => request("PUT", `/sessions/${id}`, patch),
};

export const exercisesApi = {
  list: () => request("GET", "/exercises"),
  create: (data) => request("POST", "/exercises", data),
  update: (id, patch) => request("PUT", `/exercises/${id}`, patch),
  remove: (id) => request("DELETE", `/exercises/${id}`),
};

export const notificationsApi = {
  list: () => request("GET", "/notifications"),
  create: (data) => request("POST", "/notifications", data),
  markRead: (id) => request("PUT", `/notifications/${id}`, { read: true }),
  markAllRead: () => request("POST", "/notifications/x/read-all"),
};

export const settingsApi = {
  get: () => request("GET", "/settings"),
  update: (patch) => request("PUT", "/settings", patch),
};

export const availabilityApi = {
  get: () => request("GET", "/availability"),
  update: (week) => request("PUT", "/availability", week),
  holidays: () => request("GET", "/holidays"),
  addHoliday: (data) => request("POST", "/holidays", data),
  removeHoliday: (id) => request("DELETE", `/holidays/${id}`),

  // Per-date overrides on top of the weekly template.
  getOverrides: () => request("GET", "/overrides"),
  setOverride: (date, data) => request("PUT", `/overrides/${date}`, data),

  // Block / unblock a single generated slot on a given date.
  async closeSlot(date, time) {
    const all = await request("GET", "/overrides");
    const closed = new Set(all[date]?.closed || []);
    closed.add(time);
    return request("PUT", `/overrides/${date}`, { closed: [...closed] });
  },
  async openSlot(date, time) {
    const all = await request("GET", "/overrides");
    const closed = (all[date]?.closed || []).filter((t) => t !== time);
    return request("PUT", `/overrides/${date}`, { closed });
  },

  /**
   * Compute concrete dated slots between two dates.
   * This is the method the Phase 2 patient app will reuse.
   */
  async getSlots(from, to) {
    const [availability, holidays, bookings, overrides, settings] = await Promise.all([
      request("GET", "/availability"),
      request("GET", "/holidays"),
      request("GET", "/bookings"),
      request("GET", "/overrides"),
      request("GET", "/settings"),
    ]);
    return generateSlots({ availability, holidays, bookings, overrides, settings, from, to });
  },

  // Convenience: only the bookable (open) slots for a single date — exactly
  // what a patient would see when choosing a time.
  async openSlots(date) {
    const day = (await this.getSlots(date, date))[0];
    return day ? day.slots.filter((s) => s.status === "open") : [];
  },
};

export { dateKey };
