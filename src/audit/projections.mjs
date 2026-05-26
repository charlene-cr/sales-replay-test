import { appendAuditEntry, createAuditEntry } from "./log.mjs";

export function auditReplayReport(report, options = {}) {
  let log = [];
  for (const window of report.rankedWindows) {
    log = appendAuditEntry(log, createAuditEntry("window_scored", { accountId: window.accountId, changes: { score: window.scorecard.score, band: window.scorecard.band, eventCount: window.eventCount } }, options));
  }
  for (const [priority, followUps] of Object.entries(report.followUpsByPriority)) {
    for (const followUp of followUps) {
      log = appendAuditEntry(log, createAuditEntry("follow_up_planned", { accountId: followUp.accountId, changes: { priority, dueAt: followUp.dueAt, subject: followUp.subject } }, options));
    }
  }
  return log;
}

export function summarizeAuditLog(log) {
  return log.reduce((summary, entry) => { summary.total += 1; summary.byAction[entry.action] = (summary.byAction[entry.action] ?? 0) + 1; summary.byActor[entry.actor] = (summary.byActor[entry.actor] ?? 0) + 1; summary.resources.add(entry.resource); return summary; }, { total: 0, byAction: {}, byActor: {}, resources: new Set() });
}

export function serializeAuditSummary(summary) { return { total: summary.total, byAction: summary.byAction, byActor: summary.byActor, resources: [...summary.resources].sort() }; }
