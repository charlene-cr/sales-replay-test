export function buildDashboardViewModel(report) {
  return { generatedAt: report.generatedAt, health: classifyHealth(report), topAccounts: report.rankedWindows.slice(0, 10).map(window => ({ accountId: window.accountId, score: window.scorecard.score, band: window.scorecard.band, eventCount: window.eventCount })), followUps: Object.entries(report.followUpsByPriority).flatMap(([priority, items]) => items.map(item => ({ ...item, priority }))) };
}
export function classifyHealth(report) {
  const hotCount = report.rankedWindows.filter(window => window.scorecard.band === "hot").length;
  if (hotCount >= 3) return "active";
  if (report.totals.followUps > report.totals.accounts) return "needs-attention";
  return "steady";
}
