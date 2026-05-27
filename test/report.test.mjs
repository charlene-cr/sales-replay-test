import assert from "node:assert/strict";
import test from "node:test";

import { buildReplayReport, formatReportSummary } from "../src/index.mjs";

const events = [
  {
    accountId: "acme",
    type: "demo_call",
    occurredAt: "2026-05-25T16:00:00Z",
    actor: "Nina",
    summary: "Security stakeholder asked about procurement and pilot timeline.",
  },
  {
    accountId: "acme",
    type: "email_reply",
    occurredAt: "2026-05-26T16:00:00Z",
    actor: "buyer",
    summary: "Budget owner requested integration details.",
  },
];

test("buildReplayReport composes windows, scores, and follow-ups", () => {
  const report = buildReplayReport(events, { now: "2026-05-27T12:00:00Z" });

  assert.equal(report.totals.accounts, 1);
  assert.equal(report.totals.events, 2);
  assert.equal(report.followUpsByPriority.hot.length, 1);
  assert.equal(report.rankedWindows[0].accountId, "acme");
});

test("formatReportSummary returns a readable text report", () => {
  const report = buildReplayReport(events, { now: "2026-05-27T12:00:00Z" });
  const summary = formatReportSummary(report);

  assert.match(summary, /Sales replay report generated/);
  assert.match(summary, /Top accounts/);
  assert.match(summary, /acme/);
});
