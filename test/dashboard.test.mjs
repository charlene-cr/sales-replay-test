import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildDashboardViewModel, classifyHealth, renderReplayDashboard, renderTotals } from "../src/index.mjs";
const report = JSON.parse(await readFile(new URL("../fixtures/dashboard-report.json", import.meta.url), "utf8"));
test("renderTotals includes account, event, and follow-up totals", () => { const html = renderTotals(report.totals); assert.match(html, /Accounts/); assert.match(html, /Events/); assert.match(html, /Follow-ups/); });
test("renderReplayDashboard renders an escaped complete document", () => { const html = renderReplayDashboard(report, { title: "Replay <Dashboard>" }); assert.match(html, /<!doctype html>/); assert.match(html, /Replay &lt;Dashboard&gt;/); assert.match(html, /acct-01/); assert.doesNotMatch(html, /<Dashboard>/); });
test("buildDashboardViewModel limits top accounts", () => { const model = buildDashboardViewModel(report); assert.equal(model.topAccounts.length, 10); assert.equal(model.followUps.length, 40); });
test("classifyHealth marks active reports", () => { assert.equal(classifyHealth(report), "active"); });
