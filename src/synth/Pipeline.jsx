// SYNTH pipeline: stage filter pills, one card per submission, drafts
// shown under the Draft stage. Includes the CSV import panel.
import { useState } from "react";
import {
  STAGES, createdOf, insuredOf, lineOf, nextAction, outreachOf, outreachSummary,
  parseSubmissionCsv, shownScore, stageOf,
} from "./model.js";

function MarketChips({ s, max = 6 }) {
  const o = outreachOf(s);
  if (!o.length) return null;
  const cls = { Quoted: "b-ok", Bound: "b-ok", Declined: "b-bad", Lost: "b-neut", Sent: "b-neut" };
  return (
    <div className="chips">
      {o.slice(0, max).map((x) => (
        <span key={x.carrier} className={"chip " + (cls[x.status] || "b-neut")}>{x.carrier} <i>{x.status.toLowerCase()}</i></span>
      ))}
      {o.length > max && <span className="chip b-neut">+{o.length - max} more</span>}
    </div>
  );
}

function RenewFlag({ s }) {
  if (stageOf(s) !== "Bound" || !s.renewalDate) return null;
  const t = new Date(s.renewalDate + "T00:00:00");
  if (Number.isNaN(t.getTime())) return null;
  const days = Math.round((t - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00")) / 86400000);
  if (days < 0) return <> <span className="badge b-bad">renewal date passed</span></>;
  if (days <= 45) return <> <span className="badge b-warm">renews in {days} day{days === 1 ? "" : "s"}</span></>;
  return null;
}

function CsvImport({ isKnownNaics, onImport }) {
  const [raw, setRaw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!raw.trim()) { setMsg("Paste CSV rows first."); return; }
    const { rows, bad } = parseSubmissionCsv(raw, isKnownNaics);
    setBusy(true);
    const ok = rows.length ? await onImport(rows) : 0;
    setBusy(false);
    setMsg(`Imported ${ok} draft(s) at baseline score. Open each to answer the underwriting questions.${bad.length ? " Skipped: " + bad.join("; ") : ""}`);
    if (ok) setRaw("");
  };
  return (
    <details className="eviden mt">
      <summary>Import from CSV</summary>
      <div className="body">
        <div className="small dim">One row per account: <b>insured, naics, line, state, revenue, years, effective date (YYYY-MM-DD)</b>. Rows come in as drafts so no SR number is used until you finish them.</div>
        <textarea style={{ minHeight: 110, marginTop: 8 }} value={raw} onChange={(e) => setRaw(e.target.value)}
          placeholder={"insured,naics,line,state,revenue,years,effective\nSunrise Roofing LLC,238160,GL,AZ,1800000,9,2027-01-01"} />
        <div className="flex mt"><button className="btn sm" disabled={busy} onClick={run}>{busy ? "Importing…" : "Import rows"}</button><span className="small dim">{msg}</span></div>
      </div>
    </details>
  );
}

export default function Pipeline({ submissions, drafts, open, resumeDraft, deleteDraft, industryTitle, isKnownNaics, onImport }) {
  const [filter, setFilter] = useState("All");
  const draftItems = drafts.map((d) => ({ ...d, _draft: true }));
  const all = [...draftItems, ...submissions];
  const inStage = (st) => (st === "Draft" ? draftItems : submissions.filter((s) => stageOf(s) === st));
  const stages = filter === "All" ? STAGES : [filter];

  return (
    <div>
      <h2>Pipeline</h2>
      {!all.length && <div className="card dim">No submissions yet. Start one from New Submission.</div>}
      {!!all.length && (
        <div className="stagerow">
          {["All", ...STAGES].map((st) => {
            const n = st === "All" ? all.length : inStage(st).length;
            return (
              <button key={st} className={"sbtn" + (filter === st ? " on" : "")} disabled={!n} onClick={() => setFilter(st)}>
                {st} <span>{n}</span>
              </button>
            );
          })}
        </div>
      )}

      {stages.map((st) => {
        const list = inStage(st);
        if (!list.length) return null;
        return (
          <div key={st}>
            <h3 className="mt">{st} <span className="dim">{list.length}</span></h3>
            {list.map((s) => {
              if (s._draft) {
                return (
                  <div key={"d" + s.id} className="pipecard" onClick={() => resumeDraft(s)}>
                    <div className="flex spread" style={{ alignItems: "flex-start" }}>
                      <div>
                        <b>{s.businessName || "Untitled draft"}</b>
                        <div className="small dim">{s.naicsCode ? `${s.naicsCode} ${industryTitle(s.naicsCode)}` : "No industry yet"}{s.savedAt ? ` · saved ${s.savedAt}` : ""}</div>
                      </div>
                      <div className="flex" style={{ flex: "none" }}>
                        {s.score ? <span className="badge b-acc">SOFT {Number(s.score).toFixed(1)}</span> : null}
                        <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); deleteDraft(s.id); }} title="Delete draft">✕</button>
                      </div>
                    </div>
                    <div className="small" style={{ color: "var(--cyan)", marginTop: 6 }}>Next: finish the intake and generate the submission</div>
                  </div>
                );
              }
              const c = outreachSummary(s);
              const score = shownScore(s);
              return (
                <div key={s.submissionId} className="pipecard" onClick={() => open(s)}>
                  <div className="flex spread" style={{ alignItems: "flex-start" }}>
                    <div>
                      <b>{insuredOf(s)}</b> <span className="small dim">{s.srNumber}</span>
                      <div className="small dim">{s.naicsCode} {industryTitle(s.naicsCode)} · {lineOf(s)} · {s.state || "—"} · {s.producer || "—"} · {createdOf(s)}</div>
                    </div>
                    <div className="flex" style={{ flex: "none" }}>
                      <span className="small dim">{c.sent ? `${c.sent} sent · ${c.q} quoted · ${c.d} declined` : "nothing sent"}</span>
                      {score !== null && <span className="badge b-acc" title="SYNTH Score, 1.0 to 9.9. Higher is harder to place.">SYNTH {score}</span>}
                    </div>
                  </div>
                  {s.review && (
                    <span className={"badge " + (s.review.status === "Approved" ? "b-ok" : s.review.status === "Requested" ? "b-acc" : "b-warm")} style={{ marginTop: 6 }}>
                      {s.review.status === "Requested" ? "REVIEW REQUESTED" : s.review.status.toUpperCase()}
                    </span>
                  )}
                  <MarketChips s={s} />
                  <div className="small" style={{ color: "var(--cyan)", marginTop: 6 }}>{nextAction(s)}<RenewFlag s={s} /></div>
                </div>
              );
            })}
          </div>
        );
      })}
      {filter !== "All" && !inStage(filter).length && <div className="card dim">Nothing at this stage.</div>}

      <CsvImport isKnownNaics={isKnownNaics} onImport={onImport} />
    </div>
  );
}
