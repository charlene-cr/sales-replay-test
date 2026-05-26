const ALLOWED_ACTIONS = new Set(["event_imported", "window_scored", "follow_up_planned", "playbook_recommended", "forecast_generated", "report_exported"]);

export function createAuditEntry(action, payload, options = {}) {
  if (!ALLOWED_ACTIONS.has(action)) throw new RangeError(`unsupported audit action: ${action}`);
  const occurredAt = new Date(options.occurredAt ?? Date.now()).toISOString();
  const actor = options.actor ?? "system";
  const resource = normalizeResource(payload.resource ?? payload.accountId ?? "unknown");
  const changes = normalizeChanges(payload.changes ?? payload);
  return { id: options.id ?? buildAuditId(action, resource, occurredAt), action, actor, occurredAt, resource, changes, hash: hashEntry({ action, actor, occurredAt, resource, changes }) };
}

export function appendAuditEntry(log, entry) {
  const previous = log.at(-1);
  const { hash, ...entryWithoutHash } = entry;
  const chainedEntry = { ...entryWithoutHash, previousHash: previous?.hash ?? null };
  return [...log, { ...chainedEntry, hash: hashEntry(chainedEntry) }];
}

export function verifyAuditLog(log) {
  const issues = [];
  for (let index = 0; index < log.length; index += 1) {
    const entry = log[index];
    const expectedPreviousHash = index === 0 ? null : log[index - 1].hash;
    if ((entry.previousHash ?? null) !== expectedPreviousHash) issues.push({ index, message: "previous hash does not match" });
    const { hash, ...withoutHash } = entry;
    const expectedHash = hashEntry(withoutHash);
    if (hash !== expectedHash) issues.push({ index, message: "entry hash does not match" });
  }
  return { ok: issues.length === 0, issues };
}

export function redactAuditLog(log, fields = ["email", "phone", "token"]) {
  return log.map(entry => ({ ...entry, changes: redactValue(entry.changes, new Set(fields)) }));
}

function normalizeResource(value) { return typeof value === "string" && value.trim() !== "" ? value.trim() : "unknown"; }
function normalizeChanges(value) { return !value || typeof value !== "object" || Array.isArray(value) ? { value } : sortObject(value); }
function redactValue(value, fields) { if (Array.isArray(value)) return value.map(item => redactValue(item, fields)); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fields.has(key.toLowerCase()) ? "[REDACTED]" : redactValue(item, fields)])); return value; }
function sortObject(value) { if (Array.isArray(value)) return value.map(sortObject); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sortObject(item)])); return value; }
function buildAuditId(action, resource, occurredAt) { return `${action}:${resource}:${occurredAt}`; }
function hashEntry(entry) { const input = JSON.stringify(sortObject(entry)); let hash = 2166136261; for (let index = 0; index < input.length; index += 1) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); }
