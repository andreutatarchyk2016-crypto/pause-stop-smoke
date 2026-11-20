/* Уведомления приходят даже при закрытой вкладке: браузер подписывается на локальный
   сервер (server/index.mjs), а сервер в нужное время отправляет push через VAPID. */

/* По умолчанию обращаемся к тому же адресу, что и сайт: Vite проксирует /api на локальный
   сервер уведомлений. Так приложение работает и с телефона по IP локальной сети. */
const API = (import.meta.env.VITE_PUSH_API as string | undefined) || "/api";
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin;

export type Reminder = {
  id: string;
  at: number;
  title: string;
  body: string;
};

export type PushState = "on" | "off" | "denied" | "unsupported" | "error";

export function supported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ошибка сервера уведомлений (${res.status})`);
  return (await res.json()) as T;
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const s = atob(base64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64url.length % 4)) % 4));
  const bytes = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export async function pushState(): Promise<PushState> {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ? "on" : "off";
}

export async function enablePush(deviceId: string): Promise<void> {
  if (!supported()) throw new Error("Браузер не поддерживает уведомления");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Разрешите уведомления в настройках браузера");
  const { publicKey } = await api<{ publicKey: string }>("/api/vapid");
  if (!publicKey) throw new Error("Сервер уведомлений не запущен (npm run dev)");
  const reg = await navigator.serviceWorker.ready;
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
  await api("/api/subscribe", { deviceId, subscription: subscription.toJSON() });
}

export async function disablePush(deviceId: string): Promise<void> {
  await api("/api/unsubscribe", { deviceId }).catch(() => {});
  const reg = await navigator.serviceWorker.getRegistration();
  const subscription = await reg?.pushManager.getSubscription();
  await subscription?.unsubscribe().catch(() => {});
}

export async function syncReminders(deviceId: string, reminders: Reminder[]): Promise<void> {
  await api("/api/sync", {
    deviceId,
    schedules: reminders.map((r) => ({ ...r, url: APP_URL })),
  });
}
