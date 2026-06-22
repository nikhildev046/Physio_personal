// Small formatting helpers used across screens.

export const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const fmtDate = (iso, opts = { day: "numeric", month: "short", year: "numeric" }) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", opts) : "";

export const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : "";

export const fmtDateTime = (iso) => `${fmtDate(iso, { day: "numeric", month: "short" })} · ${fmtTime(iso)}`;

export const relativeDay = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round(
    (new Date(d.toDateString()) - new Date(today.toDateString())) / 86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return fmtDate(iso, { weekday: "short", day: "numeric", month: "short" });
};

export const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
