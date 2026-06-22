import { useState } from "react";
import { useApp } from "../store/AppContext.jsx";
import { Field } from "../components/ui.jsx";

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState("shine@shinephysio.in");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err.message || "Could not sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-xl font-bold">
            P
          </div>
          <span className="text-xl font-bold">PhysioFlow</span>
        </div>
        <div>
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            Your whole practice, in one calm place.
          </h2>
          <p className="mt-4 max-w-sm text-brand-100">
            Availability, bookings, patient records, session notes, exercise plans and
            payments — managed from your phone or any browser.
          </p>
        </div>
        <p className="text-sm text-brand-200">Phase 1 · Physiotherapist application</p>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-brand-50 px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-700 text-xl font-bold text-white">
              P
            </div>
            <span className="text-xl font-bold text-brand-900">PhysioFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-brand-900">Welcome back</h1>
          <p className="mt-1 text-sm text-brand-500">Sign in to manage your practice.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.in"
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 rounded-xl bg-brand-100/60 px-3 py-2.5 text-center text-xs text-brand-600">
            Demo build — any email &amp; password works. Credentials are pre-filled.
          </p>
        </div>
      </div>
    </div>
  );
}
