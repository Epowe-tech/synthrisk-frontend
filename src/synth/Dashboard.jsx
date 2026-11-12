// SYNTH dashboard: a work queue, not a report. Every row links to the
// submission that needs something done.
import { canManage, daysUntil, insuredOf, lineOf, outreachOf, outreachSummary, shownScore, stageOf } from "./model.js";

function Section({ title, rows, empty }) {
  return (
    <div className="card mb">
      <h3>{title}</h3>
      {rows.length ? (
        <table><tbody>{rows}</tbody></table>
      ) : (
        <div className="small dim">{empty}</div>
      )}
    </div>
  );
}

export default function Dashboard({ user, submissions, drafts, open, resumeDraft, industryTitle }) {
  const link = (s) => (
    <a href="#" onClick={(e) => { e.preventDefault(); open(s); }} style={{ color: "var(--text)" }}>
      <b>{insuredOf(s)}</b>
    </a>
  );

  const renewals = submissions
    .filter((s) => s.renewalDate)
    .map((s) => ({ s, d: daysUntil(s.renewalDate) }))
    .filter((x) => x.d !== null && x.d >= -30 && x.d <= 120)
    .sort((a, b) => a.d - b.d);

  const waiting = submissions
    .map((s) => ({ s, o: outreachOf(s).filter((x) => x.status === "Sent") }))
    .filter((x) => x.o.length)
    .map((x) => ({ ...x, age: Math.max(...x.o.map((y) => -(daysUntil(y.date) ?? 0))) }))
    .sort((a, b) => b.age - a.age);

  const quotes = submissions.filter((s) => ["Quotes", "Proposal"].includes(stageOf(s)));
  const reviews = submissions.filter((s) => s.review && s.review.status === "Requested");
  const manager = canManage(user?.role);

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="grid3 mb">
        <div className="stat"><b>{submissions.length}</b><div className="small dim">submissions</div></div>
        <div className="stat"><b>{waiting.length}</b><div className="small dim">waiting on markets</div></div>
        <div className="stat"><b>{renewals.filter((x) => x.d <= 45).length}</b><div className="small dim">renewals in 45 days</div></div>
      </div>

      {(manager || reviews.length > 0) && (
        <Section
          title={manager ? "Waiting on your review" : "Your review requests"}
          empty="Nothing waiting on you."
          rows={reviews.map((s) => (
            <tr key={s.submissionId}>
              <td>{link(s)}<div className="small dim">{s.review.by} · {s.review.at}{s.review.note ? ` · ${s.review.note}` : ""}</div></td>
              <td style={{ textAlign: "right" }}><span className="badge b-acc">{manager ? "REVIEW" : "PENDING"}</span></td>
            </tr>
          ))}
        />
      )}

      <Section
        title="Renewals (next 120 days)"
        empty="Nothing renewing in the next 120 days. Set a renewal date on bound accounts to see them here."
        rows={renewals.map(({ s, d }) => (
          <tr key={s.submissionId}>
            <td>{link(s)}<div className="small dim">{lineOf(s)} · {s.state || "—"} · {stageOf(s)} · renews {s.renewalDate}</div></td>
            <td style={{ textAlign: "right" }}>
              <span className={"badge " + (d < 0 ? "b-bad" : d < 30 ? "b-hot" : d < 60 ? "b-warm" : "b-neut")}>{d < 0 ? "OVERDUE" : `${d} DAYS`}</span>
            </td>
          </tr>
        ))}
      />

      <Section
        title="Waiting on a market"
        empty="No open sends. Every market you've approached has answered."
        rows={waiting.map(({ s, o, age }) => (
          <tr key={s.submissionId}>
            <td>{link(s)}<div className="small dim">{o.map((y) => y.carrier).join(", ")}</div></td>
            <td style={{ textAlign: "right" }}>
              <span className={"badge " + (age >= 14 ? "b-hot" : age >= 7 ? "b-warm" : "b-neut")}>{age} DAYS OUT</span>
            </td>
          </tr>
        ))}
      />

      <Section
        title="In quotes or proposal"
        empty="Nothing at the quote stage."
        rows={quotes.map((s) => {
          const c = outreachSummary(s);
          return (
            <tr key={s.submissionId}>
              <td>{link(s)}<div className="small dim">{c.q} quoted · {c.d} declined · {stageOf(s)}</div></td>
              <td style={{ textAlign: "right" }}>{shownScore(s) !== null && <span className="badge b-acc">SYNTH {shownScore(s)}</span>}</td>
            </tr>
          );
        })}
      />

      <Section
        title="Drafts not yet marketed"
        empty="No drafts waiting."
        rows={drafts.map((d) => (
          <tr key={d.id}>
            <td>
              <a href="#" onClick={(e) => { e.preventDefault(); resumeDraft(d); }} style={{ color: "var(--text)" }}><b>{d.businessName || "Untitled draft"}</b></a>
              <div className="small dim">{d.naicsCode ? `${d.naicsCode} ${industryTitle(d.naicsCode)}` : "No industry yet"}{d.savedAt ? ` · saved ${d.savedAt}` : ""}</div>
            </td>
            <td style={{ textAlign: "right" }}><span className="badge b-neut">DRAFT</span></td>
          </tr>
        ))}
      />

      <div className="note">Carrier recommendations and Hot Markets arrive with the market data phase. Until then, log the markets you send to on each submission.</div>
    </div>
  );
}
