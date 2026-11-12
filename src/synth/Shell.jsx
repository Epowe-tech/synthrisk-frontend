// App frame: SYNTH top bar + left nav. Pages render as children.
import { canManage } from "./model.js";

export function Logo({ onClick }) {
  return (
    <div className="logo" onClick={onClick} title={onClick ? "Home" : undefined}>
      <svg className="bolt" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5f7fb" />
            <stop offset="45%" stopColor="#c3cad6" />
            <stop offset="55%" stopColor="#828d9e" />
            <stop offset="100%" stopColor="#e7ebf2" />
          </linearGradient>
        </defs>
        <polygon points="14,1 4,13 10,13 8,23 20,10 13,10" fill="url(#chrome)" />
      </svg>
      <span className="wm">SYNTH</span>
    </div>
  );
}

// Pages that come in later phases are listed but marked "soon" so the
// team can see where the SYNTH features will land.
export const NAV_ITEMS = [
  { id: "dash", label: "Dashboard" },
  { id: "new-submission", label: "New Submission" },
  { id: "pipe", label: "Pipeline" },
  { id: "submissions", label: "Submissions" },
  { id: "renew", label: "Renewals" },
];

export default function Shell({ user, page, go, counts = {}, onLogout, children }) {
  const role = user?.role || "producer";
  const active = page === "detail" ? "pipe" : page;
  return (
    <div className="syn">
      <div className="top">
        <Logo onClick={() => go("dash")} />
        <div className="flex">
          <div className="who">
            {user?.name || user?.email} · {role}
            <br />
            <span className="small">{canManage(role) ? "Manager view" : "Producer view"} · cloud sync ✓</span>
          </div>
          <button className="btn ghost sm" onClick={onLogout}>Sign out</button>
        </div>
      </div>
      <div className="layout">
        <nav className="sidenav">
          {NAV_ITEMS.map((it) => (
            <button key={it.id} className={active === it.id ? "on" : ""} onClick={() => go(it.id)}>
              {it.label}
              {counts[it.id] ? <span className="count">{counts[it.id]}</span> : null}
            </button>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
