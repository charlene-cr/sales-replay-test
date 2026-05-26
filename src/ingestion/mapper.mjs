import { normalizeEvent } from "../events.mjs";
import { validateReplayEvents } from "../dataQuality.mjs";
import { parseCsv } from "./csv.mjs";

const KNOWN_COLUMNS = new Set([
  "accountId",
  "type",
  "occurredAt",
  "actor",
  "source",
  "summary",
  "metadata",
  "externalId",
  "opportunityStage",
  "amount",
]);

export function ingestCsvEvents(text, options = {}) {
  const records = parseCsv(text, options.csv);
  const mapped = records.map(record => mapRecordToEvent(record, options));
  const issues = validateReplayEvents(mapped).map(issue => ({
    ...issue,
    source: "csv",
  }));
  const events = [];

  for (const event of mapped) {
    try {
      events.push(normalizeEvent(event));
    } catch (error) {
      issues.push({
        path: `events[${events.length}]`,
        message: error.message,
        severity: "error",
        source: "normalization",
      });
    }
  }

  return {
    events,
    issues,
    stats: buildStats(records, events, issues),
  };
}

export function mapRecordToEvent(record, options = {}) {
  const metadata = parseMetadata(record.metadata);
  const extraColumns = collectExtraColumns(record);
  const event = {
    accountId: pick(record, "accountId", "account_id", "account"),
    type: pick(record, "type", "eventType", "event_type") ?? options.defaultType ?? "crm_note",
    occurredAt: pick(record, "occurredAt", "occurred_at", "timestamp", "date"),
    actor: pick(record, "actor", "owner", "rep"),
    source: pick(record, "source") ?? options.defaultSource ?? "csv",
    summary: pick(record, "summary", "note", "body", "description"),
    metadata: {
      ...metadata,
      ...extraColumns,
    },
  };

  if (record.externalId) {
    event.id = record.externalId;
  }

  return event;
}

export function mergeIngestionResults(results) {
  const events = [];
  const issues = [];
  const sourceStats = {};

  for (const result of results) {
    events.push(...result.events);
    issues.push(...result.issues);
    for (const [source, count] of Object.entries(result.stats.bySource)) {
      sourceStats[source] = (sourceStats[source] ?? 0) + count;
    }
  }

  return {
    events,
    issues,
    stats: {
      accepted: events.length,
      rejected: issues.filter(issue => issue.severity === "error").length,
      warnings: issues.filter(issue => issue.severity === "warning").length,
      bySource: sourceStats,
    },
  };
}

function buildStats(records, events, issues) {
  const bySource = {};
  for (const event of events) {
    bySource[event.source] = (bySource[event.source] ?? 0) + 1;
  }

  return {
    rows: records.length,
    accepted: events.length,
    rejected: issues.filter(issue => issue.severity === "error").length,
    warnings: issues.filter(issue => issue.severity === "warning").length,
    bySource,
  };
}

function pick(record, ...keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

function parseMetadata(value) {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : { rawMetadata: value };
  } catch {
    return { rawMetadata: value };
  }
}

function collectExtraColumns(record) {
  const extras = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("_") || KNOWN_COLUMNS.has(key) || value === "") {
      continue;
    }
    extras[key] = value;
  }
  return extras;
}
