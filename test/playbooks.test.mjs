import assert from "node:assert/strict";
import test from "node:test";

import { PLAYBOOK_CATALOG, buildPlaybookContext, evaluatePlaybooks, evaluateRule, recommendPlaybooks, summarizePlaybookCoverage } from "../src/index.mjs";

const hotWindow = { accountId: "acme", scorecard: { band: "hot", score: 88 }, events: [{ type: "demo_call", summary: "Security stakeholder wants a pilot and procurement package." }] };
const hotFollowUp = { accountId: "acme", priority: "hot", score: 88, blockers: [{ term: "procurement" }, { term: "security" }], talkingPoints: ["Reason: recent activity"] };

test("catalog contains a broad set of sales motions", () => {
  assert.equal(PLAYBOOK_CATALOG.length, 28);
  assert.ok(PLAYBOOK_CATALOG.every(playbook => playbook.actions.length >= 3));
});

test("evaluateRule returns reasons for matched rules", () => {
  const result = evaluateRule({ band: "hot", score: 88, summaries: "security pilot requested", blockerTerms: ["security"] }, { bands: ["hot"], terms: ["security"], blockers: ["security"], minScore: 70 });
  assert.equal(result.matched, true);
  assert.ok(result.reasons.includes("matched hot score band"));
  assert.ok(result.reasons.includes("score is at least 70"));
});

test("evaluateRule explains failed rules", () => {
  const result = evaluateRule({ band: "watch", score: 20, summaries: "quiet account", blockerTerms: [] }, { bands: ["hot"], minScore: 70, terms: ["security"] });
  assert.equal(result.matched, false);
  assert.equal(result.failures.length, 3);
});

test("buildPlaybookContext combines window and follow-up signals", () => {
  const context = buildPlaybookContext(hotWindow, hotFollowUp);
  assert.equal(context.accountId, "acme");
  assert.equal(context.band, "hot");
  assert.equal(context.score, 88);
  assert.ok(context.summaries.includes("security"));
  assert.deepEqual(context.blockerTerms, ["procurement", "security"]);
});

test("evaluatePlaybooks sorts matches by priority", () => {
  const matches = evaluatePlaybooks(buildPlaybookContext(hotWindow, hotFollowUp));
  assert.ok(matches.length > 0);
  assert.ok(matches[0].priority >= matches.at(-1).priority);
});

test("recommendPlaybooks chooses next best actions", () => {
  const [recommendation] = recommendPlaybooks([hotWindow], [hotFollowUp]);
  assert.equal(recommendation.accountId, "acme");
  assert.ok(recommendation.nextBestAction.length > 0);
  assert.ok(recommendation.recommendations.length > 0);
});

test("summarizePlaybookCoverage counts matched playbooks", () => {
  const coverage = summarizePlaybookCoverage(recommendPlaybooks([hotWindow], [hotFollowUp]));
  assert.equal(coverage.accounts, 1);
  assert.equal(coverage.withRecommendations, 1);
});
test("catalog playbook 1 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[0]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 2 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[1]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 3 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[2]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 4 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[3]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 5 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[4]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 6 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[5]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 7 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[6]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 8 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[7]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 9 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[8]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 10 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[9]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 11 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[10]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 12 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[11]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 13 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[12]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 14 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[13]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 15 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[14]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 16 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[15]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 17 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[16]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
test("catalog playbook 18 has reviewable fields", () => { const playbook = PLAYBOOK_CATALOG[17]; assert.ok(playbook.id); assert.ok(playbook.name); assert.ok(playbook.when); assert.ok(playbook.actions.length >= 3); });
