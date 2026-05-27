import assert from "node:assert/strict";
import test from "node:test";

import { groupFollowUpsByPriority, planFollowUps } from "../src/index.mjs";

const rankedWindow = {
  accountId: "acme",
  endedAt: "2026-05-27T12:00:00Z",
  scorecard: {
    band: "hot",
    score: 86,
    reasons: ["recent activity", "positive buying signals detected"],
  },
  events: [
    {
      id: "e1",
      occurredAt: "2026-05-27T12:00:00Z",
      summary: "Security buyer asked procurement about pilot budget.",
    },
  ],
};

test("planFollowUps creates priority-aware tasks", () => {
  const [followUp] = planFollowUps([rankedWindow], { owner: "Maya" });

  assert.equal(followUp.accountId, "acme");
  assert.equal(followUp.owner, "Maya");
  assert.equal(followUp.priority, "hot");
  assert.equal(followUp.dueAt, "2026-05-27T16:00:00.000Z");
  assert.ok(followUp.talkingPoints.some(point => point.includes("recent activity")));
  assert.ok(followUp.blockers.some(blocker => blocker.term === "security"));
});

test("groupFollowUpsByPriority keeps empty groups", () => {
  const groups = groupFollowUpsByPriority(planFollowUps([rankedWindow]));

  assert.equal(groups.hot.length, 1);
  assert.deepEqual(groups.warm, []);
  assert.deepEqual(groups.watch, []);
});
