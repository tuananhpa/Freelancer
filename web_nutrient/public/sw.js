const CACHE = "nutri-shell-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/icon.svg"])));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url);
  if (
    u.origin !== self.location.origin ||
    event.request.method !== "GET" ||
    u.pathname.startsWith("/api/") ||
    u.pathname.startsWith("/cdn-cgi/")
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/")));
    return;
  }
  if (u.pathname.startsWith("/assets/"))
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(event.request);
        if (hit) return hit;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }),
    );
});
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data.json();
  } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title || "NuTri Teens", {
      body: payload.body || "Bạn có nhắc nhở mới.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: payload.title || "nutri",
      data: { url: "/" },
      silent: !!payload.silent,
      ...(payload.silent ? {} : { vibrate: [150, 80, 150] }),
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        const existing = list.find(
          (c) => new URL(c.url).origin === self.location.origin,
        );
        return existing ? existing.focus() : self.clients.openWindow("/");
      }),
  );
});
