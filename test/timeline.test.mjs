import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAccountTimelines,
  createReplayWindows,
  normalizeEvent,
  prioritizeReplayWindows,
} from "../src/index.mjs";

test("normalizeEvent trims required fields and fills defaults", () => {
  const event = normalizeEvent({
    accountId: " acme ",
    type: "demo_call",
    occurredAt: "2026-05-20T16:00:00Z",
  });

  assert.equal(event.accountId, "acme");
  assert.equal(event.actor, "unknown");
  assert.equal(event.source, "manual");
});

test("buildAccountTimelines groups and sorts events", () => {
  const timelines = buildAccountTimelines([
    {
      accountId: "acme",
      type: "email_reply",
      occurredAt: "2026-05-21T16:00:00Z",
    },
    {
      accountId: "acme",
      type: "demo_call",
      occurredAt: "2026-05-20T16:00:00Z",
    },
  ]);

  assert.equal(timelines.length, 1);
  assert.deepEqual(
    timelines[0].events.map(event => event.type),
    ["demo_call", "email_reply"],
  );
});

test("createReplayWindows excludes events outside the lookback", () => {
  const windows = createReplayWindows(
    [
      {
        accountId: "acme",
        type: "crm_note",
        occurredAt: "2026-04-01T12:00:00Z",
      },
      {
        accountId: "acme",
        type: "demo_call",
        occurredAt: "2026-05-26T12:00:00Z",
      },
    ],
    { now: "2026-05-27T12:00:00Z", lookbackDays: 14 },
  );

  assert.equal(windows.length, 1);
  assert.equal(windows[0].eventCount, 1);
});

test("prioritizeReplayWindows prefers active accounts", () => {
  const windows = prioritizeReplayWindows([
    { accountId: "beta", eventCount: 1, endedAt: "2026-05-26T12:00:00Z" },
    { accountId: "acme", eventCount: 3, endedAt: "2026-05-20T12:00:00Z" },
  ]);

  assert.equal(windows[0].accountId, "acme");
});
