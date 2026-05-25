import assert from "node:assert/strict";
import test from "node:test";

import { summarizeQualityIssues, validateReplayEvents } from "../src/index.mjs";

test("validateReplayEvents reports required fields", () => {
  const issues = validateReplayEvents([{ accountId: "acme" }]);

  assert.deepEqual(
    issues.map(item => item.path),
    ["events[0].type", "events[0].occurredAt"],
  );
});

test("validateReplayEvents warns on long summaries", () => {
  const issues = validateReplayEvents([
    {
      accountId: "acme",
      type: "demo_call",
      occurredAt: "2026-05-27T12:00:00Z",
      summary: "x".repeat(241),
    },
  ]);

  assert.equal(issues[0].severity, "warning");
});

test("summarizeQualityIssues marks error-free payloads as ok", () => {
  const issues = validateReplayEvents([
    {
      accountId: "acme",
      type: "demo_call",
      occurredAt: "2026-05-27T12:00:00Z",
    },
  ]);
  const summary = summarizeQualityIssues(issues);

  assert.equal(summary.ok, true);
  assert.equal(summary.error, 0);
});
