export function renderReplayDashboard(report, options = {}) {
  const title = options.title ?? "Sales Replay Dashboard";
  const rows = report.rankedWindows.map(renderAccountRow).join("\n");
  const followUps = Object.entries(report.followUpsByPriority)
    .flatMap(([priority, items]) => items.map(item => renderFollowUp(priority, item)))
    .join("\n");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${dashboardCss()}</style>`,
    "</head>",
    "<body>",
    `<main class="dashboard" data-generated-at="${escapeHtml(report.generatedAt)}">`,
    `<h1>${escapeHtml(title)}</h1>`,
    renderTotals(report.totals),
    "<section><h2>Top accounts</h2><table><thead><tr><th>Account</th><th>Score</th><th>Band</th><th>Events</th></tr></thead><tbody>",
    rows,
    "</tbody></table></section>",
    '<section><h2>Follow-ups</h2><ol class="followups">',
    followUps,
    "</ol></section>",
    "</main>",
    "</body>",
    "</html>",
  ].join("\n");
}

export function renderTotals(totals) {
  return `<section class="totals"><div><strong>${totals.accounts}</strong><span>Accounts</span></div><div><strong>${totals.events}</strong><span>Events</span></div><div><strong>${totals.followUps}</strong><span>Follow-ups</span></div></section>`;
}

function renderAccountRow(window) {
  return `<tr><td>${escapeHtml(window.accountId)}</td><td>${window.scorecard.score}</td><td>${escapeHtml(window.scorecard.band)}</td><td>${window.eventCount}</td></tr>`;
}

function renderFollowUp(priority, followUp) {
  return `<li data-priority="${escapeHtml(priority)}"><strong>${escapeHtml(followUp.accountId)}</strong><span>${escapeHtml(followUp.subject)}</span><time>${escapeHtml(followUp.dueAt)}</time></li>`;
}

function dashboardCss() {
  return [
    "body{font-family:system-ui,sans-serif;margin:0;background:#f7f8fb;color:#172033}",
    ".dashboard{max-width:1040px;margin:0 auto;padding:32px}",
    "h1{font-size:32px;margin:0 0 24px}",
    "h2{font-size:18px;margin:28px 0 12px}",
    ".totals{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}",
    ".totals div{background:white;border:1px solid #dfe4ee;border-radius:8px;padding:16px}",
    ".totals strong{display:block;font-size:28px}",
    "table{width:100%;border-collapse:collapse;background:white;border:1px solid #dfe4ee}",
    "th,td{text-align:left;padding:10px;border-bottom:1px solid #edf0f5}",
    ".followups{display:grid;gap:10px;padding:0;list-style:none}",
    ".followups li{display:grid;grid-template-columns:1fr 2fr auto;gap:12px;background:white;border:1px solid #dfe4ee;border-radius:8px;padding:12px}",
  ].join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
