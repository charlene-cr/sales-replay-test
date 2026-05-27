const DEFAULT_STAGE_PROBABILITIES = { discovery: 0.18, evaluation: 0.35, pilot: 0.52, negotiation: 0.68, procurement: 0.74, closed_won: 1, closed_lost: 0 };

export function forecastPipeline(accounts, options = {}) {
  const stageProbabilities = { ...DEFAULT_STAGE_PROBABILITIES, ...options.stageProbabilities };
  const forecasts = accounts.map(account => forecastAccount(account, stageProbabilities, options));
  return { generatedAt: new Date(options.now ?? Date.now()).toISOString(), totals: summarizeForecasts(forecasts), forecasts: forecasts.sort((a, b) => b.expectedValue - a.expectedValue) };
}

export function forecastAccount(account, stageProbabilities = DEFAULT_STAGE_PROBABILITIES, options = {}) {
  const amount = Number(account.amount ?? 0);
  const baseProbability = stageProbabilities[normalizeStage(account.stage)] ?? 0.1;
  const replayAdjustment = scoreReplayAdjustment(account.replayScore ?? 0);
  const riskAdjustment = scoreRiskAdjustment(account.risks ?? []);
  const urgencyAdjustment = scoreUrgency(account.closeDate, options.now);
  const probability = clamp(baseProbability + replayAdjustment + urgencyAdjustment - riskAdjustment, 0, 1);
  return { accountId: account.accountId, name: account.name ?? account.accountId, segment: account.segment ?? "commercial", stage: normalizeStage(account.stage), amount, probability, expectedValue: roundCurrency(amount * probability), confidence: confidenceBand(probability, account), drivers: buildDrivers({ baseProbability, replayAdjustment, riskAdjustment, urgencyAdjustment }) };
}

export function summarizeForecasts(forecasts) {
  return forecasts.reduce((totals, forecast) => {
    totals.pipeline += forecast.amount;
    totals.expectedValue += forecast.expectedValue;
    totals.byStage[forecast.stage] = (totals.byStage[forecast.stage] ?? 0) + forecast.expectedValue;
    totals.bySegment[forecast.segment] = (totals.bySegment[forecast.segment] ?? 0) + forecast.expectedValue;
    totals.byConfidence[forecast.confidence] = (totals.byConfidence[forecast.confidence] ?? 0) + 1;
    return totals;
  }, { pipeline: 0, expectedValue: 0, byStage: {}, bySegment: {}, byConfidence: { high: 0, medium: 0, low: 0 } });
}

function scoreReplayAdjustment(score) { if (score >= 80) return 0.18; if (score >= 60) return 0.1; if (score >= 40) return 0.04; return -0.04; }
function scoreRiskAdjustment(risks) { const weights = { legal: 0.08, pricing: 0.07, competitor: 0.1, security: 0.04, procurement: 0.05 }; return risks.reduce((total, risk) => total + (weights[risk] ?? 0.03), 0); }
function scoreUrgency(closeDate, nowValue) { if (!closeDate) return 0; const now = new Date(nowValue ?? Date.now()); const close = new Date(closeDate); if (Number.isNaN(close.getTime())) return 0; const days = (close.getTime() - now.getTime()) / 86400000; if (days < 0) return -0.1; if (days <= 14) return 0.06; if (days <= 45) return 0.03; return 0; }
function buildDrivers(parts) { const drivers = [`base stage probability ${formatPercent(parts.baseProbability)}`]; if (parts.replayAdjustment > 0) drivers.push(`replay activity added ${formatPercent(parts.replayAdjustment)}`); else if (parts.replayAdjustment < 0) drivers.push(`low replay activity subtracted ${formatPercent(Math.abs(parts.replayAdjustment))}`); if (parts.urgencyAdjustment > 0) drivers.push(`close-date urgency added ${formatPercent(parts.urgencyAdjustment)}`); else if (parts.urgencyAdjustment < 0) drivers.push(`stale close date subtracted ${formatPercent(Math.abs(parts.urgencyAdjustment))}`); if (parts.riskAdjustment > 0) drivers.push(`risks subtracted ${formatPercent(parts.riskAdjustment)}`); return drivers; }
function confidenceBand(probability, account) { const hasRecentReplay = Number(account.replayScore ?? 0) >= 60; const hasAmount = Number(account.amount ?? 0) > 0; if (probability >= 0.7 && hasRecentReplay && hasAmount) return "high"; if (probability >= 0.35 && hasAmount) return "medium"; return "low"; }
function normalizeStage(stage = "discovery") { return String(stage).toLowerCase().replaceAll(" ", "_"); }
function formatPercent(value) { return `${Math.round(value * 100)}%`; }
function roundCurrency(value) { return Math.round(value * 100) / 100; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
