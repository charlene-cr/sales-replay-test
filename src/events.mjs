const ALLOWED_EVENT_TYPES = new Set([
  "demo_call",
  "email_reply",
  "crm_note",
  "pull_request",
]);

export function normalizeEvent(raw) {
  if (!raw || typeof raw !== "object") {
    throw new TypeError("event must be an object");
  }

  const accountId = requiredString(raw.accountId, "accountId");
  const occurredAt = normalizeDate(raw.occurredAt);
  const type = requiredString(raw.type, "type");

  if (!ALLOWED_EVENT_TYPES.has(type)) {
    throw new RangeError(`unsupported event type: ${type}`);
  }

  return {
    id: optionalString(raw.id) ?? `${accountId}:${type}:${occurredAt}`,
    accountId,
    type,
    occurredAt,
    actor: optionalString(raw.actor) ?? "unknown",
    source: optionalString(raw.source) ?? "manual",
    summary: optionalString(raw.summary) ?? "",
    metadata: normalizeMetadata(raw.metadata),
  };
}

export function eventSort(a, b) {
  const byDate = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);
  if (byDate !== 0) {
    return byDate;
  }

  return a.id.localeCompare(b.id);
}

export function summarizeEvent(event) {
  const actor = event.actor === "unknown" ? "Someone" : event.actor;
  const summary = event.summary ? `: ${event.summary}` : "";
  return `${actor} recorded ${event.type}${summary}`;
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("occurredAt must be a valid date");
  }

  return date.toISOString();
}

function normalizeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
}

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }

  return value.trim();
}

function optionalString(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
