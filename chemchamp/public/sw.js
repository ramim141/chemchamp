/**
 * ChemChamp Offline App Shell & Static Asset Service Worker
 * Secure Cache Strategy:
 * - StaleWhileRevalidate for Fonts & CDNs
 * - CacheFirst for ImgBB assets
 * - NEVER caches Firestore requests, Auth APIs, or user data
 */

const CACHE_NAME = "chemchamp-shell-v1";
const IMAGE_CACHE_NAME = "chemchamp-images-v1";
const FONT_CACHE_NAME = "chemchamp-fonts-v1";

const PRECACHE_URLS = [
  "/",
  "/favicon.svg",
  "/site.webmanifest",
];

// Install: Pre-cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("Pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (![CACHE_NAME, IMAGE_CACHE_NAME, FONT_CACHE_NAME].includes(name)) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Interceptor
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. STRICT SECURITY: Never cache Firebase, Auth, Firestore, or analytics APIs
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com") ||
    url.pathname.includes("/admin")
  ) {
    return;
  }

  // 2. Google Fonts: Stale-While-Revalidate
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. ImgBB / External Diagram Images: Cache-First
  if (url.hostname.includes("ibb.co") || url.hostname.includes("imgbb.com")) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 4. Default: Network first for HTML / app pages
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => cached || caches.match("/"));
      })
    );
  }
});

