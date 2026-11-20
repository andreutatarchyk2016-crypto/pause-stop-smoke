import type { AppData } from "@/types";

const KEY = "pause:state:v1";

function deviceId(): string {
  const stored = localStorage.getItem("pause:device");
  if (stored) return stored;
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem("pause:device", id);
  return id;
}

export function defaultData(): AppData {
  const now = Date.now();
  return {
    version: 1,
    deviceId: deviceId(),
    startedAt: now,
    cycleStart: now,
    settings: {
      intervalMin: 60,
      dailyGoal: 10,
      reminderBeforeMin: 10,
      pushEnabled: false,
    },
    events: [],
    reviews: [],
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const base = defaultData();
    return {
      ...base,
      ...parsed,
      version: 1,
      deviceId: parsed.deviceId || base.deviceId,
      cycleStart:
        parsed.cycleStart ??
        parsed.events?.at(-1)?.at ??
        parsed.startedAt ??
        base.cycleStart,
      settings: { ...base.settings, ...parsed.settings },
      // Старые записи были по одной сигарете без поля count — приводим к новому формату.
      events: Array.isArray(parsed.events)
        ? parsed.events.map((event) => ({ ...event, count: event.count > 0 ? event.count : 1 }))
        : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    };
  } catch {
    return defaultData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* В приватном режиме запись может быть запрещена — приложение продолжает работать в памяти */
  }
}

export function resetData(): AppData {
  localStorage.removeItem(KEY);
  return defaultData();
}
