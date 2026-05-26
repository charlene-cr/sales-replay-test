import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildForecastAlerts, buildForecastRollup, forecastAccount, forecastPipeline, segmentForecasts } from "../src/index.mjs";

const accounts = JSON.parse(await readFile(new URL("../fixtures/forecast-accounts.json", import.meta.url), "utf8"));

test("forecastAccount combines stage, replay, urgency, and risk", () => {
  const forecast = forecastAccount({ accountId: "acme", stage: "pilot", amount: 60000, replayScore: 86, closeDate: "2026-06-05T00:00:00Z", risks: ["security"] }, undefined, { now: "2026-05-27T12:00:00Z" });
  assert.equal(forecast.accountId, "acme");
  assert.equal(forecast.stage, "pilot");
  assert.equal(forecast.confidence, "high");
  assert.ok(forecast.expectedValue > 40000);
});

test("forecastPipeline summarizes expected value", () => {
  const pipeline = forecastPipeline(accounts, { now: "2026-05-27T12:00:00Z" });
  assert.equal(pipeline.forecasts.length, 36);
  assert.ok(pipeline.totals.pipeline > 0);
  assert.ok(pipeline.totals.expectedValue > 0);
  assert.ok(Object.keys(pipeline.totals.bySegment).length >= 3);
});

test("segmentForecasts groups forecasts by a field", () => {
  const pipeline = forecastPipeline(accounts, { now: "2026-05-27T12:00:00Z" });
  const segments = segmentForecasts(pipeline.forecasts, "segment");
  assert.equal(segments.length, 3);
  assert.ok(segments[0].expectedValue >= segments.at(-1).expectedValue);
});

test("buildForecastAlerts flags large low-confidence deals", () => {
  const pipeline = forecastPipeline(accounts, { now: "2026-05-27T12:00:00Z" });
  const alerts = buildForecastAlerts(pipeline.forecasts, { largeDealThreshold: 20000 });
  assert.ok(alerts.length > 0);
});

test("buildForecastRollup includes segments and alerts", () => {
  const rollup = buildForecastRollup(accounts, { now: "2026-05-27T12:00:00Z", segmentBy: "stage" });
  assert.equal(rollup.forecasts.length, 36);
  assert.ok(rollup.segments.length > 0);
  assert.ok(rollup.alerts.length > 0);
});
