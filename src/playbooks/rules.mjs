import { PLAYBOOK_CATALOG } from "./catalog.mjs";

export function evaluatePlaybooks(context, playbooks = PLAYBOOK_CATALOG) {
  return playbooks
    .map(playbook => ({ playbook, result: evaluateRule(context, playbook.when) }))
    .filter(entry => entry.result.matched)
    .sort((a, b) => b.playbook.priority - a.playbook.priority)
    .map(entry => ({
      id: entry.playbook.id,
      name: entry.playbook.name,
      priority: entry.playbook.priority,
      actions: entry.playbook.actions,
      reasons: entry.result.reasons,
    }));
}

export function evaluateRule(context, rule = {}) {
  const checks = [
    matchBand(context, rule),
    matchMinScore(context, rule),
    matchMaxScore(context, rule),
    matchTerms(context, rule),
    matchBlockers(context, rule),
  ].filter(Boolean);
  const failed = checks.filter(check => !check.matched);
  return {
    matched: failed.length === 0,
    reasons: checks.filter(check => check.matched).flatMap(check => check.reasons),
    failures: failed.map(check => check.reason),
  };
}

export function buildPlaybookContext(window, followUp = {}) {
  const summaries = window.events.map(event => event.summary ?? "").join(" ").toLowerCase();
  const blockerTerms = followUp.blockers?.map(blocker => blocker.term) ?? [];
  return {
    accountId: window.accountId,
    band: window.scorecard?.band ?? followUp.priority ?? "watch",
    score: window.scorecard?.score ?? followUp.score ?? 0,
    summaries,
    blockerTerms,
    eventTypes: new Set(window.events.map(event => event.type)),
  };
}

function matchBand(context, rule) {
  if (!rule.bands) return undefined;
  const matched = rule.bands.includes(context.band);
  return { matched, reason: `band ${context.band} not in ${rule.bands.join(", ")}`, reasons: matched ? [`matched ${context.band} score band`] : [] };
}

function matchMinScore(context, rule) {
  if (rule.minScore === undefined) return undefined;
  const matched = context.score >= rule.minScore;
  return { matched, reason: `score ${context.score} below ${rule.minScore}`, reasons: matched ? [`score is at least ${rule.minScore}`] : [] };
}

function matchMaxScore(context, rule) {
  if (rule.maxScore === undefined) return undefined;
  const matched = context.score <= rule.maxScore;
  return { matched, reason: `score ${context.score} above ${rule.maxScore}`, reasons: matched ? [`score is at most ${rule.maxScore}`] : [] };
}

function matchTerms(context, rule) {
  if (!rule.terms) return undefined;
  const matchedTerms = rule.terms.filter(term => context.summaries.includes(term));
  return { matched: matchedTerms.length > 0, reason: `none of ${rule.terms.join(", ")} appeared in activity`, reasons: matchedTerms.map(term => `matched activity term: ${term}`) };
}

function matchBlockers(context, rule) {
  if (!rule.blockers) return undefined;
  const matchedBlockers = rule.blockers.filter(term => context.blockerTerms.includes(term));
  return { matched: matchedBlockers.length > 0, reason: `none of ${rule.blockers.join(", ")} appeared as blockers`, reasons: matchedBlockers.map(term => `matched blocker: ${term}`) };
}
