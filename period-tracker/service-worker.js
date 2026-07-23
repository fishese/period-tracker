/*
 * My Cycle Keeper — Service Worker
 * ─────────────────────────────────────────────────────────────
 * Strategy: Cache-first for app shell. Google Drive backup uses network at runtime
 * (googleapis.com) and is never cached by this worker.
 *
 * Versioned cache: bump CACHE_VERSION when deploying updates
 * so stale caches are automatically purged on activation.
 *
 * Security notes:
 *   • No external URLs are ever fetched or cached
 *   • Cache is scoped to this origin only
 *   • fetch handler only responds to same-origin requests
 */

"use strict";

const IS_DEV =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

const CACHE_VERSION = "v20260723g";
const CACHE_NAME = `mycyclekeeper-${CACHE_VERSION}`;

// Derive base path from the SW's own URL so this works on both localhost
// (/period-tracker/) and GitHub Pages (/period-tracker/period-tracker/).
const BASE_PATH = self.location.pathname.substring(
  0,
  self.location.pathname.lastIndexOf("/") + 1
);

const ASSETS_TO_CACHE = [
  BASE_PATH,
  BASE_PATH + "index.html",
  BASE_PATH + "style.css",
  BASE_PATH + "style-desktop.css",
  BASE_PATH + "manifest.json",
  BASE_PATH + "js/script.js",
  BASE_PATH + "js/indexeddb-storage.js",
  BASE_PATH + "js/crypto.js",
  BASE_PATH + "js/cycles.js",
  BASE_PATH + "js/dateUtils.js",
  BASE_PATH + "js/i18n.js",
  BASE_PATH + "js/navigation.js",
  BASE_PATH + "js/periodMarking.js",
  BASE_PATH + "js/session.js",
  BASE_PATH + "js/validators.js",
  BASE_PATH + "js/import-drip.js",
  BASE_PATH + "js/export-drip.js",
  BASE_PATH + "js/drive-sync.js",
  BASE_PATH + "js/drive-config.js",
  BASE_PATH + "import-drip.html",
  BASE_PATH + "icons/favicon-16x16.png",
  BASE_PATH + "icons/favicon-32x32.png",
  BASE_PATH + "icons/favicon-48x48.png",
  BASE_PATH + "icons/android-chrome-192x192.png",
  BASE_PATH + "icons/android-chrome-512x512.png",
  BASE_PATH + "icons/apple-touch-icon.png",
  BASE_PATH + "icons/apple-touch-icon-152x152.png",
  BASE_PATH + "icons/apple-touch-icon-167x167.png",
  BASE_PATH + "icons/apple-touch-icon-180x180.png",
  BASE_PATH + "icons/favicon.ico",
  BASE_PATH + "icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  if (IS_DEV) return;
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Failed to pre-cache: ${url}`, err);
          })
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests to same origin — no external requests
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // In dev, bypass browser HTTP cache so edits show immediately on reload
  if (IS_DEV) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  // Network-first strategy for HTML to ensure updates
  if (
    event.request.headers.get("accept")?.includes("text/html") ||
    url.pathname === "/" ||
    url.pathname === "/index.html"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const cloned = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Network-first for CSS and JS — ensures a reload always fetches fresh
  // code. Cache-Control: no-cache on the server makes this fast (ETag check),
  // and the cache fallback keeps the app usable offline.
  if (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const cloned = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request, { ignoreSearch: true })
        )
    );
    return;
  }

  // Cache-first for images and other static assets — large files that
  // rarely change; CACHE_NAME rotation on deploy keeps them fresh.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const cloned = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, cloned));
        }
        return response;
      });
    })
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Focus existing window if open
      for (let client of clientList) {
        if (client.url === "/" || client.url.includes("mycyclekeeper"))
          return client.focus();
      }
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
