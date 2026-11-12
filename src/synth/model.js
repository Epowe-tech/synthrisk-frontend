// Pure helpers for the SYNTH screens. No React, no network, so every
// function here can be tested by calling it with a plain object.
//
// The submission records come from your API (DynamoDB items written by
// synthrisk-saveSubmission). SYNTH used different field names, so the
// helpers below read your names and give the screens SYNTH's view of them:
//
//   SYNTH         your record
//   insured   ->  businessName
//   naics     ->  naicsCode
//   line      ->  line, else derived from glLimit / propLimit
//   by        ->  producer
//   renew     ->  renewalDate
//   outreach  ->  outreach (new field, same shape as SYNTH)
//   review    ->  review   (new field, same shape as SYNTH)

export const STAGES = ["Draft", "Marketing", "Quotes", "Proposal", "Bound"];
export const OUTCOMES = ["Sent", "Quoted", "Declined", "Bound", "Lost"];
export const MARKET_TYPES = ["Admitted", "E&S"];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

// Roles live in the Cognito custom:role attribute. Anything at manager
// level or above can approve reviews and see the arithmetic.
const MANAGER_ROLES = ["manager", "admin", "president", "owner", "staff"];
export const canManage = (role) => MANAGER_ROLES.includes(String(role || "").toLowerCase());

export const today = () => new Date().toISOString().slice(0, 10);

export function subId(s) { return s.submissionId || s.id; }
export function insuredOf(s) { return s.businessName || "Untitled"; }
export function lineOf(s) {
  if (s.line) return s.line;
  if (s.glLimit) return "GL";
  if (s.propLimit) return "Property";
  return "GL";
}
export function lineName(line) { return line === "GL" ? "General Liability" : line; }
export function stageOf(s) { return s.stage || "Marketing"; }
export function createdOf(s) { return (s.createdAt || "").slice(0, 10); }

// The score SYNTH shows is the validated one when the ISF returned it,
// otherwise the questionnaire (soft) score.
export function shownScore(s) {
  const v = s.synthScore ?? s.score;
  const n = v === null || v === undefined || v === "" ? null : Number(v);
  return n === null || Number.isNaN(n) ? null : Math.round(n * 10) / 10;
}

export function outreachOf(s) { return Array.isArray(s.outreach) ? s.outreach : []; }

export function outreachSummary(s) {
  const o = outreachOf(s);
  const n = (st) => o.filter((x) => x.status === st).length;
  return { sent: o.length, q: n("Quoted"), d: n("Declined"), b: n("Bound"), l: n("Lost") };
}

// Whole days from today to an ISO date (negative = in the past).
export function daysUntil(iso, now = new Date()) {
  if (!iso) return null;
  const t = new Date(String(iso).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(t.getTime())) return null;
  const base = new Date(now.toISOString().slice(0, 10) + "T00:00:00");
  return Math.round((t - base) / 86400000);
}

export function monthsOut(iso, now = new Date()) {
  const d = daysUntil(iso, now);
  return d === null ? null : Math.round((d / 30.44) * 10) / 10;
}

export function nextAction(s) {
  const c = outreachSummary(s);
  const stage = stageOf(s);
  if (stage === "Draft") return c.sent ? `Next: move to Marketing. ${c.sent} market(s) already logged` : "Next: open, review score, send to markets";
  if (stage === "Marketing") {
    return c.sent
      ? `Waiting on ${c.sent - c.q - c.d - c.l - c.b} of ${c.sent} markets · ${c.q} quoted · ${c.d} declined`
      : "Next: no markets sent yet. Open and log sends";
  }
  if (stage === "Quotes") return "Next: compare quotes, pick market, request proposal";
  if (stage === "Proposal") return "Next: deliver proposal, request bind order";
  return s.renewalDate ? `Bound ✓ · renews ${s.renewalDate}` : "Bound ✓ · diary the renewal";
}

// Applies an outcome status change the way SYNTH does: stamps the date,
// clears fields that no longer apply, and moves the stage forward.
// Returns a new submission patch { outreach, stage }.
export function withOutreachStatus(s, index, status) {
  const outreach = outreachOf(s).map((o, i) => {
    if (i !== index) return o;
    const next = { ...o, status, odate: today() };
    if (status !== "Quoted" && status !== "Bound") delete next.premium;
    if (status !== "Declined") delete next.reason;
    return next;
  });
  let stage = stageOf(s);
  if (status === "Bound") stage = "Bound";
  else if (status === "Quoted" && (stage === "Draft" || stage === "Marketing")) stage = "Quotes";
  return { outreach, stage };
}

export function withOutreachField(s, index, field, raw) {
  const outreach = outreachOf(s).map((o, i) => {
    if (i !== index) return o;
    const next = { ...o, odate: today() };
    if (field === "premium") {
      const n = Math.round(Number(String(raw).replace(/[^0-9.]/g, "")));
      if (n > 0) next.premium = n; else delete next.premium;
    } else if (field === "reason") {
      const t = String(raw).trim().slice(0, 120);
      if (t) next.reason = t; else delete next.reason;
    }
    return next;
  });
  return { outreach };
}

// Logs a send to a market. Returns null when that market is already on
// the list (SYNTH never tracks the same carrier twice on one submission).
export function withSend(s, carrier, type) {
  const name = String(carrier || "").trim();
  if (!name) return null;
  const existing = outreachOf(s);
  if (existing.some((o) => o.carrier.toLowerCase() === name.toLowerCase())) return null;
  const d = today();
  const outreach = [...existing, { carrier: name, type, status: "Sent", date: d, odate: d }];
  return { outreach, stage: stageOf(s) === "Draft" ? "Marketing" : stageOf(s) };
}

export function lossRunsOk(s) { return !!s.newVenture || !!s.lossRunsReady; }

export function fmtDate(d) {
  if (!d) return "TBD";
  const t = new Date(String(d).slice(0, 10) + "T00:00:00");
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function emailSubject(s) {
  const eff = s.effectiveDate || s.renewalDate;
  return `Submission: ${insuredOf(s)} - ${lineName(lineOf(s))} - ${s.state || "state TBD"}${eff ? " - eff " + eff : ""}`;
}

// The plain-text risk overview that goes in the carrier email.
// industryTitle and qa are passed in so this file does not need the NAICS
// table or the question bank.
export function riskOverviewLines(s, { industryTitle = "", qa = [], user = null } = {}) {
  const rev = s.revenue ? "$" + Number(String(s.revenue).replace(/[^0-9.]/g, "")).toLocaleString() : "not provided";
  const L = [
    "RISK OVERVIEW",
    "Named insured: " + insuredOf(s),
    "Location: " + (s.address || s.state || "TBD"),
    "Operations: " + (s.description || industryTitle || "see attached") + (s.naicsCode ? ` (NAICS ${s.naicsCode})` : ""),
    "Line: " + lineName(lineOf(s)) + (s.glLimit && lineOf(s) === "GL" ? `, limit ${s.glLimit}` : "") + (s.propLimit && lineOf(s) === "Property" ? `, limit ${s.propLimit}` : ""),
    "Effective date: " + fmtDate(s.effectiveDate),
    "Years in business: " + (s.years || "n/a"),
    "Employees: " + (s.employees || "n/a"),
    "Annual revenue: " + rev,
  ];
  if (qa.length) {
    L.push("", "UNDERWRITING DETAIL");
    qa.forEach(([q, a]) => L.push(`- ${q} ${a}`));
  }
  L.push(
    "", "LOSS HISTORY",
    s.newVenture ? "New venture. No prior loss history." : s.lossRunsReady ? "Loss runs attached." : "Loss runs to follow.",
  );
  if (s.losses) L.push("Notes: " + s.losses);
  L.push("", "Please let me know what else you need to quote.", "", user?.name || "", user?.email || "");
  return L;
}

export function mailtoHref(subject, body) {
  return "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}

// Renewal windows used on the Renewals page.
export function renewalBucket(m) {
  if (m < 0) return ["LAPSED", "b-bad"];
  if (m <= 1) return ["<1 month", "b-bad"];
  if (m <= 3) return ["1-3 months", "b-warm"];
  if (m <= 6) return ["3-6 months", "b-neut"];
  return ["6+ months", "b-ok"];
}

// CSV import. Columns: insured, naics, line, state, revenue, years, effective
// A header row is skipped when its first cell says "insured".
export function parseSubmissionCsv(raw, isKnownNaics) {
  let lines = String(raw || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length && lines[0].toLowerCase().startsWith("insured")) lines = lines.slice(1);
  const rows = [], bad = [];
  lines.forEach((ln, i) => {
    const [businessName, naicsCode, line, state, revenue, years, effectiveDate] = ln.split(",").map((x) => x.trim());
    if (!businessName) { bad.push(`row ${i + 1}: no insured name`); return; }
    if (!isKnownNaics(naicsCode)) { bad.push(`row ${i + 1}: unknown NAICS ${naicsCode || "(blank)"}`); return; }
    const st = (state || "").toUpperCase();
    rows.push({
      businessName,
      naicsCode,
      line: line === "Property" ? "Property" : "GL",
      state: US_STATES.includes(st) ? st : "",
      revenue: revenue || "",
      years: years || "",
      effectiveDate: /^\d{4}-\d{2}-\d{2}$/.test(effectiveDate || "") ? effectiveDate : "",
      imported: true,
    });
  });
  return { rows, bad };
}

// Fields the API owns. They are stripped before a submission is re-saved so
// the client never writes keys, ownership, or a presigned URL back.
const SERVER_FIELDS = ["pk", "sk", "type", "orgId", "userId", "updatedAt", "pdfUrl", "draftId"];

// Builds the body for POST /submissions when updating an existing
// submission. Sending the same id and srNumber makes saveSubmission
// overwrite the row and keep its SR number.
export function resaveBody(s, patch) {
  const body = { ...s, ...patch };
  SERVER_FIELDS.forEach((k) => delete body[k]);
  body.id = subId(s);
  body.srNumber = s.srNumber;
  return body;
}
