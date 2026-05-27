import assert from "node:assert/strict";
import test from "node:test";

import { rankReplayWindows, scoreReplayWindow } from "../src/index.mjs";

const hotWindow = {
  accountId: "acme",
  endedAt: "2026-05-27T10:00:00Z",
  events: [
    {
      type: "demo_call",
      summary: "Security stakeholder asked about pilot timeline and budget.",
    },
    {
      type: "email_reply",
      summary: "Procurement requested integration details.",
    },
  ],
};

test("scoreReplayWindow identifies hot accounts", () => {
  const scorecard = scoreReplayWindow(hotWindow, { now: "2026-05-27T12:00:00Z" });

  assert.equal(scorecard.accountId, "acme");
  assert.equal(scorecard.band, "hot");
  assert.ok(scorecard.score >= 75);
  assert.ok(scorecard.reasons.includes("positive buying signals detected"));
});

test("scoreReplayWindow subtracts risk terms", () => {
  const scorecard = scoreReplayWindow(
    {
      accountId: "beta",
      endedAt: "2026-05-27T10:00:00Z",
      events: [
        {
          type: "crm_note",
          summary: "Legal concern and pricing risk may delay rollout.",
        },
      ],
    },
    { now: "2026-05-27T12:00:00Z" },
  );

  assert.equal(scorecard.band, "watch");
  assert.ok(scorecard.reasons.includes("risk terms reduced the score"));
});

test("rankReplayWindows sorts by score", () => {
  const ranked = rankReplayWindows(
    [
      {
        accountId: "quiet",
        endedAt: "2026-05-20T10:00:00Z",
        events: [{ type: "crm_note", summary: "No update." }],
      },
      hotWindow,
    ],
    { now: "2026-05-27T12:00:00Z" },
  );

  assert.equal(ranked[0].accountId, "acme");
});
