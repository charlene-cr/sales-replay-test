#!/usr/bin/env node
import { readFile } from "node:fs/promises";

import { buildReplayReport, formatReportSummary } from "../src/index.mjs";

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input ?? "fixtures/events.json";
const format = args.format ?? "summary";
const raw = await readFile(inputPath, "utf8");
const events = JSON.parse(raw);
const report = buildReplayReport(events, {
  now: args.now,
  lookbackDays: args.lookbackDays ? Number(args.lookbackDays) : undefined,
  owner: args.owner,
});

if (format === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(formatReportSummary(report));
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      continue;
    }
    parsed[value.slice(2)] = values[index + 1];
    index += 1;
  }
  return parsed;
}
