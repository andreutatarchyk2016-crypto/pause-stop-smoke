const pad = (n: number) => String(n).padStart(2, "0");

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} мин`;
  return formatMinutes(min);
}

function localDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dayKey(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function weekStart(date: Date | number): Date {
  const d = localDate(typeof date === "number" ? new Date(date) : date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekStartKey(date: Date | number): string {
  return dayKey(weekStart(date));
}

export function weekLabel(start: Date): string {
  const end = addDays(start, 6);
  return `${start.getDate()} ${start.toLocaleDateString("ru-RU", { month: "short" })} — ${end.getDate()} ${end.toLocaleDateString("ru-RU", { month: "short" })}`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(ts: number): string {
  return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/** Воскресенье 20:00 недели, к которой относится дата. */
export function reviewAt(start: Date): number {
  const d = addDays(start, 6);
  d.setHours(20, 0, 0, 0);
  return d.getTime();
}
