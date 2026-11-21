import { buildReminders } from "@/lib/schedule";
import type { AppData } from "@/types";

const BASE = import.meta.env.BASE_URL;

export type NotificationState = "on" | "off" | "denied" | "unsupported";

export function notificationsSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

export function notificationState(): NotificationState {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" ? "on" : "off";
}

export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** На iPhone фоновые уведомления доступны только PWA с домашнего экрана. */
export function needsHomeScreen(): boolean {
  return isIOS() && !window.matchMedia("(display-mode: standalone)").matches;
}

export async function requestNotifications(): Promise<void> {
  if (!notificationsSupported()) throw new Error("Браузер не поддерживает уведомления");
  // Уведомления через Service Worker надёжнее, поэтому перед запросом разрешения
  // даём регистрации немного времени, но не блокируем интерфейс навсегда.
  await Promise.race([
    navigator.serviceWorker.ready.catch(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
  ]);
  const result = await Notification.requestPermission();
  if (result !== "granted") throw new Error("Разрешите уведомления в настройках браузера");
}

export async function showLocalNotification(
  title: string,
  body: string,
  tag = "pause",
): Promise<boolean> {
  if (notificationState() !== "on") return false;
  const options: NotificationOptions = {
    body,
    icon: `${BASE}icon.svg`,
    badge: `${BASE}icon.svg`,
    tag,
  };
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    return true;
  } catch {
    // Некоторые браузеры не дают Service Worker показывать уведомление — пробуем напрямую.
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

/** Напоминания на время, пока приложение открыто. Возвращает функцию отмены. */
export function scheduleLocalNotifications(
  data: AppData,
  onFire: (title: string, body: string, tag: string) => void,
): () => void {
  if (!data.settings.pushEnabled || notificationState() !== "on") return () => {};
  const fired = new Set<string>();
  const timers = buildReminders(data, Date.now())
    .map((reminder) => {
      const key = `${reminder.id}:${reminder.at}`;
      const delay = reminder.at - Date.now();
      if (fired.has(key) || delay <= 0 || delay > 2_147_483_647) return null;
      return window.setTimeout(() => {
        fired.add(key);
        onFire(reminder.title, reminder.body, reminder.id);
      }, delay);
    })
    .filter((timer): timer is number => timer !== null);
  return () => timers.forEach((timer) => window.clearTimeout(timer));
}
