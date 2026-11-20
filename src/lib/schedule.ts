import type { AppData } from "@/types";
import type { Reminder } from "@/lib/push";
import { reviewAt, weekStart, weekStartKey } from "@/lib/time";

export const SMOKE_WINDOW_MS = 5 * 60_000;

/** Какие уведомления должны быть запланированы сервером прямо сейчас. */
export function buildReminders(data: AppData, now: number): Reminder[] {
  if (!data.settings.pushEnabled) return [];
  const result: Reminder[] = [];
  const nextAt = data.cycleStart + data.settings.intervalMin * 60_000;

  if (nextAt > now) {
    const soonAt = nextAt - data.settings.reminderBeforeMin * 60_000;
    if (data.settings.reminderBeforeMin > 0 && soonAt > now) {
      result.push({
        id: "soon",
        at: soonAt,
        title: "Пачка почти открылась",
        body: `До сигареты ${data.settings.reminderBeforeMin} мин. Держись!`,
      });
    }
  }

  if (nextAt + SMOKE_WINDOW_MS > now) {
    result.push({
      id: "pack-open",
      at: nextAt,
      title: "Пачка открылась",
      body: "Сигарета вышла вперёд — у тебя 5 минут. Покрути её." ,
    });
    const almostEnd = nextAt + SMOKE_WINDOW_MS - 60_000;
    if (almostEnd > now) {
      result.push({
        id: "window-end",
        at: almostEnd,
        title: "Осталась минута",
        body: "Сигарета скоро станет окурком. Решай сейчас.",
      });
    }
  }

  const start = weekStart(now);
  if (!data.reviews.some((r) => r.weekStart === weekStartKey(now))) {
    const at = reviewAt(start);
    if (at > now) {
      result.push({
        id: "review",
        at,
        title: "Итоги недели",
        body: "Пройди короткий опрос: удалось ли идти по графику?",
      });
    }
  }

  return result;
}
