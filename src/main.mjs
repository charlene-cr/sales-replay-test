import { createReplayWindows, prioritizeReplayWindows } from "./timeline.mjs";

const demoEvents = [
  {
    accountId: "acme",
    type: "demo_call",
    occurredAt: "2026-05-20T16:00:00Z",
    actor: "Nina",
    summary: "Walked through pull request analytics.",
  },
  {
    accountId: "acme",
    type: "email_reply",
    occurredAt: "2026-05-21T18:30:00Z",
    actor: "buyer",
    summary: "Asked for security review examples.",
  },
];

const windows = prioritizeReplayWindows(
  createReplayWindows(demoEvents, { now: "2026-05-27T12:00:00Z" }),
);

console.log(JSON.stringify(windows, null, 2));
