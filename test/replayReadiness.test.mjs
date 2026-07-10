import assert from "node:assert/strict";
import test from "node:test";
import {
  enterpriseReplayReadinessSignals,
  summarizeReplayReadiness,
} from "../src/replayReadiness.mjs";

test("summarizes replay readiness fixture with review status", () => {
  const summary = summarizeReplayReadiness(enterpriseReplayReadinessSignals);

  assert.equal(summary.score, 88);
  assert.equal(summary.status, "needs-review");
  assert.deepEqual(summary.blockers, []);
  assert.deepEqual(summary.warnings, ["Decision criteria captured"]);
});

test("blocked readiness signals override the score status", () => {
  const summary = summarizeReplayReadiness([
    {
      name: "Source call verified",
      state: "ready",
      weight: 3,
      note: "Transcript and call recording match.",
    },
    {
      name: "Customer consent confirmed",
      state: "blocked",
      weight: 3,
      note: "Consent record is missing from the workspace handoff.",
    },
  ]);

  assert.equal(summary.status, "blocked");
  assert.deepEqual(summary.blockers, ["Customer consent confirmed"]);
});

test("empty readiness signals produce an explicit blocker", () => {
  assert.deepEqual(summarizeReplayReadiness([]), {
    score: 0,
    status: "blocked",
    blockers: ["No readiness signals"],
    warnings: [],
  });
});
