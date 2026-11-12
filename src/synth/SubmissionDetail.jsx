// SYNTH submission detail: stage, score, outcomes by market, diligent
// search, account fields, the carrier email, and manager review.
//
// Every change calls onSave(patch). The parent merges the patch into the
// submission and re-posts it to POST /submissions with the same id and SR
// number (see resaveBody in model.js).
import { useState } from "react";
import {
  MARKET_TYPES, OUTCOMES, STAGES, canManage, createdOf, emailSubject, insuredOf, lineOf,
  lossRunsOk, mailtoHref, outreachOf, riskOverviewLines, shownScore, stageOf, today,
  withOutreachField, withOutreachStatus, withSend,
} from "./model.js";

const scoreClass = (n) => (n === null ? "b-neut" : n <= 3.5 ? "b-ok" : n <= 6.5 ? "b-warm" : "b-bad");

// Text inputs save when they lose focus, like SYNTH's onchange handlers,
// so typing does not fire a save per keystroke.
function BlurInput({ value, onCommit, textarea, ...rest }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <Tag defaultValue={value || ""} onBlur={(e) => { if ((e.target.value || "") !== (value || "")) onCommit(e.target.value); }} {...rest} />
  );
}

function ScoreCard({ s, manager }) {
  const soft = s.score === undefined || s.score === null || s.score === "" ? null : Math.round(Number(s.score) * 10) / 10;
  const synth = s.synthScore === undefined || s.synthScore === null ? null : Math.round(Number(s.synthScore) * 10) / 10;
  const b = s.riskBreakdown;
  return (
    <details className="eviden" open>
      <summary>Why this score</summary>
      <div className="body">
        <div className="scorebig mb">
          <div><div className="small dim">Soft score</div><div className="num">{soft ?? "—"}</div></div>
          <div className="dim">→</div>
          <div><div className="small dim">SYNTH score</div><div className="num gradtext">{synth ?? soft ?? "—"}</div></div>
          <div style={{ flex: 1, minWidth: 220 }} className="small">
            {s.isfExplanation || s.comparison?.summary || (synth === null ? "Market validation was not available when this was saved, so the SYNTH score equals the soft score." : "")}
            <div className="dim" style={{ marginTop: 4 }}>1.0 to 9.9. Higher is harder to place.{s.isfAsOf ? ` Market data as of ${s.isfAsOf}.` : ""}</div>
          </div>
        </div>
        {b?.sections?.length > 0 && (
          <table>
            <thead><tr><th>Factor</th><th>Answer</th><th style={{ textAlign: "right" }}>Δ</th></tr></thead>
            <tbody>
              {b.sections.flatMap((sec) => sec.items.map((it, i) => (
                <tr key={sec.title + i}>
                  <td className="small">{it.question}</td>
                  <td className="small"><b>{it.answer}</b></td>
                  <td className="small" style={{ textAlign: "right" }}>{it.impact > 0 ? "+" : ""}{Number(it.impact).toFixed(1)}</td>
                </tr>
              )))}
            </tbody>
          </table>
        )}
        {manager && b && (
          <div className="small dim mt">
            Baseline {b.baseline} ({b.naicsIndustry})
            {b.adjustment !== null && b.adjustment !== undefined ? ` · loss experience ${b.adjustment > 0 ? "+" : ""}${b.adjustment}` : ""}
            {` · questions ${b.modifierApplied > 0 ? "+" : ""}${b.modifierApplied}${b.modifierCapped ? " (capped)" : ""}`}
            {` = soft ${b.finalScore}`}
          </div>
        )}
      </div>
    </details>
  );
}

function Outcomes({ s, save }) {
  const [carrier, setCarrier] = useState("");
  const [type, setType] = useState(MARKET_TYPES[0]);
  const [msg, setMsg] = useState("");
  const rows = outreachOf(s);

  const logSend = () => {
    if (!lossRunsOk(s)) { setMsg("Loss runs are required before sending. Tick “Loss runs ready” or “New venture” under Account."); return; }
    const p = withSend(s, carrier, type);
    if (!p) { setMsg(carrier.trim() ? `${carrier.trim()} is already on this submission.` : "Type the market name first."); return; }
    setMsg(""); setCarrier("");
    save(p);
  };

  return (
    <div className="card mt">
      <h3>Outcomes by market (who has this submission)</h3>
      <div className="flex wrap mb">
        <input style={{ flex: 2, minWidth: 180 }} placeholder="Market or carrier name" value={carrier}
          onChange={(e) => setCarrier(e.target.value)} onKeyDown={(e) => e.key === "Enter" && logSend()} />
        <select style={{ flex: 1, minWidth: 110 }} value={type} onChange={(e) => setType(e.target.value)}>
          {MARKET_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button className="btn sm" onClick={logSend}>Log send</button>
      </div>
      {msg && <div className="small" style={{ color: "var(--warm)", marginBottom: 8 }}>{msg}</div>}
      {rows.length ? (
        <table>
          <thead><tr><th>Market</th><th>Type</th><th>Sent</th><th>Status</th><th>Outcome detail</th><th>Updated</th><th /></tr></thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.carrier}>
                <td><b>{o.carrier}</b></td>
                <td className="small">{o.type}</td>
                <td className="small dim">{o.date}</td>
                <td>
                  <select className="stgsel" value={o.status} onChange={(e) => save(withOutreachStatus(s, i, e.target.value))}>
                    {OUTCOMES.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </td>
                <td>
                  {(o.status === "Quoted" || o.status === "Bound") && (
                    <BlurInput key={o.status + "p"} className="small" style={{ width: 120 }} placeholder="Premium $" value={o.premium ?? ""}
                      onCommit={(v) => save(withOutreachField(s, i, "premium", v))} />
                  )}
                  {o.status === "Declined" && (
                    <BlurInput key={o.status + "r"} className="small" style={{ width: 190 }} maxLength={120} placeholder="Decline reason" value={o.reason || ""}
                      onCommit={(v) => save(withOutreachField(s, i, "reason", v))} />
                  )}
                  {!["Quoted", "Bound", "Declined"].includes(o.status) && <span className="small dim">·</span>}
                </td>
                <td className="small dim">{o.odate || o.date}</td>
                <td><button className="btn danger sm" onClick={() => save({ outreach: rows.filter((_, j) => j !== i) })}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="small dim">Nothing sent yet. Log each market you send to, then record what it did here. Quoted or Bound takes a premium, Declined takes a reason and feeds the diligent-search log, Lost closes the row out.</div>
      )}
    </div>
  );
}

function DiligentSearch({ s }) {
  const rec = outreachOf(s).filter((o) => o.status === "Declined");
  const needed = Math.max(0, 3 - rec.length);
  return (
    <div className="card mt">
      <h3>Diligent search · {s.state || "state"} surplus-lines support</h3>
      {rec.length ? (
        <table>
          <thead><tr><th>Carrier</th><th>Response</th><th>Reason</th></tr></thead>
          <tbody>
            {rec.map((o) => (
              <tr key={o.carrier}><td>{o.carrier}</td><td>Declined (recorded)</td><td>{o.reason ? `${o.reason} · ` : ""}agent-logged {o.odate || o.date}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="small dim">No declinations yet. Markets you mark Declined populate this.</div>
      )}
      <div className="small dim mt">{needed} more documented declination(s) required before filing. Not legal advice.</div>
    </div>
  );
}

function AccountCard({ s, save }) {
  return (
    <div className="card mt">
      <h3>Account</h3>
      <div className="grid2">
        <div>
          <label>Location <span className="dim">(city, address)</span></label>
          <BlurInput value={s.address} placeholder="Phoenix, AZ" onCommit={(v) => save({ address: v })} />
          <label>Renewal date</label>
          <BlurInput type="date" value={s.renewalDate} onCommit={(v) => save({ renewalDate: v })} />
          <label className="inline mt"><input type="checkbox" checked={!!s.newVenture} onChange={(e) => save({ newVenture: e.target.checked })} /> New venture, no prior loss history</label>
          <label className="inline"><input type="checkbox" checked={!!s.lossRunsReady} onChange={(e) => save({ lossRunsReady: e.target.checked })} /> Loss runs ready to attach</label>
        </div>
        <div>
          <label>Operations <span className="dim">(what they actually do)</span></label>
          <BlurInput textarea style={{ minHeight: 110 }} value={s.description} onCommit={(v) => save({ description: v })} />
        </div>
      </div>
      <label className="mt">Internal notes <span className="dim">(never leaves SYNTH)</span></label>
      <BlurInput textarea style={{ minHeight: 80 }} value={s.notes} placeholder="Underwriter conversations, what the client said, anything the team should know"
        onCommit={(v) => save({ notes: v })} />
    </div>
  );
}

function EmailCard({ s, body }) {
  const [copied, setCopied] = useState("");
  const ok = lossRunsOk(s);
  const copy = async () => {
    try { await navigator.clipboard.writeText(body); setCopied("Copied."); } catch { setCopied("Copy failed. Select the text and copy it."); }
  };
  return (
    <div className="card mt">
      <div className="flex spread"><h3>Submission email</h3>
        <div className="flex">
          <button className="btn ghost sm" onClick={copy}>Copy body</button>
          <a className="btn sm" href={ok ? mailtoHref(emailSubject(s), body) : undefined} aria-disabled={!ok}
            style={ok ? undefined : { background: "var(--line)", color: "var(--dim)", pointerEvents: "none" }}
            title={ok ? undefined : "Tick loss runs ready or new venture first"}>Open draft ✉</a>
        </div>
      </div>
      <div className="small dim">Opens in your mail app with the subject and body filled. You type the recipient and attach the PDF.</div>
      <div className="small" style={{ marginTop: 8 }}><b>Subject:</b> {emailSubject(s)}</div>
      <textarea readOnly value={body} style={{ marginTop: 6, minHeight: 180, fontSize: 12.5 }} />
      <div className="small dim">{copied}</div>
    </div>
  );
}

function ReviewCard({ s, user, save }) {
  const [note, setNote] = useState("");
  const r = s.review;
  const manager = canManage(user?.role);
  if (!r) {
    return (
      <div className="card mt">
        <h3>Manager review</h3>
        <div className="small dim">Optional. Sending to markets is never blocked by this.</div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would you like a second read on?" style={{ marginTop: 8 }} />
        <button className="btn ghost sm mt" onClick={() => { save({ review: { status: "Requested", by: user?.name || user?.email, at: today(), note: note.slice(0, 400) } }); setNote(""); }}>Send for review</button>
      </div>
    );
  }
  const badge = r.status === "Approved" ? "b-ok" : r.status === "Changes requested" ? "b-warm" : "b-acc";
  const reply = (status) => save({ review: { ...r, status, by2: user?.name || user?.email, at2: today(), note2: note.slice(0, 400) } });
  return (
    <div className="card mt">
      <div className="flex spread"><h3>Manager review</h3><span className={"badge " + badge}>{r.status}</span></div>
      <div className="small dim">Requested by {r.by} on {r.at}{r.note ? ` · ${r.note}` : ""}</div>
      {r.at2 && <div className="small" style={{ color: "var(--cyan)", marginTop: 4 }}>{r.status} by {r.by2} on {r.at2}{r.note2 ? ` · ${r.note2}` : ""}</div>}
      {manager && r.status === "Requested" && (
        <>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note back to the producer (optional)" style={{ marginTop: 8 }} />
          <div className="flex mt">
            <button className="btn sm" onClick={() => reply("Approved")}>Approve</button>
            <button className="btn ghost sm" onClick={() => reply("Changes requested")}>Request changes</button>
          </div>
        </>
      )}
      {!manager && r.status !== "Requested" && (
        <button className="btn ghost sm mt" onClick={() => save({ review: null })}>Clear and request again later</button>
      )}
    </div>
  );
}

export default function SubmissionDetail({ sub: s, user, industryTitle, qa, saving, onSave, onBack }) {
  if (!s) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <div className="mb">No submission selected.</div>
        <button className="btn ghost sm" onClick={onBack}>← Back to pipeline</button>
      </div>
    );
  }
  const score = shownScore(s);
  const body = riskOverviewLines(s, { industryTitle: industryTitle(s.naicsCode), qa, user }).join("\n");
  const manager = canManage(user?.role);

  return (
    <div key={s.submissionId}>
      <button className="linkbtn mb" onClick={onBack}>← Pipeline</button>
      <div className="flex spread mb wrap" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>{insuredOf(s)}</h2>
          <div className="small dim">
            <span style={{ color: "var(--cyan)", fontWeight: 700 }}>{s.srNumber}</span>
            {` · ${s.naicsCode || "—"} ${industryTitle(s.naicsCode)} · ${lineOf(s)} · ${s.state || "no state"} · created ${createdOf(s)}`}
            {s.renewalDate ? ` · renews ${s.renewalDate}` : ""}
          </div>
          <div className="flex" style={{ marginTop: 8, gap: 8 }}>
            <span className="small dim">Stage</span>
            <select className="stgsel" value={stageOf(s)} onChange={(e) => onSave({ stage: e.target.value })}>
              {STAGES.map((x) => <option key={x}>{x}</option>)}
            </select>
            {score !== null && <span className={"badge " + scoreClass(score)}>SYNTH {score}</span>}
            <span className="small dim">{saving ? "Saving…" : "Saved"}</span>
          </div>
        </div>
        <div className="flex" style={{ flex: "none" }}>
          {s.pdfUrl ? <a className="btn ghost sm" href={s.pdfUrl} target="_blank" rel="noopener noreferrer">Download PDF ↧</a>
            : <span className="small dim">PDF generating…</span>}
        </div>
      </div>

      <ScoreCard s={s} manager={manager} />
      <Outcomes s={s} save={onSave} />
      <DiligentSearch s={s} />
      <AccountCard s={s} save={onSave} />
      <EmailCard s={s} body={body} />
      <ReviewCard s={s} user={user} save={onSave} />
    </div>
  );
}
