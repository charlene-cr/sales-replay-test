const REQUIRED_EVENT_FIELDS = ["accountId", "type", "occurredAt"];

export function validateReplayEvents(events) {
  if (!Array.isArray(events)) {
    return [issue("events", "events must be an array", "error")];
  }

  return events.flatMap((event, index) => validateEvent(event, index));
}

export function summarizeQualityIssues(issues) {
  const totals = issues.reduce(
    (summary, item) => {
      summary[item.severity] += 1;
      return summary;
    },
    { error: 0, warning: 0 },
  );

  return {
    ok: totals.error === 0,
    ...totals,
    messages: issues.map(item => `${item.severity.toUpperCase()} ${item.path}: ${item.message}`),
  };
}

function validateEvent(event, index) {
  const path = `events[${index}]`;
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return [issue(path, "event must be an object", "error")];
  }

  const issues = [];
  for (const field of REQUIRED_EVENT_FIELDS) {
    if (!hasText(event[field])) {
      issues.push(issue(`${path}.${field}`, "required field is missing", "error"));
    }
  }

  if (event.summary && event.summary.length > 240) {
    issues.push(issue(`${path}.summary`, "summary should be concise", "warning"));
  }

  if (event.metadata && !isPlainObject(event.metadata)) {
    issues.push(issue(`${path}.metadata`, "metadata must be an object", "error"));
  }

  if (event.occurredAt && Number.isNaN(Date.parse(event.occurredAt))) {
    issues.push(issue(`${path}.occurredAt`, "occurredAt must be a valid date", "error"));
  }

  return issues;
}

function issue(path, message, severity) {
  return { path, message, severity };
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
