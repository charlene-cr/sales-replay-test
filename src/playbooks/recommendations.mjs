import { evaluatePlaybooks, buildPlaybookContext } from "./rules.mjs";

export function recommendPlaybooks(rankedWindows, followUps, options = {}) {
  const followUpByAccount = new Map(followUps.map(followUp => [followUp.accountId, followUp]));
  return rankedWindows.map(window => {
    const followUp = followUpByAccount.get(window.accountId) ?? fallbackFollowUp(window);
    const context = buildPlaybookContext(window, followUp);
    const recommendations = evaluatePlaybooks(context, options.playbooks);
    return { accountId: window.accountId, score: context.score, band: context.band, recommendations, nextBestAction: chooseNextBestAction(recommendations, followUp) };
  });
}

export function summarizePlaybookCoverage(recommendations) {
  const coverage = { accounts: recommendations.length, withRecommendations: 0, byPlaybook: {} };
  for (const recommendation of recommendations) {
    if (recommendation.recommendations.length > 0) coverage.withRecommendations += 1;
    for (const playbook of recommendation.recommendations) coverage.byPlaybook[playbook.id] = (coverage.byPlaybook[playbook.id] ?? 0) + 1;
  }
  return coverage;
}

function chooseNextBestAction(matches, followUp) {
  return matches[0]?.actions?.[0] ?? followUp.talkingPoints?.[0] ?? followUp.subject ?? "Review account activity";
}

function fallbackFollowUp(window) {
  return { accountId: window.accountId, priority: window.scorecard?.band ?? "watch", score: window.scorecard?.score ?? 0, blockers: [], talkingPoints: [] };
}
