import { createReplayWindows, prioritizeReplayWindows } from "./timeline.mjs";
import { rankReplayWindows } from "./scoring.mjs";
import { groupFollowUpsByPriority, planFollowUps } from "./followUpPlanner.mjs";

export function buildReplayReport(events, options = {}) {
  const windows = createReplayWindows(events, options);
  const rankedWindows = rankReplayWindows(prioritizeReplayWindows(windows), options);
  const followUps = planFollowUps(rankedWindows, options);

  return {
    generatedAt: new Date(options.now ?? Date.now()).toISOString(),
    lookbackDays: options.lookbackDays ?? 14,
    totals: {
      accounts: rankedWindows.length,
      events: rankedWindows.reduce((total, window) => total + window.events.length, 0),
      followUps: followUps.length,
    },
    rankedWindows: rankedWindows.map(window => ({
      accountId: window.accountId,
      startedAt: window.startedAt,
      endedAt: window.endedAt,
      eventCount: window.eventCount,
      scorecard: window.scorecard,
    })),
    followUpsByPriority: groupFollowUpsByPriority(followUps),
  };
}

export function formatReportSummary(report) {
  const lines = [
    `Sales replay report generated at ${report.generatedAt}`,
    `Lookback: ${report.lookbackDays} days`,
    `Accounts: ${report.totals.accounts}`,
    `Events: ${report.totals.events}`,
    `Follow-ups: ${report.totals.followUps}`,
    "",
    "Top accounts:",
  ];

  for (const window of report.rankedWindows.slice(0, 5)) {
    lines.push(
      `- ${window.accountId}: ${window.scorecard.score} (${window.scorecard.band}), ${window.eventCount} events`,
    );
  }

  return lines.join("\n");
}
