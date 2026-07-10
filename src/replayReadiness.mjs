const STATE_MULTIPLIER = {
  ready: 1,
  watch: 0.5,
  blocked: 0,
};

export const enterpriseReplayReadinessSignals = [
  {
    name: "Source call verified",
    state: "ready",
    weight: 3,
    note: "The discovery recording and transcript match the selected account segment.",
  },
  {
    name: "Decision criteria captured",
    state: "watch",
    weight: 2,
    note: "Procurement criteria are present, but success metrics need manager confirmation.",
  },
  {
    name: "Customer consent confirmed",
    state: "ready",
    weight: 3,
    note: "Consent was logged before the replay was prepared for the account team.",
  },
];

export function summarizeReplayReadiness(signals) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return {
      score: 0,
      status: "blocked",
      blockers: ["No readiness signals"],
      warnings: [],
    };
  }

  const totalWeight = signals.reduce((total, signal) => total + signal.weight, 0);
  const weightedScore = signals.reduce(
    (total, signal) => total + signal.weight * STATE_MULTIPLIER[signal.state],
    0,
  );
  const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  const blockers = signals
    .filter((signal) => signal.state === "blocked")
    .map((signal) => signal.name);
  const warnings = signals
    .filter((signal) => signal.state === "watch")
    .map((signal) => signal.name);

  return {
    score,
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "needs-review" : "ready",
    blockers,
    warnings,
  };
}
