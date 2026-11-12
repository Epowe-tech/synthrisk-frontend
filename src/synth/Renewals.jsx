// SYNTH renewals: the bound book sorted by how soon it renews.
import { insuredOf, lineOf, monthsOut, renewalBucket, stageOf } from "./model.js";

export default function Renewals({ submissions, open }) {
  const bound = submissions.filter((s) => stageOf(s) === "Bound");
  const withDate = bound
    .filter((s) => s.renewalDate)
    .map((s) => ({ s, m: monthsOut(s.renewalDate) }))
    .filter((x) => x.m !== null)
    .sort((a, b) => a.m - b.m);
  const noDate = bound.filter((s) => !s.renewalDate);

  const counts = [0, 0, 0, 0];
  withDate.forEach(({ m }) => {
    if (m <= 1) counts[0]++; else if (m <= 3) counts[1]++; else if (m <= 6) counts[2]++; else counts[3]++;
  });
  const go = (s) => (e) => { e.preventDefault(); open(s); };

  return (
    <div>
      <h2>Renewals</h2>
      <div className="grid4 mb">
        {["<1 month", "1-3 months", "3-6 months", "6+ months"].map((l, i) => (
          <div key={l} className="card"><div className="small dim">{l}</div><div style={{ fontSize: 26 }}><b>{counts[i]}</b></div></div>
        ))}
      </div>
      <div className="card mb">
        <h3>Bound book · upcoming renewals</h3>
        {withDate.length ? (
          <table>
            <thead><tr><th>Insured</th><th>Renews</th><th>Window</th><th>Months out</th><th>Producer</th></tr></thead>
            <tbody>
              {withDate.map(({ s, m }) => {
                const [lbl, cls] = renewalBucket(m);
                return (
                  <tr key={s.submissionId}>
                    <td><a href="#" onClick={go(s)}>{insuredOf(s)}</a><div className="small dim">{s.naicsCode} · {lineOf(s)}</div></td>
                    <td className="small">{s.renewalDate}</td>
                    <td><span className={"badge " + cls}>{lbl}</span></td>
                    <td className="small">{m < 0 ? `${Math.abs(m).toFixed(1)} ago` : m.toFixed(1)}</td>
                    <td className="small dim">{s.producer || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="small dim">No bound accounts with a renewal date yet.</div>
        )}
      </div>
      {noDate.length > 0 && (
        <div className="card">
          <h3>Bound, no renewal date ({noDate.length})</h3>
          <div className="small dim mb">These are invisible to renewal planning until a date is set.</div>
          {noDate.map((s) => (
            <div key={s.submissionId} className="small" style={{ padding: "4px 0" }}><a href="#" onClick={go(s)}>{insuredOf(s)}</a></div>
          ))}
        </div>
      )}
    </div>
  );
}
