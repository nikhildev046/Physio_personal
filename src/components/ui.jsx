// Reusable presentational primitives shared across screens.
import { useEffect } from "react";
import { initials } from "../lib/format.js";
import { X } from "./Icons.jsx";

export function Avatar({ name, size = 40, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-100 text-brand-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
  };
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${tones[tone]}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}

const badgeTones = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
  brand: "bg-brand-100 text-brand-700",
  sky: "bg-sky-100 text-sky-700",
};

export function Badge({ tone = "slate", children, className = "" }) {
  return <span className={`badge ${badgeTones[tone]} ${className}`}>{children}</span>;
}

export function StatCard({ icon: Icon, label, value, sub, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon width={20} height={20} />
      </div>
      <div className="text-2xl font-bold text-brand-900">{value}</div>
      <div className="text-sm font-medium text-brand-600">{label}</div>
      {sub && <div className="mt-1 text-xs text-brand-400">{sub}</div>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-brand-900">{title}</h2>
        {subtitle && <p className="text-sm text-brand-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({ value, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-500",
    amber: "bg-amber-400",
    emerald: "bg-emerald-500",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
      <div
        className={`h-full rounded-full ${tones[tone]} transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="card grid place-items-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-400">
          <Icon width={24} height={24} />
        </div>
      )}
      <p className="font-semibold text-brand-800">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-brand-400">{hint}</p>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-brand-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-900/30 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} animate-[slideup_.2s_ease] rounded-t-3xl bg-white shadow-soft sm:rounded-3xl`}
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
          <h3 className="text-base font-bold text-brand-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-brand-400 hover:bg-brand-50 hover:text-brand-700"
          >
            <X width={18} height={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-brand-100 px-5 py-3">{footer}</div>
        )}
      </div>
      <style>{`@keyframes slideup{from{transform:translateY(16px);opacity:.6}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
