const TYPE_WEIGHTS = {
  demo_call: 35,
  email_reply: 20,
  pull_request: 15,
  crm_note: 8,
};

const POSITIVE_TERMS = [
  "budget",
  "security",
  "pilot",
  "procurement",
  "timeline",
  "stakeholder",
  "integration",
];

const RISK_TERMS = [
  "blocked",
  "competitor",
  "concern",
  "delay",
  "legal",
  "pricing",
  "risk",
];

export function scoreReplayWindow(window, options = {}) {
  const now = new Date(options.now ?? window.endedAt);
  const eventScore = window.events.reduce(
    (total, event) => total + (TYPE_WEIGHTS[event.type] ?? 5),
    0,
  );
  const recencyScore = scoreRecency(window.endedAt, now);
  const signalScore = window.events.reduce(
    (total, event) => total + scoreTextSignals(event.summary),
    0,
  );
  const riskPenalty = window.events.reduce(
    (total, event) => total + scoreRiskPenalty(event.summary),
    0,
  );
  const total = clamp(eventScore + recencyScore + signalScore - riskPenalty, 0, 100);

  return {
    accountId: window.accountId,
    score: total,
    band: scoreBand(total),
    reasons: buildReasons({ eventScore, recencyScore, signalScore, riskPenalty }),
  };
}

export function rankReplayWindows(windows, options = {}) {
  return windows
    .map(window => ({ ...window, scorecard: scoreReplayWindow(window, options) }))
    .sort((a, b) => b.scorecard.score - a.scorecard.score);
}

function scoreRecency(endedAt, now) {
  const ageHours = Math.max(0, now.getTime() - Date.parse(endedAt)) / 3_600_000;
  if (ageHours <= 24) {
    return 25;
  }
  if (ageHours <= 72) {
    return 15;
  }
  if (ageHours <= 168) {
    return 8;
  }
  return 0;
}

function scoreTextSignals(text = "") {
  const normalized = text.toLowerCase();
  return POSITIVE_TERMS.reduce(
    (score, term) => score + (normalized.includes(term) ? 6 : 0),
    0,
  );
}

function scoreRiskPenalty(text = "") {
  const normalized = text.toLowerCase();
  return RISK_TERMS.reduce(
    (score, term) => score + (normalized.includes(term) ? 5 : 0),
    0,
  );
}

function buildReasons(parts) {
  const reasons = [];
  if (parts.eventScore >= 45) {
    reasons.push("multiple meaningful customer touches");
  }
  if (parts.recencyScore >= 15) {
    reasons.push("recent activity");
  }
  if (parts.signalScore > 0) {
    reasons.push("positive buying signals detected");
  }
  if (parts.riskPenalty > 0) {
    reasons.push("risk terms reduced the score");
  }
  return reasons;
}

function scoreBand(score) {
  if (score >= 75) {
    return "hot";
  }
  if (score >= 45) {
    return "warm";
  }
  return "watch";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
