import { NavLink, useLocation } from "react-router-dom";
import { useApp } from "../store/AppContext.jsx";
import { Avatar } from "./ui.jsx";
import {
  Dashboard,
  Calendar,
  Clock,
  Users,
  Clipboard,
  Dumbbell,
  Rupee,
  Bell,
  Logout,
} from "./Icons.jsx";

const nav = [
  { to: "/", label: "Dashboard", icon: Dashboard, end: true },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/availability", label: "Availability", icon: Clock },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/sessions", label: "Sessions", icon: Clipboard },
  { to: "/exercises", label: "Exercises", icon: Dumbbell },
  { to: "/payments", label: "Payments", icon: Rupee },
  { to: "/notifications", label: "Alerts", icon: Bell, badge: true },
];

// Mobile bottom bar shows the 5 most-used destinations.
const mobileNav = nav.filter((n) =>
  ["/", "/calendar", "/patients", "/sessions", "/notifications"].includes(n.to)
);

const titles = Object.fromEntries(nav.map((n) => [n.to, n.label]));

export default function Layout({ children }) {
  const { therapist, logout, unread } = useApp();
  const loc = useLocation();
  const current =
    titles[loc.pathname] ||
    (loc.pathname.startsWith("/patients/") ? "Patient profile" : "PhysioFlow");

  return (
    <div className="min-h-screen bg-brand-50/60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-brand-100 bg-white px-4 py-5 lg:flex">
        <div className="mb-7 flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 font-bold text-white">
            P
          </div>
          <div>
            <div className="font-bold leading-tight text-brand-900">PhysioFlow</div>
            <div className="text-xs text-brand-400">Practice manager</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-700 text-white shadow-sm"
                    : "text-brand-700 hover:bg-brand-50"
                }`
              }
            >
              <Icon width={19} height={19} />
              <span>{label}</span>
              {badge && unread > 0 && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-100 p-2.5">
          <Avatar name={therapist?.name || "PT"} size={36} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-brand-900">
              {therapist?.name}
            </div>
            <div className="truncate text-xs text-brand-400">{therapist?.clinic}</div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="grid h-8 w-8 place-items-center rounded-lg text-brand-400 hover:bg-brand-50 hover:text-brand-700"
          >
            <Logout width={18} height={18} />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-100 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 font-bold text-white lg:hidden">
              P
            </div>
            <h1 className="text-lg font-bold text-brand-900">{current}</h1>
          </div>
          <NavLink
            to="/notifications"
            className="relative grid h-9 w-9 place-items-center rounded-xl text-brand-600 hover:bg-brand-50"
          >
            <Bell width={20} height={20} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </NavLink>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobileNav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                isActive ? "text-brand-700" : "text-brand-400"
              }`
            }
          >
            <Icon width={22} height={22} />
            {label}
            {badge && unread > 0 && (
              <span className="absolute right-1/2 top-1.5 translate-x-3 rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
