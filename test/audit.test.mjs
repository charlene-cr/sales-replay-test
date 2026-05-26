import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { appendAuditEntry, auditReplayReport, createAuditEntry, redactAuditLog, serializeAuditSummary, summarizeAuditLog, verifyAuditLog } from "../src/index.mjs";

const fixtureEvents = JSON.parse(await readFile(new URL("../fixtures/audit-events.json", import.meta.url), "utf8"));

test("createAuditEntry validates actions and hashes content", () => {
  const entry = createAuditEntry("event_imported", { accountId: "acme", changes: { type: "demo_call" } }, { occurredAt: "2026-05-27T12:00:00Z", actor: "Nina" });
  assert.equal(entry.action, "event_imported"); assert.equal(entry.actor, "Nina"); assert.equal(entry.resource, "acme"); assert.match(entry.hash, /^[0-9a-f]{8}$/);
});

test("appendAuditEntry creates a verifiable chain", () => {
  const log = fixtureEvents.slice(0, 12).reduce((entries, event, index) => appendAuditEntry(entries, createAuditEntry(event.action, event, { occurredAt: `2026-05-27T12:${String(index).padStart(2, "0")}:00Z`, actor: event.actor })), []);
  assert.equal(log[0].previousHash, null); assert.equal(log[1].previousHash, log[0].hash); assert.equal(verifyAuditLog(log).ok, true);
});

test("verifyAuditLog detects tampering", () => {
  const entry = createAuditEntry("event_imported", { accountId: "acme" }, { occurredAt: "2026-05-27T12:00:00Z" });
  const tampered = [{ ...appendAuditEntry([], entry)[0], resource: "beta" }];
  assert.equal(verifyAuditLog(tampered).ok, false);
});

test("redactAuditLog hides configured sensitive fields", () => {
  const entry = createAuditEntry("report_exported", { accountId: "acme", changes: { email: "buyer@example.com", nested: { token: "secret" } } }, { occurredAt: "2026-05-27T12:00:00Z" });
  const [redacted] = redactAuditLog([entry]);
  assert.equal(redacted.changes.email, "[REDACTED]"); assert.equal(redacted.changes.nested.token, "[REDACTED]");
});

test("auditReplayReport emits entries for scores and follow-ups", () => {
  const log = auditReplayReport({ rankedWindows: [{ accountId: "acme", eventCount: 2, scorecard: { score: 88, band: "hot" } }], followUpsByPriority: { hot: [{ accountId: "acme", dueAt: "2026-05-27T16:00:00Z", subject: "Next steps for acme" }], warm: [], watch: [] } }, { occurredAt: "2026-05-27T12:00:00Z", actor: "system" });
  assert.equal(log.length, 2); assert.equal(verifyAuditLog(log).ok, true);
});

test("summarizeAuditLog serializes resource sets", () => {
  const log = fixtureEvents.slice(0, 8).reduce((entries, event, index) => appendAuditEntry(entries, createAuditEntry(event.action, event, { occurredAt: `2026-05-27T13:${String(index).padStart(2, "0")}:00Z` })), []);
  const summary = serializeAuditSummary(summarizeAuditLog(log));
  assert.equal(summary.total, 8); assert.ok(summary.resources.includes("acct-01")); assert.ok(summary.byAction.event_imported > 0);
});
