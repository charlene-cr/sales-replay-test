import assert from "node:assert/strict";
import test from "node:test";

import {
  ingestCsvEvents,
  mapRecordToEvent,
  mergeIngestionResults,
  parseCsv,
  stringifyCsv,
} from "../src/index.mjs";

const csv = `accountId,type,occurredAt,actor,source,summary,opportunityStage
acme,demo_call,2026-05-25T16:00:00Z,Nina,zoom,"Security stakeholder asked about procurement, pilot timeline, and budget.",evaluation
beta,email_reply,2026-05-26T12:00:00Z,Maya,gmail,"Buyer asked whether legal can review terms this week.",negotiation
`;

test("parseCsv handles headers and quoted values", () => {
  const rows = parseCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].accountId, "acme");
  assert.match(rows[0].summary, /procurement, pilot timeline/);
  assert.equal(rows[0]._lineNumber, 2);
});

test("stringifyCsv escapes commas and quotes", () => {
  const text = stringifyCsv([{ accountId: "acme", summary: "Buyer said \"send pricing, please\"" }], ["accountId", "summary"]);
  assert.match(text, /"Buyer said ""send pricing, please"""/);
});

test("mapRecordToEvent preserves extra columns in metadata", () => {
  const event = mapRecordToEvent({ accountId: "acme", occurredAt: "2026-05-25T16:00:00Z", summary: "Asked for security package.", opportunityStage: "evaluation" });
  assert.equal(event.type, "crm_note");
  assert.equal(event.metadata.opportunityStage, "evaluation");
});

test("ingestCsvEvents normalizes imported rows", () => {
  const result = ingestCsvEvents(csv);
  assert.equal(result.events.length, 2);
  assert.equal(result.issues.length, 0);
  assert.equal(result.stats.accepted, 2);
  assert.equal(result.stats.bySource.zoom, 1);
});

test("ingestCsvEvents reports invalid rows", () => {
  const result = ingestCsvEvents("accountId,type,occurredAt\n,unknown,nope\n");
  assert.equal(result.events.length, 0);
  assert.ok(result.issues.some(issue => issue.severity === "error"));
});

test("mergeIngestionResults combines stats", () => {
  const first = ingestCsvEvents(csv);
  const second = ingestCsvEvents("accountId,type,occurredAt,source\ngamma,crm_note,2026-05-26T12:00:00Z,manual\n");
  const merged = mergeIngestionResults([first, second]);
  assert.equal(merged.events.length, 3);
  assert.equal(merged.stats.bySource.manual, 1);
});
