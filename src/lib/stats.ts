import type { AppData, SmokeEvent } from "@/types";
import { addDays, dayKey, weekStartKey } from "@/lib/time";

export function dayEvents(events: SmokeEvent[], at: number | Date): SmokeEvent[] {
  const key = dayKey(at);
  return events.filter((e) => dayKey(e.at) === key);
}

export function weekEvents(events: SmokeEvent[], at: number | Date): SmokeEvent[] {
  const key = weekStartKey(at);
  return events.filter((e) => weekStartKey(e.at) === key);
}

export function longestGap(events: SmokeEvent[], from: number): number {
  let previous = from;
  let best = 0;
  for (const event of [...events].sort((a, b) => a.at - b.at)) {
    if (event.at < from) continue;
    best = Math.max(best, event.at - previous);
    previous = event.at;
  }
  return best;
}

export function disciplineStreak(data: AppData, now: number): number {
  let streak = 0;
  const today = new Date(now);
  for (let i = 0; i < 30; i++) {
    const day = addDays(today, -i);
    if (day.getTime() < new Date(data.startedAt).setHours(0, 0, 0, 0)) break;
    const events = dayEvents(data.events, day);
    const good = events.length <= data.settings.dailyGoal && events.every((e) => e.planned);
    if (!good) break;
    streak++;
  }
  return streak;
}

export function lastDays(data: AppData, now: number, count: number) {
  const today = new Date(now);
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(today, i - count + 1);
    const events = dayEvents(data.events, date);
    return {
      key: dayKey(date),
      label: date.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", ""),
      planned: events.filter((e) => e.planned).length,
      slip: events.filter((e) => !e.planned).length,
      total: events.length,
    };
  });
}
