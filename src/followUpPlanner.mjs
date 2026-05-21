const DEFAULT_TEMPLATES = {
  hot: {
    channel: "email",
    subject: account => `Next steps for ${account}`,
    delayHours: 4,
  },
  warm: {
    channel: "email",
    subject: account => `Following up on ${account}`,
    delayHours: 24,
  },
  watch: {
    channel: "crm_task",
    subject: account => `Monitor ${account}`,
    delayHours: 72,
  },
};

export function planFollowUps(rankedWindows, options = {}) {
  const owner = options.owner ?? "account executive";
  const templates = { ...DEFAULT_TEMPLATES, ...options.templates };

  return rankedWindows.map(window => {
    const scorecard = window.scorecard ?? { band: "watch", score: 0, reasons: [] };
    const template = templates[scorecard.band] ?? templates.watch;
    const dueAt = addHours(window.endedAt, template.delayHours);
    const blockers = collectBlockers(window);

    return {
      accountId: window.accountId,
      owner,
      channel: template.channel,
      subject: template.subject(window.accountId),
      dueAt,
      priority: scorecard.band,
      score: scorecard.score,
      blockers,
      talkingPoints: buildTalkingPoints(window, scorecard),
    };
  });
}

export function groupFollowUpsByPriority(followUps) {
  return followUps.reduce(
    (groups, followUp) => {
      groups[followUp.priority] ??= [];
      groups[followUp.priority].push(followUp);
      return groups;
    },
    { hot: [], warm: [], watch: [] },
  );
}

function buildTalkingPoints(window, scorecard) {
  const latestEvents = [...window.events]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 3)
    .map(event => event.summary)
    .filter(Boolean);

  return [
    ...scorecard.reasons.map(reason => `Reason: ${reason}`),
    ...latestEvents.map(summary => `Recent activity: ${summary}`),
  ];
}

function collectBlockers(window) {
  const blockerTerms = ["blocked", "legal", "pricing", "procurement", "security"];

  return window.events.flatMap(event => {
    const summary = event.summary?.toLowerCase() ?? "";
    return blockerTerms
      .filter(term => summary.includes(term))
      .map(term => ({ term, eventId: event.id ?? undefined }));
  });
}

function addHours(value, hours) {
  const date = new Date(value);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}
