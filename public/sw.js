/* Service Worker: приложение открывается и работает даже без сети после первого визита.
   Сначала пробуем сеть (чтобы получить свежую версию после выкладки), при отсутствии
   сети отдаём сохранённый ответ. Также показывает уведомления и открывает приложение по тапу. */

const CACHE = "pause-shell-v3";
// На GitHub Pages приложение лежит в подкаталоге (/pause-stop-smoke/), на Vercel — в корне.
const BASE = new URL(".", self.registration.scope).pathname;
const APP_URL = new URL(BASE, self.location.origin).href;
const SHELL = [BASE, `${BASE}index.html`, `${BASE}icon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match(`${BASE}index.html`);
          if (shell) return shell;
        }
        return Response.error();
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const own = clients.filter((client) => new URL(client.url).href.startsWith(APP_URL));
      if (own.length) return own[0].focus();
      return self.clients.openWindow(APP_URL);
    }),
  );
});
