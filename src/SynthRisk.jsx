import { useState } from "react";

const C = {
  bg: "#08090d",
  surface: "#0e1118",
  surfaceHigh: "#141720",
  border: "#1c2030",
  borderHigh: "#262d3f",
  text: "#e8eaf0",
  textMid: "#7a8299",
  textDim: "#3a4055",
  accent: "#3d8ef8",
  accentGlow: "rgba(61,142,248,0.12)",
  green: "#22c98a",
  amber: "#f5a623",
  red: "#ff5555",
};

// ── SEED DATA ─────────────────────────────────────────────────────
const SEED_ACCOUNTS = [
  { id: 1, name: "ABC Plumbing", owner: "Demetri", renewal: "Oct 1", industry: "Plumbing & HVAC", naics: "238220", score: 6.4 },
  { id: 2, name: "Valley Cafe", owner: "Demetri", renewal: "Aug 15", industry: "Full-Service Restaurants", naics: "722511", score: 4.1 },
  { id: 3, name: "Alpha Roofing", owner: "Demetri", renewal: "Dec 10", industry: "Roofing Contractors", naics: "238160", score: 8.2 },
  { id: 4, name: "Apex Electric", owner: "Demetri", renewal: "Nov 3", industry: "Electrical Contractors", naics: "238210", score: 5.5 },
  { id: 5, name: "Desert Cafe", owner: "Sarah", renewal: "Sep 20", industry: "Full-Service Restaurants", naics: "722511", score: 3.9 },
  { id: 6, name: "Westside Gym", owner: "Demetri", renewal: "Oct 1", industry: "Fitness Centers", naics: "713940", score: 5.1 },
];

const SEED_PIPELINE = [
  { id: 1, account: "ABC Plumbing", stage: "Marketing", score: 6.4, premium: "$8,200", next: "Follow up market", accountId: 1 },
  { id: 2, account: "Alpha Roofing", stage: "Marketing", score: 8.2, premium: "$14,500", next: "Send to MGA", accountId: 3 },
  { id: 3, account: "Apex Electric", stage: "Quotes", score: 5.5, premium: "$6,800", next: "Review quotes", accountId: 4 },
  { id: 4, account: "Desert Cafe", stage: "Proposal", score: 3.9, premium: "$4,100", next: "Send proposal", accountId: 5 },
  { id: 5, account: "Westside Gym", stage: "Bound", score: 5.1, premium: "$5,900", next: "Issue policy", accountId: 6 },
];

const MARKETS_LIST = [
  { name: "Travelers", type: "Carrier", fit: "Strong", classes: ["Contractors", "Plumbing", "Restaurants", "Retail"], states: ["AZ", "CA", "TX"] },
  { name: "Liberty Mutual", type: "Carrier", fit: "Strong", classes: ["Contractors", "Manufacturing", "Electrical"], states: ["AZ", "NV", "CO"] },
  { name: "AmTrust MGA", type: "MGA", fit: "Moderate", classes: ["Restaurants", "Retail", "Fitness"], states: ["AZ", "CA"] },
  { name: "Markel Specialty", type: "MGA", fit: "Strong", classes: ["Roofing", "Excavation", "Site Preparation"], states: ["All"] },
  { name: "Berkley One", type: "Carrier", fit: "Moderate", classes: ["Healthcare", "Gyms", "Fitness"], states: ["CA", "TX"] },
  { name: "Employers Holdings", type: "Carrier", fit: "Strong", classes: ["Restaurants", "Retail", "Plumbing"], states: ["AZ", "NV", "TX"] },
  { name: "Kinsale Capital", type: "MGA", fit: "Strong", classes: ["Contractors", "Roofing", "Electrical"], states: ["All"] },
];

const NAICS_DATA = [
  { naics: "238160", industry: "Roofing Contractors", national_trc: 5.1, national_dart: 2.8 },
  { naics: "236220", industry: "Commercial Building Construction", national_trc: 3.9, national_dart: 2.1 },
  { naics: "238210", industry: "Electrical Contractors", national_trc: 2.8, national_dart: 1.4 },
  { naics: "238220", industry: "Plumbing & HVAC", national_trc: 3.2, national_dart: 1.7 },
  { naics: "238910", industry: "Site Preparation", national_trc: 4.2, national_dart: 2.3 },
  { naics: "722511", industry: "Full-Service Restaurants", national_trc: 4.1, national_dart: 1.9 },
  { naics: "713940", industry: "Fitness Centers", national_trc: 3.8, national_dart: 1.8 },
  { naics: "493110", industry: "Warehousing & Storage", national_trc: 5.8, national_dart: 3.5 },
  { naics: "484110", industry: "General Freight Trucking", national_trc: 4.9, national_dart: 3.2 },
  { naics: "621111", industry: "Medical Offices", national_trc: 1.2, national_dart: 0.6 },
];

// ── UTILS ─────────────────────────────────────────────────────────
function computeScore(naicsIdx, employees, hours, rec, dart) {
  const d = NAICS_DATA[naicsIdx];
  if (!d) return null;
  const maxTRC = Math.max(...NAICS_DATA.map(x => x.national_trc));
  const maxDART = Math.max(...NAICS_DATA.map(x => x.national_dart));
  const norm = 0.6 * Math.log1p(d.national_trc) / Math.log1p(maxTRC) + 0.4 * Math.log1p(d.national_dart) / Math.log1p(maxDART);
  let base = Math.max(1, Math.min(9.9, 1 + norm * 8.9));
  if (employees > 0 && hours > 0) {
    const aTRC = (rec / hours) * 200000;
    const aDART = (dart / hours) * 200000;
    const adj = Math.max(-1.5, Math.min(1.5, 0.6 * (aTRC / d.national_trc - 1) + 0.4 * (aDART / d.national_dart - 1)));
    base = Math.max(1, Math.min(9.9, base + adj));
  }
  return base;
}

function matchMarkets(form) {
  const industryName = form.naicsIdx !== "" ? NAICS_DATA[+form.naicsIdx].industry.toLowerCase() : "";
  return MARKETS_LIST.map(m => {
    const classMatch = industryName === "" || m.classes.some(c => industryName.includes(c.toLowerCase()) || c.toLowerCase().includes(industryName.split(" ")[0].toLowerCase()));
    return { ...m, matched: classMatch };
  }).sort((a, b) => {
    if (a.matched && !b.matched) return -1;
    if (!a.matched && b.matched) return 1;
    if (a.fit === "Strong" && b.fit !== "Strong") return -1;
    if (a.fit !== "Strong" && b.fit === "Strong") return 1;
    return 0;
  });
}

function scoreColor(s) { return s <= 3.5 ? C.green : s <= 6.5 ? C.amber : C.red; }
function scoreBadge(s) { return s <= 3.5 ? "LOW" : s <= 6.5 ? "MOD" : "HIGH"; }

// ── SHARED UI ─────────────────────────────────────────────────────
const Tag = ({ children, color = C.accent }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, background: color + "22", color, border: `1px solid ${color}44` }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "ghost", small, full, disabled }) => {
  const s = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.textMid, border: `1px solid ${C.border}` },
    success: { background: C.green + "1a", color: C.green, border: `1px solid ${C.green}44` },
    danger: { background: C.red + "1a", color: C.red, border: `1px solid ${C.red}44` },
    amber: { background: C.amber + "1a", color: C.amber, border: `1px solid ${C.amber}44` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...s[variant], padding: small ? "5px 11px" : "8px 16px", borderRadius: 6, fontSize: small ? 11 : 12, fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, letterSpacing: 0.3, whiteSpace: "nowrap", width: full ? "100%" : "auto", opacity: disabled ? 0.4 : 1 }}>{children}</button>
  );
};

const Card = ({ children, style }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px", ...style }}>{children}</div>
);

const Sec = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.textDim, textTransform: "uppercase", marginBottom: 14 }}>{children}</div>
);

const ScorePill = ({ score }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: scoreColor(score) + "18", border: `1px solid ${scoreColor(score)}44`, borderRadius: 20, padding: "2px 9px" }}>
    <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(score), fontFamily: "monospace" }}>{score.toFixed(1)}</span>
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: scoreColor(score) }}>{scoreBadge(score)}</span>
  </span>
);

function DataTable({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={{ textAlign: "left", padding: "7px 12px", fontSize: 10, letterSpacing: 1.5, color: C.textDim, borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "10px 12px", color: C.text, verticalAlign: "middle" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabBar({ tabs, active, setActive }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => setActive(t.toLowerCase())}
          style={{ padding: "9px 16px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active === t.toLowerCase() ? 700 : 400, color: active === t.toLowerCase() ? C.accent : C.textMid, borderBottom: active === t.toLowerCase() ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: -1 }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  const color = type === "success" ? C.green : type === "amber" ? C.amber : C.red;
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000, background: C.surface, border: `1px solid ${color}55`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}22`, minWidth: 260, animation: "slideUp 0.25s ease" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ── RUN MARKETS MODAL ─────────────────────────────────────────────
function RunMarketsModal({ form, score, onClose, onSent }) {
  const matched = matchMarkets(form);
  const [sentMarkets, setSentMarkets] = useState({});
  const [sending, setSending] = useState(null);

  const handleSend = (marketName) => {
    setSending(marketName);
    // TODO: Replace this timeout with your real AWS API call:
    // await fetch('https://your-api-gateway.amazonaws.com/prod/send-to-market', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ submission: form, market: marketName, score })
    // });
    setTimeout(() => {
      setSentMarkets(prev => ({ ...prev, [marketName]: { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), status: "Sent" } }));
      setSending(null);
      onSent(marketName);
    }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, width: "100%", maxWidth: 680, maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>⬡ Run Markets</div>
            <div style={{ fontSize: 12, color: C.textMid, marginTop: 4 }}>
              {form.businessName || "Submission"} · {form.naicsIdx !== "" ? NAICS_DATA[+form.naicsIdx].industry : "Unknown industry"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {score && <ScorePill score={score} />}
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Score summary */}
          {score && (
            <div style={{ background: C.bg, border: `1px solid ${scoreColor(score)}33`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 24 }}>
              <div><div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 4 }}>RISK SCORE</div><div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(score), fontFamily: "monospace" }}>{score.toFixed(1)}</div></div>
              <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 24 }}>
                <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 4 }}>INDUSTRY</div>
                <div style={{ fontSize: 13, color: C.text }}>{form.naicsIdx !== "" ? NAICS_DATA[+form.naicsIdx].industry : "—"}</div>
              </div>
              <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 24 }}>
                <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 4 }}>MARKETS MATCHED</div>
                <div style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>{matched.filter(m => m.matched).length} of {matched.length}</div>
              </div>
            </div>
          )}

          {/* Recommended */}
          <Sec>Recommended Markets</Sec>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {matched.filter(m => m.matched).map(m => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 14, background: C.bg, border: `1px solid ${m.fit === "Strong" ? C.green + "33" : C.amber + "22"}`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{m.name}</span>
                    <Tag color={m.type === "Carrier" ? C.accent : C.amber}>{m.type}</Tag>
                    <Tag color={m.fit === "Strong" ? C.green : C.amber}>{m.fit} Fit</Tag>
                  </div>
                  <div style={{ fontSize: 11, color: C.textMid }}>States: {m.states.join(", ")} · Classes: {m.classes.join(", ")}</div>
                </div>
                {sentMarkets[m.name] ? (
                  <div style={{ textAlign: "right" }}>
                    <Tag color={C.green}>✓ Sent {sentMarkets[m.name].date}</Tag>
                  </div>
                ) : (
                  <Btn variant="success" small onClick={() => handleSend(m.name)} disabled={sending === m.name}>
                    {sending === m.name ? "Sending..." : "Send ↗"}
                  </Btn>
                )}
              </div>
            ))}
          </div>

          {/* Other markets */}
          {matched.filter(m => !m.matched).length > 0 && (
            <>
              <Sec>Other Available Markets</Sec>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {matched.filter(m => !m.matched).map(m => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", opacity: 0.7 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: C.textMid }}>{m.name}</span>
                        <Tag color={m.type === "Carrier" ? C.accent : C.amber}>{m.type}</Tag>
                      </div>
                      <div style={{ fontSize: 11, color: C.textDim }}>States: {m.states.join(", ")}</div>
                    </div>
                    {sentMarkets[m.name] ? (
                      <Tag color={C.green}>✓ Sent</Tag>
                    ) : (
                      <Btn variant="ghost" small onClick={() => handleSend(m.name)} disabled={sending === m.name}>
                        {sending === m.name ? "Sending..." : "Send anyway"}
                      </Btn>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.textDim }}>
            {Object.keys(sentMarkets).length > 0 ? `${Object.keys(sentMarkets).length} market${Object.keys(sentMarkets).length > 1 ? "s" : ""} notified` : "No markets sent yet"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
            {Object.keys(sentMarkets).length > 0 && (
              <Btn variant="primary" onClick={onClose}>View in Pipeline →</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────
const NAV = [
  { id: "home", icon: "⌂", label: "Home" },
  { id: "new-submission", icon: "＋", label: "New Submission" },
  { id: "pipeline", icon: "◫", label: "Pipeline" },
  { id: "accounts", icon: "◉", label: "Accounts" },
  { id: "markets", icon: "◈", label: "Markets" },
];

function Sidebar({ page, setPage, draftCount }) {
  return (
    <div style={{ width: 210, minHeight: "100vh", background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 100 }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${C.accent}, ${C.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: C.text, fontFamily: "monospace" }}>SYNTHRISK</div>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>AGENCY PLATFORM</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV.map(item => {
          const active = page === item.id || (item.id === "pipeline" && page === "submission-workspace") || (item.id === "accounts" && page === "account-workspace");
          const badge = item.id === "pipeline" ? (SEED_PIPELINE.length + draftCount) : null;
          return (
            <button key={item.id} onClick={() => setPage(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: active ? C.accentGlow : "transparent", color: active ? C.accent : C.textMid, fontSize: 13, fontFamily: "inherit", fontWeight: active ? 700 : 400, marginBottom: 2, textAlign: "left" }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {badge !== null && <span style={{ marginLeft: "auto", fontSize: 10, background: C.accent + "2a", color: C.accent, borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>{badge}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>D</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Demetri</div>
            <div style={{ fontSize: 10, color: C.textDim }}>Producer</div>
          </div>
          <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.green }} />
        </div>
      </div>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────
function HomePage({ setPage, setContext, drafts }) {
  const opps = SEED_ACCOUNTS.filter(a => a.score > 5.5);
  const active = SEED_PIPELINE.filter(p => ["Marketing", "Quotes"].includes(p.stage));
  const renewals = SEED_ACCOUNTS.filter(a => a.renewal.includes("Oct") || a.renewal.includes("Nov"));
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Good morning, Demetri 👋</div>
        <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>Here's your book at a glance · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
        {[{ l: "Active Deals", v: SEED_PIPELINE.length, c: C.accent }, { l: "Saved Drafts", v: drafts.length, c: C.amber }, { l: "Bound This Month", v: 1, c: C.green }, { l: "Upcoming Renewals", v: renewals.length, c: C.red }].map(s => (
          <Card key={s.l}>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.c, fontFamily: "monospace" }}>{s.v}</div>
            <div style={{ fontSize: 11, color: C.textMid, marginTop: 4 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Saved Drafts banner */}
      {drafts.length > 0 && (
        <div style={{ background: C.amber + "11", border: `1px solid ${C.amber}33`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{drafts.length} saved draft{drafts.length > 1 ? "s" : ""}</div>
              <div style={{ fontSize: 11, color: C.textMid }}>{drafts.map(d => d.businessName || "Untitled").join(", ")}</div>
            </div>
          </div>
          <Btn small variant="amber" onClick={() => setPage("pipeline")}>View Drafts →</Btn>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <Sec>New Opportunities</Sec>
          <DataTable headers={["Business", "Industry", "Score", ""]}
            rows={opps.map(a => [
              <b style={{ color: C.text }}>{a.name}</b>,
              <span style={{ color: C.textMid, fontSize: 11 }}>{a.industry}</span>,
              <ScorePill score={a.score} />,
              <Btn small variant="success" onClick={() => { setContext({ submissionAccount: a }); setPage("new-submission"); }}>Start</Btn>
            ])} />
        </Card>
        <Card>
          <Sec>Active Deals</Sec>
          <DataTable headers={["Business", "Stage", "Next Action"]}
            rows={active.map(p => [
              <button onClick={() => { setContext({ submission: p }); setPage("submission-workspace"); }} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>{p.account}</button>,
              <Tag color={p.stage === "Quotes" ? C.green : C.amber}>{p.stage}</Tag>,
              <span style={{ fontSize: 11, color: C.textMid }}>{p.next}</span>
            ])} />
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <Sec>Upcoming Renewals</Sec>
          <DataTable headers={["Business", "Renewal", ""]}
            rows={renewals.map(a => [
              <b style={{ color: C.text }}>{a.name}</b>,
              <span style={{ color: C.amber, fontWeight: 600 }}>{a.renewal}</span>,
              <Btn small onClick={() => setPage("new-submission")}>Renew</Btn>
            ])} />
        </Card>
        <Card>
          <Sec>Quick Actions</Sec>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[{ l: "+ New Submission", p: "new-submission", v: "primary" }, { l: "+ Add Account", p: "accounts", v: "ghost" }, { l: "Open Pipeline", p: "pipeline", v: "ghost" }, { l: "Market Finder", p: "markets", v: "ghost" }].map(a => (
              <Btn key={a.l} variant={a.v} full onClick={() => setPage(a.p)}>{a.l}</Btn>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── FIELD (outside component to prevent remount) ───────────────────
const Field = ({ label, k, ph, type = "text", value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>{label}</label>
    <input type={type} value={value} placeholder={ph} onChange={e => onChange(k, e.target.value)}
      style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none" }}
      onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
  </div>
);

// ── NEW SUBMISSION ─────────────────────────────────────────────────
function NewSubmissionPage({ context, onSaveDraft, onRunMarkets }) {
  const prefill = context?.draft || null;
  const [step, setStep] = useState(1);
  const [score, setScore] = useState(prefill?.score || null);
  const [showMarkets, setShowMarkets] = useState(false);
  const [form, setForm] = useState({
    businessName: prefill?.businessName || context?.submissionAccount?.name || "",
    address: prefill?.address || "",
    producer: prefill?.producer || "Demetri",
    description: prefill?.description || "",
    naicsIdx: prefill?.naicsIdx || "",
    revenue: prefill?.revenue || "",
    payroll: prefill?.payroll || "",
    years: prefill?.years || "",
    employees: prefill?.employees || "",
    hours: prefill?.hours || "",
    recordable: prefill?.recordable || "",
    dart: prefill?.dart || "",
    glLimit: prefill?.glLimit || "$1,000,000",
    propLimit: prefill?.propLimit || "",
    losses: prefill?.losses || "No prior losses",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const STEPS = ["Insured", "Operations", "Exposure", "Coverage", "Losses", "Review"];

  const handleNext = () => {
    if (step === 5) {
      const s = computeScore(+form.naicsIdx, +form.employees, +form.hours, +form.recordable, +form.dart);
      setScore(s);
    }
    setStep(s => Math.min(6, s + 1));
  };

  const handleSaveDraft = () => {
    onSaveDraft({ ...form, score, savedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), id: prefill?.id || Date.now() });
  };

  const handleRunMarkets = () => {
    // Compute score if not yet done
    if (!score && form.naicsIdx !== "") {
      const s = computeScore(+form.naicsIdx, +form.employees, +form.hours, +form.recordable, +form.dart);
      setScore(s);
    }
    setShowMarkets(true);
  };

  return (
    <div style={{ maxWidth: "100%" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
        {prefill ? `Resume Draft — ${prefill.businessName || "Untitled"}` : "New Submission"}
      </div>
      <div style={{ fontSize: 13, color: C.textMid, marginBottom: 24 }}>Complete all steps to generate a risk score and send to markets.</div>

      {/* Step progress */}
      <div style={{ display: "flex", gap: 0, background: C.surface, borderRadius: 10, padding: 5, border: `1px solid ${C.border}`, marginBottom: 24 }}>
        {STEPS.map((s, i) => { const n = i + 1, done = n < step, act = n === step; return (
          <button key={s} onClick={() => n <= step && setStep(n)} style={{ flex: 1, padding: "7px 2px", border: "none", borderRadius: 7, cursor: n <= step ? "pointer" : "default", background: act ? C.accent : done ? C.green + "22" : "transparent", color: act ? "#fff" : done ? C.green : C.textDim, fontSize: 10, fontFamily: "inherit", fontWeight: act ? 700 : 500 }}>
            <div style={{ fontSize: 9, marginBottom: 2 }}>{done ? "✓" : n}</div>{s}
          </button>
        ); })}
      </div>

      <Card>
        {step === 1 && <><Sec>Step 1 — Insured Information</Sec>
          <Field label="Business Name" k="businessName" ph="ABC Plumbing" value={form.businessName} onChange={set} />
          <Field label="Address" k="address" ph="123 Main St, Phoenix AZ" value={form.address} onChange={set} />
          <Field label="Producer" k="producer" ph="Agent name" value={form.producer} onChange={set} />
        </>}

        {step === 2 && <>
          <Sec>Step 2 — Operations</Sec>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>What does the business do?</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Describe primary operations..."
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>NAICS Classification</label>
            <select value={form.naicsIdx} onChange={e => set("naicsIdx", e.target.value)}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: form.naicsIdx === "" ? C.textDim : C.text, padding: "9px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", appearance: "none" }}>
              <option value="">— Select NAICS —</option>
              {NAICS_DATA.map((d, i) => <option key={i} value={i}>{d.industry} [{d.naics}]</option>)}
            </select>
          </div>
          {form.naicsIdx !== "" && (() => { const d = NAICS_DATA[+form.naicsIdx]; const bs = computeScore(+form.naicsIdx, 0, 1, 0, 0); return (
            <div style={{ background: C.bg, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 10, color: C.textDim, marginBottom: 3 }}>INDUSTRY BASELINE</div><div style={{ fontSize: 11, color: C.textMid }}>TRC {d.national_trc} · DART {d.national_dart}</div></div>
              <ScorePill score={bs} />
            </div>
          ); })()}
        </>}

        {step === 3 && <><Sec>Step 3 — Exposure</Sec>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <Field label="Annual Revenue" k="revenue" ph="$0" value={form.revenue} onChange={set} />
            <Field label="Annual Payroll" k="payroll" ph="$0" value={form.payroll} onChange={set} />
            <Field label="Years in Business" k="years" ph="0" type="number" value={form.years} onChange={set} />
            <Field label="Total Employees" k="employees" ph="0" type="number" value={form.employees} onChange={set} />
            <Field label="Hours Worked / Year" k="hours" ph="0" type="number" value={form.hours} onChange={set} />
          </div>
        </>}

        {step === 4 && <><Sec>Step 4 — Coverage</Sec>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <Field label="GL Limit" k="glLimit" ph="$1,000,000" value={form.glLimit} onChange={set} />
            <Field label="Property Limit" k="propLimit" ph="$500,000" value={form.propLimit} onChange={set} />
          </div>
        </>}

        {step === 5 && <><Sec>Step 5 — Loss History</Sec>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>Loss Run Notes</label>
            <textarea value={form.losses} onChange={e => set("losses", e.target.value)} rows={3}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "9px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <Field label="Recordable Cases (3yr)" k="recordable" ph="0" type="number" value={form.recordable} onChange={set} />
            <Field label="DART Cases (3yr)" k="dart" ph="0" type="number" value={form.dart} onChange={set} />
          </div>
        </>}

        {step === 6 && <>
          <Sec>Step 6 — Review & Risk Score</Sec>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[["Business", form.businessName || "—"], ["Producer", form.producer], ["Industry", form.naicsIdx !== "" ? NAICS_DATA[+form.naicsIdx].industry : "—"], ["GL Limit", form.glLimit || "—"], ["Employees", form.employees || "—"], ["Losses", form.losses]].map(([k, v]) => (
              <div key={k} style={{ background: C.bg, padding: "9px 12px", borderRadius: 6 }}>
                <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 3 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: C.text }}>{v}</div>
              </div>
            ))}
          </div>
          {score && (
            <div style={{ textAlign: "center", padding: "24px", background: C.bg, borderRadius: 10, border: `1px solid ${scoreColor(score)}33` }}>
              <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, marginBottom: 8 }}>CALCULATED RISK SCORE · v1</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor(score), fontFamily: "monospace", lineHeight: 1 }}>{score.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: scoreColor(score), marginTop: 6, letterSpacing: 2 }}>{score <= 3.5 ? "LOW RISK" : score <= 6.5 ? "MODERATE RISK" : "HIGH RISK"}</div>
            </div>
          )}
        </>}

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <Btn variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))}>← Back</Btn>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={handleSaveDraft}>💾 Save Draft</Btn>
            {step < 6
              ? <Btn variant="primary" onClick={handleNext}>Next →</Btn>
              : <Btn variant="success" onClick={handleRunMarkets}>⬡ Run Markets</Btn>
            }
          </div>
        </div>
      </Card>

      {/* Run Markets Modal */}
      {showMarkets && (
        <RunMarketsModal
          form={form}
          score={score}
          onClose={() => setShowMarkets(false)}
          onSent={(marketName) => onRunMarkets && onRunMarkets(marketName, form)}
        />
      )}
    </div>
  );
}

// ── PIPELINE ───────────────────────────────────────────────────────
function PipelinePage({ setPage, setContext, drafts, onResumeDraft, onDeleteDraft }) {
  const [view, setView] = useState("kanban");
  const STAGES = ["Draft", "Marketing", "Quotes", "Proposal", "Bound"];
  const stageCol = { Draft: C.textDim, Marketing: C.amber, Quotes: C.accent, Proposal: "#a78bfa", Bound: C.green };

  // Merge real pipeline with drafts
  const draftItems = drafts.map(d => ({ id: `draft-${d.id}`, account: d.businessName || "Untitled Draft", stage: "Draft", score: d.score || 0, premium: "—", next: `Saved ${d.savedAt || ""}`, isDraft: true, draftData: d }));
  const allItems = [...draftItems, ...SEED_PIPELINE];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Pipeline</div>
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>My Deals · {allItems.length} total ({drafts.length} draft{drafts.length !== 1 ? "s" : ""})</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["kanban", "table"].map(v => <button key={v} onClick={() => setView(v)} style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: view === v ? C.accentGlow : "transparent", color: view === v ? C.accent : C.textMid, fontSize: 11, fontFamily: "inherit", cursor: "pointer", fontWeight: view === v ? 700 : 400 }}>{v === "kanban" ? "⊞ Kanban" : "≡ Table"}</button>)}
          <Btn variant="primary" onClick={() => setPage("new-submission")}>+ New</Btn>
        </div>
      </div>

      {view === "kanban" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {STAGES.map(stage => {
            const items = allItems.filter(p => p.stage === stage);
            return (
              <div key={stage}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: stageCol[stage] }}>{stage.toUpperCase()}</span>
                  <span style={{ fontSize: 10, background: C.border, borderRadius: 10, padding: "1px 7px", color: C.textMid }}>{items.length}</span>
                </div>
                {items.map(p => (
                  <div key={p.id}
                    style={{ background: C.surface, border: `1px solid ${p.isDraft ? C.amber + "44" : C.border}`, borderRadius: 8, padding: "12px 13px", cursor: "pointer", marginBottom: 8, transition: "border-color 0.15s" }}
                    onClick={() => { if (p.isDraft) { onResumeDraft(p.draftData); setPage("new-submission"); } else { setContext({ submission: p }); setPage("submission-workspace"); } }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = p.isDraft ? C.amber : C.accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = p.isDraft ? C.amber + "44" : C.border}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 7 }}>{p.account}</div>
                      {p.isDraft && <button onClick={e => { e.stopPropagation(); onDeleteDraft(p.draftData.id); }} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }} title="Delete draft">×</button>}
                    </div>
                    {p.score > 0 && <ScorePill score={p.score} />}
                    {p.isDraft && <div style={{ fontSize: 10, color: C.amber, marginTop: 6, fontWeight: 600 }}>DRAFT — click to resume</div>}
                    {!p.isDraft && <><div style={{ fontSize: 11, color: C.textMid, marginTop: 7 }}>{p.premium}</div><div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>{p.next}</div></>}
                  </div>
                ))}
                {items.length === 0 && <div style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: "20px", textAlign: "center", fontSize: 11, color: C.textDim }}>Empty</div>}
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && (
        <Card>
          <DataTable headers={["Account", "Stage", "Score", "Est. Premium", "Next Action", ""]}
            rows={allItems.map(p => [
              <button onClick={() => { if (p.isDraft) { onResumeDraft(p.draftData); setPage("new-submission"); } else { setContext({ submission: p }); setPage("submission-workspace"); } }} style={{ background: "none", border: "none", color: p.isDraft ? C.amber : C.accent, cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>{p.account}</button>,
              <Tag color={stageCol[p.stage]}>{p.stage}</Tag>,
              p.score > 0 ? <ScorePill score={p.score} /> : <span style={{ color: C.textDim }}>—</span>,
              <span>{p.premium}</span>,
              <span style={{ fontSize: 11, color: C.textMid }}>{p.next}</span>,
              p.isDraft ? <Btn small danger onClick={() => onDeleteDraft(p.draftData.id)}>Delete</Btn> : null
            ])} />
        </Card>
      )}
    </div>
  );
}

// ── SUBMISSION WORKSPACE ───────────────────────────────────────────
function SubmissionWorkspacePage({ context, setPage, setContext }) {
  const sub = context?.submission || SEED_PIPELINE[0];
  const [tab, setTab] = useState("overview");
  const [showMarkets, setShowMarkets] = useState(false);

  const mockForm = { businessName: sub.account, naicsIdx: "", description: "", employees: "", hours: "", recordable: "", dart: "" };

  return (
    <div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, marginBottom: 5 }}>SUBMISSION</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{sub.account}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 9, alignItems: "center" }}>
              <Tag color={C.amber}>{sub.stage}</Tag>
              <ScorePill score={sub.score} />
              <span style={{ fontSize: 12, color: C.textMid }}>Est. {sub.premium}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost">💾 Save</Btn>
            <Btn variant="primary" onClick={() => setShowMarkets(true)}>⬡ Run Markets</Btn>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "9px 13px", background: C.bg, borderRadius: 6, fontSize: 12, color: C.textMid }}>
          <span style={{ color: C.amber, fontWeight: 700 }}>Next: </span>{sub.next}
        </div>
      </div>
      <TabBar tabs={["Overview", "Markets", "Quotes", "Tasks", "Docs", "Notes"]} active={tab} setActive={setTab} />
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <Sec>Missing Information</Sec>
            {["Loss runs needed", "Prior carrier confirmation"].map(x => (
              <div key={x} style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 9 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.text }}>{x}</span>
              </div>
            ))}
          </Card>
          <Card>
            <Sec>Score Drivers</Sec>
            {[{ l: "Industry class", n: "Strong market fit", c: C.green }, { l: "Territory", n: "Clean — low CAT exposure", c: C.green }, { l: "Loss history", n: "Pending — loss runs needed", c: C.amber }].map(d => (
              <div key={d.l} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.c, marginTop: 5, flexShrink: 0 }} />
                <div><div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{d.l}</div><div style={{ fontSize: 11, color: C.textMid }}>{d.n}</div></div>
              </div>
            ))}
          </Card>
          <Card style={{ gridColumn: "1 / -1" }}>
            <Sec>Activity Log</Sec>
            {[{ date: "Mar 4", note: "Submission created", user: "Demetri" }, { date: "Mar 5", note: "Sent to Travelers", user: "Demetri" }, { date: "Mar 6", note: "Awaiting loss runs from insured", user: "System" }].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: C.textDim, width: 38, flexShrink: 0 }}>{a.date}</span>
                <span style={{ color: C.text }}>{a.note}</span>
                <span style={{ color: C.textDim, marginLeft: "auto" }}>{a.user}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
      {tab === "markets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <Sec>Recommended Markets</Sec>
            <DataTable headers={["Market", "Type", "Fit", ""]}
              rows={[["Travelers", "Carrier", <Tag color={C.green}>Strong</Tag>, <Btn small variant="success">Send</Btn>], ["Markel Specialty", "MGA", <Tag color={C.green}>Strong</Tag>, <Btn small variant="success">Send</Btn>], ["AmTrust MGA", "MGA", <Tag color={C.amber}>Moderate</Tag>, <Btn small>Send</Btn>]]} />
          </Card>
          <Card>
            <Sec>Active Markets</Sec>
            <DataTable headers={["Market", "Sent Date", "Status"]} rows={[["Travelers", "Mar 1", <Tag color={C.amber}>Reviewing</Tag>]]} />
          </Card>
        </div>
      )}
      {tab === "quotes" && (
        <Card>
          <Sec>Quotes Received</Sec>
          <DataTable headers={["Carrier", "Premium", "Deductible", "Status"]}
            rows={[["Travelers", <span style={{ color: C.green, fontWeight: 700 }}>$7,800</span>, "$2,500", <Tag color={C.green}>Received</Tag>], ["Markel", <span style={{ color: C.textDim }}>Pending</span>, "—", <Tag color={C.amber}>Awaiting</Tag>]]} />
        </Card>
      )}
      {["tasks", "docs", "notes"].includes(tab) && (
        <Card style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: C.textDim, marginBottom: 14 }}>No {tab} yet.</div>
          <Btn variant="ghost">+ Add {tab.slice(0, -1)}</Btn>
        </Card>
      )}
      {showMarkets && <RunMarketsModal form={mockForm} score={sub.score} onClose={() => setShowMarkets(false)} onSent={() => {}} />}
    </div>
  );
}

// ── ACCOUNTS ───────────────────────────────────────────────────────
function AccountsPage({ setPage, setContext }) {
  const [q, setQ] = useState("");
  const filtered = SEED_ACCOUNTS.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Accounts</div>
          <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>{SEED_ACCOUNTS.length} accounts in your book</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 13px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200 }} />
          <Btn variant="primary">+ Add Account</Btn>
        </div>
      </div>
      <Card>
        <DataTable headers={["Business", "Owner", "Industry", "Score", "Renewal", ""]}
          rows={filtered.map(a => [
            <button onClick={() => { setContext({ account: a }); setPage("account-workspace"); }} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>{a.name}</button>,
            <span style={{ color: C.textMid }}>{a.owner}</span>,
            <span style={{ fontSize: 11, color: C.textMid }}>{a.industry}</span>,
            <ScorePill score={a.score} />,
            <span style={{ color: C.amber, fontWeight: 600 }}>{a.renewal}</span>,
            <Btn small onClick={() => { setContext({ submissionAccount: a }); setPage("new-submission"); }}>+ Sub</Btn>
          ])} />
      </Card>
    </div>
  );
}

// ── ACCOUNT WORKSPACE ──────────────────────────────────────────────
function AccountWorkspacePage({ context, setPage, setContext }) {
  const acct = context?.account || SEED_ACCOUNTS[0];
  const [tab, setTab] = useState("summary");
  const subs = SEED_PIPELINE.filter(p => p.accountId === acct.id);
  return (
    <div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1.5, marginBottom: 5 }}>ACCOUNT</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{acct.name}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 9, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textMid }}>Owner: {acct.owner}</span>
              <span style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>Renewal: {acct.renewal}</span>
              <ScorePill score={acct.score} />
            </div>
          </div>
          <Btn variant="primary" onClick={() => { setContext({ submissionAccount: acct }); setPage("new-submission"); }}>+ New Submission</Btn>
        </div>
      </div>
      <TabBar tabs={["Summary", "Submissions", "Tasks", "Docs", "Notes"]} active={tab} setActive={setTab} />
      {tab === "summary" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <Sec>Account Details</Sec>
            {[["Industry", acct.industry], ["NAICS", acct.naics], ["Owner", acct.owner], ["Renewal Date", acct.renewal]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.textMid }}>{k}</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{ textAlign: "center" }}>
            <Sec>Risk Profile</Sec>
            <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(acct.score), fontFamily: "monospace" }}>{acct.score.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: scoreColor(acct.score), letterSpacing: 2, marginTop: 4 }}>{acct.score <= 3.5 ? "LOW RISK" : acct.score <= 6.5 ? "MODERATE RISK" : "HIGH RISK"}</div>
          </Card>
        </div>
      )}
      {tab === "submissions" && (
        <Card>
          <Sec>Submission History</Sec>
          {subs.length > 0 ? (
            <DataTable headers={["Stage", "Score", "Premium", "Next"]}
              rows={subs.map(p => [
                <button onClick={() => { setContext({ submission: p }); setPage("submission-workspace"); }} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>{p.stage}</button>,
                <ScorePill score={p.score} />, p.premium,
                <span style={{ fontSize: 11, color: C.textMid }}>{p.next}</span>
              ])} />
          ) : <div style={{ textAlign: "center", padding: "30px", color: C.textDim }}>No submissions yet.</div>}
        </Card>
      )}
      {["tasks", "docs", "notes"].includes(tab) && <Card style={{ textAlign: "center", padding: "40px", color: C.textDim }}>No {tab} yet.</Card>}
    </div>
  );
}

// ── MARKETS PAGE ───────────────────────────────────────────────────
function MarketsPage() {
  const [industry, setIndustry] = useState("");
  const [fit, setFit] = useState("All");
  const filtered = MARKETS_LIST.filter(m => (fit === "All" || m.fit === fit) && (industry === "" || m.classes.some(c => c.toLowerCase().includes(industry.toLowerCase()))));
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Market Finder</div>
        <div style={{ fontSize: 13, color: C.textMid, marginTop: 3 }}>Find the right carrier or MGA for your submission</div>
      </div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>Industry / Class</label>
            <input placeholder="e.g. Roofing, Restaurant..." value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 5 }}>Fit Level</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Strong", "Moderate"].map(f => <button key={f} onClick={() => setFit(f)} style={{ padding: "7px 13px", borderRadius: 6, border: `1px solid ${C.border}`, background: fit === f ? C.accentGlow : "transparent", color: fit === f ? C.accent : C.textMid, fontSize: 11, fontFamily: "inherit", cursor: "pointer", fontWeight: fit === f ? 700 : 400 }}>{f}</button>)}
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <Sec>Results — {filtered.length} Markets</Sec>
        <DataTable headers={["Market", "Type", "Fit", "Classes", "States", ""]}
          rows={filtered.map(m => [
            <b style={{ color: C.text }}>{m.name}</b>,
            <Tag color={m.type === "Carrier" ? C.accent : C.amber}>{m.type}</Tag>,
            <Tag color={m.fit === "Strong" ? C.green : C.amber}>{m.fit}</Tag>,
            <span style={{ fontSize: 11, color: C.textMid }}>{m.classes.join(", ")}</span>,
            <span style={{ fontSize: 11, color: C.textMid }}>{m.states.join(", ")}</span>,
            <Btn small variant="success">Select</Btn>
          ])} />
      </Card>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [context, setContext] = useState({});
  const [drafts, setDrafts] = useState([]);
  const [toast, setToast] = useState(null);

  const nav = p => setPage(p);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveDraft = (draftData) => {
    setDrafts(prev => {
      const existing = prev.findIndex(d => d.id === draftData.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = draftData;
        return updated;
      }
      return [...prev, draftData];
    });
    showToast(`Draft saved — "${draftData.businessName || "Untitled"}"`, "amber");
  };

  const handleResumeDraft = (draftData) => {
    setContext({ draft: draftData });
  };

  const handleDeleteDraft = (draftId) => {
    setDrafts(prev => prev.filter(d => d.id !== draftId));
    showToast("Draft deleted", "success");
  };

  const handleRunMarkets = (marketName, form) => {
    showToast(`Sent to ${marketName} ✓`, "success");
  };

  const pages = {
    home: <HomePage setPage={nav} setContext={setContext} drafts={drafts} />,
    "new-submission": <NewSubmissionPage context={context} onSaveDraft={handleSaveDraft} onRunMarkets={handleRunMarkets} />,
    pipeline: <PipelinePage setPage={nav} setContext={setContext} drafts={drafts} onResumeDraft={handleResumeDraft} onDeleteDraft={handleDeleteDraft} />,
    "submission-workspace": <SubmissionWorkspacePage context={context} setPage={nav} setContext={setContext} />,
    accounts: <AccountsPage setPage={nav} setContext={setContext} />,
    "account-workspace": <AccountWorkspacePage context={context} setPage={nav} setContext={setContext} />,
    markets: <MarketsPage />,
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1c2030; border-radius: 2px; }
        button { transition: opacity 0.15s; }
        button:hover:not(:disabled) { opacity: 0.85; }
        tr:hover td { background: rgba(61,142,248,0.03); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Sidebar page={page} setPage={nav} draftCount={drafts.length} />
      <main style={{ marginLeft: 210, padding: "28px 32px", minHeight: "100vh", width: "calc(100vw - 210px)" }}>
        {pages[page] || pages["home"]}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
