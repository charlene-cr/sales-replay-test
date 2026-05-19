const SECTION_ALIASES = new Map([
  ["pain", "painPoints"],
  ["pain points", "painPoints"],
  ["objections", "objections"],
  ["risks", "objections"],
  ["next steps", "nextSteps"],
  ["actions", "nextSteps"],
  ["questions", "questions"],
]);

export function parseTranscript(text) {
  if (typeof text !== "string" || text.trim() === "") {
    throw new TypeError("transcript text must be a non-empty string");
  }

  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const result = {
    summary: [],
    painPoints: [],
    objections: [],
    nextSteps: [],
    questions: [],
    speakers: new Set(),
  };
  let activeSection = "summary";

  for (const line of lines) {
    const section = parseSectionHeading(line);
    if (section) {
      activeSection = section;
      continue;
    }

    const speakerEntry = parseSpeakerLine(line);
    if (speakerEntry) {
      result.speakers.add(speakerEntry.speaker);
      appendTranscriptItem(result, activeSection, speakerEntry.text);
      continue;
    }

    appendTranscriptItem(result, activeSection, stripListMarker(line));
  }

  return {
    summary: result.summary,
    painPoints: result.painPoints,
    objections: result.objections,
    nextSteps: result.nextSteps,
    questions: result.questions,
    speakers: [...result.speakers].sort(),
  };
}

export function transcriptToEvents(accountId, transcript, options = {}) {
  const parsed = parseTranscript(transcript);
  const occurredAt = options.occurredAt ?? new Date().toISOString();
  const actor = parsed.speakers[0] ?? "sales";
  const events = [];

  if (parsed.summary.length > 0) {
    events.push({
      accountId,
      type: "demo_call",
      occurredAt,
      actor,
      summary: parsed.summary.join(" "),
      metadata: { speakers: parsed.speakers },
    });
  }

  for (const objection of parsed.objections) {
    events.push({
      accountId,
      type: "crm_note",
      occurredAt,
      actor: "sales",
      summary: `Objection: ${objection}`,
      metadata: { source: "transcript" },
    });
  }

  for (const nextStep of parsed.nextSteps) {
    events.push({
      accountId,
      type: "crm_note",
      occurredAt,
      actor: "sales",
      summary: `Next step: ${nextStep}`,
      metadata: { source: "transcript" },
    });
  }

  return events;
}

function parseSectionHeading(line) {
  const normalized = line.replace(/:$/, "").toLowerCase();
  return SECTION_ALIASES.get(normalized);
}

function parseSpeakerLine(line) {
  const match = /^(?<speaker>[A-Z][A-Za-z .'-]{1,40}):\s*(?<text>.+)$/.exec(line);
  if (!match?.groups) {
    return undefined;
  }

  return {
    speaker: match.groups.speaker.trim(),
    text: match.groups.text.trim(),
  };
}

function appendTranscriptItem(result, section, value) {
  const item = stripListMarker(value);
  if (!item) {
    return;
  }

  result[section].push(item);
}

function stripListMarker(line) {
  return line.replace(/^[-*]\s+/, "").trim();
}
