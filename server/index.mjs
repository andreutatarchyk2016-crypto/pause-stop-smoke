import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webpush from "web-push";

/* Минимальный локальный сервер для настоящих Web Push.
   Хранит только VAPID-ключи, подписки браузеров и время отложенных уведомлений.
   Данные о курении остаются в браузере (localStorage) и сюда не попадают. */

const dir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(dir, "data");
const keysFile = path.join(dataDir, "vapid.json");
const subsFile = path.join(dataDir, "subscriptions.json");
const schedFile = path.join(dataDir, "schedules.json");
const port = Number(process.env.PUSH_PORT || 8787);

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

let keys = readJson(keysFile, null);
if (!keys?.publicKey || !keys?.privateKey) {
  keys = webpush.generateVAPIDKeys();
  writeJson(keysFile, keys);
  console.log("[push] сгенерированы новые VAPID-ключи");
}
webpush.setVapidDetails("mailto:pause-local@example.com", keys.publicKey, keys.privateKey);

let subscriptions = readJson(subsFile, []);
let schedules = readJson(schedFile, []);
const timers = new Map();

function saveSubscriptions() {
  writeJson(subsFile, subscriptions);
}

function saveSchedules() {
  writeJson(schedFile, schedules);
}

function fire(id) {
  timers.delete(id);
  const item = schedules.find((s) => s.id === id);
  if (!item) return;
  schedules = schedules.filter((s) => s.id !== id);
  saveSchedules();

  const payload = JSON.stringify({
    title: item.title,
    body: item.body,
    url: item.url || "/",
    tag: item.id,
  });

  for (const entry of subscriptions.filter((s) => s.deviceId === item.deviceId)) {
    webpush
      .sendNotification(entry.subscription, payload, { TTL: 120 })
      .catch((error) => {
        if (error.statusCode === 404 || error.statusCode === 410) {
          subscriptions = subscriptions.filter((s) => s.endpoint !== entry.endpoint);
          saveSubscriptions();
          console.log("[push] удалена недействительная подписка");
        } else {
          console.error("[push] ошибка отправки:", error.message);
        }
      });
  }
  console.log(`[push] отправлено: ${item.title}`);
}

function rescheduleAll() {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  const now = Date.now();
  for (const item of schedules) {
    const delay = item.at - now;
    if (delay <= 0) continue;
    timers.set(item.id, setTimeout(() => fire(item.id), Math.min(delay, 2_147_483_647)));
  }
}

function send(res, status, body) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("слишком большой запрос"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("неверный JSON"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${port}`);

  if (req.method === "GET" && url.pathname === "/api/vapid") {
    send(res, 200, { publicKey: keys.publicKey });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    send(res, 200, {
      ok: true,
      subscriptions: subscriptions.length,
      pending: schedules.length,
      nextAt: schedules.length ? Math.min(...schedules.map((s) => s.at)) : null,
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/subscribe") {
    try {
      const { deviceId, subscription } = await readBody(req);
      if (!deviceId || !subscription?.endpoint) throw new Error("нет deviceId или подписки");
      subscriptions = [
        ...subscriptions.filter((s) => s.deviceId !== deviceId && s.endpoint !== subscription.endpoint),
        { deviceId, endpoint: subscription.endpoint, subscription },
      ];
      saveSubscriptions();
      send(res, 200, { ok: true });
    } catch (error) {
      send(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/unsubscribe") {
    try {
      const { deviceId } = await readBody(req);
      subscriptions = subscriptions.filter((s) => s.deviceId !== deviceId);
      saveSubscriptions();
      send(res, 200, { ok: true });
    } catch (error) {
      send(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/sync") {
    try {
      const { deviceId, schedules: list } = await readBody(req);
      if (!deviceId || !Array.isArray(list)) throw new Error("нет deviceId или списка уведомлений");
      const incoming = list
        .filter((s) => s && typeof s.id === "string" && Number.isFinite(s.at) && s.at > Date.now())
        .map((s) => ({
          id: `${deviceId}:${s.id}`,
          deviceId,
          at: s.at,
          title: String(s.title || "Пауза"),
          body: String(s.body || ""),
          url: String(s.url || "/"),
        }));
      schedules = [...schedules.filter((s) => s.deviceId !== deviceId), ...incoming];
      saveSchedules();
      rescheduleAll();
      send(res, 200, { ok: true, pending: incoming.length });
    } catch (error) {
      send(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    send(res, 200, "Пауза: сервер Web Push работает");
    return;
  }

  send(res, 404, { error: "не найдено" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[push] http://127.0.0.1:${port}  (${subscriptions.length} подписок, ${schedules.length} отложенных)`);
  rescheduleAll();
});
