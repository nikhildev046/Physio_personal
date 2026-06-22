# PhysioFlow — Phase 1 PWA

A practice-management Progressive Web App for a single physiotherapist. Installs on a phone like a normal app and works in any browser. Built with **Vite + React + Tailwind**, using a **swappable dummy API** so the UI is fully clickable now and can be bound to a real backend later.

## Run it

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview the production build
```

Login screen accepts **any** email/password (credentials are pre-filled).

## Features (all 8 from the quote)

- **Login** — secure-style sign-in (dummy auth).
- **Dashboard** — today's schedule, active patients, outstanding payments, alerts.
- **Calendar** — week time-grid (default), month overview, and list view. Booked / open / blocked slots are colour-coded. Click an open slot to book it or close it; click a booked slot to jump to the patient.
- **Availability** — weekly recurring hours + a slot-length setting (30/45/60 min) + blocked holiday dates. These hours are what generate the bookable slots.
- **Bookings** — upcoming/past list, add manual bookings, cancel (also reachable at `/bookings`).
- **Patients** — searchable list + rich profile (history, sessions, exercises, dues).
- **Sessions** — record what was done, exercises, pain level, progress, notes, next goal, fee/paid. The clinical history.
- **Exercise plans** — assign exercises (sets, reps, video link) grouped per patient.
- **Payments** — outstanding vs collected, per-patient dues, mark paid.
- **Notifications** — appointment / booking / payment alerts, mark read.

## Availability → bookable slots (Phase 2 foundation)

The physio sets recurring weekly hours and a slot length in **Availability**. A single pure function, `src/lib/slots.js → generateSlots()`, turns those hours (minus holidays, minus existing bookings, plus/minus per-date overrides) into concrete dated slots tagged `open` / `booked` / `blocked`.

The calendar renders those slots. Crucially, the **Phase 2 patient app will call the exact same function** (via `availabilityApi.openSlots(date)` / `getSlots(from, to)`) so the physio and patients can never disagree about what's free. Per-date tweaks (closing a one-off slot) are stored as overrides without touching the weekly template.

## Wiring up a real backend later

The UI only imports from `src/api/services.js`. The dummy implementation lives in `src/api/client.js` (in-memory data + simulated latency) seeded from `src/api/seed.js`.

To go live, replace the body of `request()` in `src/api/client.js` with real `fetch` calls (a template is in the file's comment). The service methods already use REST-style `method + path + body`, so in most cases **nothing else changes**.

## PWA

`vite-plugin-pwa` generates the service worker and manifest. After `npm run build && npm run preview`, the app is installable and works offline. Icons live in `public/`.

## Project structure

```
src/
  api/          services.js (public) · client.js (dummy) · seed.js (mock data)
  components/   Layout, Icons, ui primitives
  pages/        the 8 feature screens + PatientProfile
  store/        AppContext (auth + unread count)
  lib/          format helpers (INR, dates)
```
# Physio_Personal_application
