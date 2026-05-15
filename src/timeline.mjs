import { eventSort, normalizeEvent, summarizeEvent } from "./events.mjs";

export function buildAccountTimelines(events) {
  const timelines = new Map();

  for (const rawEvent of events) {
    const event = normalizeEvent(rawEvent);
    const existing = timelines.get(event.accountId) ?? [];
    existing.push(event);
    timelines.set(event.accountId, existing);
  }

  return [...timelines.entries()].map(([accountId, accountEvents]) => ({
    accountId,
    events: accountEvents.sort(eventSort),
  }));
}

export function createReplayWindows(events, options = {}) {
  const lookbackDays = options.lookbackDays ?? 14;
  const now = options.now ? new Date(options.now) : new Date();
  const threshold = now.getTime() - lookbackDays * 24 * 60 * 60 * 1000;

  return buildAccountTimelines(events)
    .map(timeline => ({
      ...timeline,
      events: timeline.events.filter(event => Date.parse(event.occurredAt) >= threshold),
    }))
    .filter(timeline => timeline.events.length > 0)
    .map(timeline => ({
      accountId: timeline.accountId,
      startedAt: timeline.events[0].occurredAt,
      endedAt: timeline.events[timeline.events.length - 1].occurredAt,
      eventCount: timeline.events.length,
      narrative: timeline.events.map(summarizeEvent),
      events: timeline.events,
    }));
}

export function prioritizeReplayWindows(windows) {
  return [...windows].sort((a, b) => {
    const byCount = b.eventCount - a.eventCount;
    if (byCount !== 0) {
      return byCount;
    }

    return Date.parse(b.endedAt) - Date.parse(a.endedAt);
  });
}
