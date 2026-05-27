import assert from "node:assert/strict";
import test from "node:test";

import { parseTranscript, transcriptToEvents } from "../src/index.mjs";

const transcript = `
Nina: Buyer wants to validate security review coverage.
Buyer: We need examples for SOC2 and pull request workflows.
Pain Points:
- Manual review summaries are inconsistent.
Objections:
- Pricing needs procurement approval.
Next Steps:
- Send enterprise pilot plan by Friday.
Questions:
- Can CodeRabbit show audit evidence?
`;

test("parseTranscript extracts sections and speakers", () => {
  const parsed = parseTranscript(transcript);

  assert.deepEqual(parsed.speakers, ["Buyer", "Nina"]);
  assert.equal(parsed.summary.length, 2);
  assert.equal(parsed.painPoints[0], "Manual review summaries are inconsistent.");
  assert.equal(parsed.objections[0], "Pricing needs procurement approval.");
  assert.equal(parsed.nextSteps[0], "Send enterprise pilot plan by Friday.");
  assert.equal(parsed.questions[0], "Can CodeRabbit show audit evidence?");
});

test("transcriptToEvents creates replay events", () => {
  const events = transcriptToEvents("acme", transcript, {
    occurredAt: "2026-05-27T12:00:00Z",
  });

  assert.equal(events.length, 3);
  assert.equal(events[0].type, "demo_call");
  assert.match(events[1].summary, /^Objection:/);
  assert.match(events[2].summary, /^Next step:/);
});

test("parseTranscript rejects empty input", () => {
  assert.throws(() => parseTranscript("   "), /non-empty string/);
});
