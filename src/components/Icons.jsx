// Lightweight inline icon set (stroke-based, inherits currentColor).
// Avoids an icon-library dependency for the demo.

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const make = (paths) => (props) => (
  <svg {...base} {...props}>
    {paths}
  </svg>
);

export const Dashboard = make(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>
);

export const Calendar = make(
  <>
    <rect x="3" y="4" width="18" height="17" rx="2.5" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </>
);

export const Clock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);

export const Users = make(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 4.5a3 3 0 0 1 0 6M21 20c0-2.5-1.3-4.7-3.3-5.6" />
  </>
);

export const Clipboard = make(
  <>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M8.5 11h7M8.5 15h5" />
  </>
);

export const Dumbbell = make(
  <>
    <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
  </>
);

export const Rupee = make(
  <>
    <path d="M7 5h10M7 9h10M16 5c0 4-3 4-6 4 4 0 6 1.5 6 4.5L13 19" />
  </>
);

export const Bell = make(
  <>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10.5 21a1.8 1.8 0 0 0 3 0" />
  </>
);

export const Plus = make(<path d="M12 5v14M5 12h14" />);
export const Search = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </>
);
export const Check = make(<path d="M5 12.5l4.5 4.5L19 6.5" />);
export const X = make(<path d="M6 6l12 12M18 6L6 18" />);
export const Logout = make(
  <>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5M5 12h12" />
  </>
);
export const Chevron = make(<path d="M9 6l6 6-6 6" />);
export const Phone = make(
  <path d="M5 4h3l2 5-2 1c1 2 3 4 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
);
export const Video = make(
  <>
    <rect x="3" y="6" width="13" height="12" rx="2.5" />
    <path d="M16 10l5-3v10l-5-3" />
  </>
);
export const Trash = make(
  <>
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
  </>
);
export const Edit = make(
  <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3" />
);
export const Spark = make(
  <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" />
);
