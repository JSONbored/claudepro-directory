// Service Worker for Claude Pro Directory
// Version: 1.2.0
// Enhanced PWA support with dynamic content caching and background sync

// Production-safe logging - only in development
const isDev =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const log = isDev ? console.log.bind(console) : () => {};
const error = isDev ? console.error.bind(console) : () => {};

// Security constants (synchronized with src/lib/constants.ts SECURITY_CONFIG)
const TRUSTED_HOSTNAMES = {
  umami: "umami.claudepro.directory",
  vercel: "va.vercel-scripts.com",
};

const ALLOWED_ORIGINS = [
  "https://claudepro.directory",
  "https://www.claudepro.directory",
];

const STATIC_CACHE = "claudepro-static-v1.2";
const DYNAMIC_CACHE = "claudepro-dynamic-v1.2";
const API_CACHE = "claudepro-api-v1.2";

const urlsToCache = [
  "/",
  "/offline.html",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/favicon-16x16.png",
  "/assets/icons/favicon-32x32.png",
  "/assets/icons/apple-touch-icon.png",
];

// Content routes that should be cached for offline browsing
const CONTENT_ROUTES = [
  "/agents",
  "/mcp",
  "/rules",
  "/commands",
  "/hooks",
  "/statuslines",
  "/guides",
];

// Install event - cache initial resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        log("Opened static cache");
        return cache.addAll(urlsToCache);
      }),
      // Pre-cache content routes for offline browsing
      caches.open(DYNAMIC_CACHE).then((cache) => {
        log("Opened dynamic cache");
        return cache.addAll(CONTENT_ROUTES);
      }),
    ]).catch((err) => {
      error("Service worker installation failed:", err);
    }),
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and register background sync
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that aren't in current cache list
            if (
              cacheName.startsWith("claudepro-") &&
              !currentCaches.includes(cacheName)
            ) {
              log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      }),
  );
});

// Enhanced fetch event handler with multiple caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (except trusted domains)
  // Use exact hostname matching to prevent subdomain bypass attacks
  if (
    url.origin !== location.origin &&
    url.hostname !== TRUSTED_HOSTNAMES.umami &&
    url.hostname !== TRUSTED_HOSTNAMES.vercel
  ) {
    return;
  }

  // Different strategies based on request type

  // Special handling for Umami analytics script - cache for 7 days
  if (
    url.hostname.includes("umami.claudepro.directory") &&
    url.pathname.includes("script.js")
  ) {
    event.respondWith(
      longTermCacheStrategy(request, STATIC_CACHE, 7 * 24 * 60 * 60 * 1000),
    ); // 7 days
  } else if (url.pathname.startsWith("/api/")) {
    // API requests: Network first, cache as fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (
    url.pathname.match(
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|webp|avif)$/,
    )
  ) {
    // Static assets: Cache first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (
    CONTENT_ROUTES.some((route) => url.pathname.startsWith(route)) ||
    url.pathname.match(
      /\/(agents|mcp|rules|commands|hooks|statuslines|collections|guides)\/[^/]+$/,
    )
  ) {
    // Content pages: Stale while revalidate for fresh content
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
  } else if (url.pathname === "/" || request.destination === "document") {
    // Main pages: Network first with offline fallback
    event.respondWith(networkFirstWithOfflineStrategy(request, DYNAMIC_CACHE));
  }
});

// Long-term cache strategy with TTL for third-party scripts
async function longTermCacheStrategy(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Check if cached and still within TTL
  if (cached) {
    const cacheTimestamp = cached.headers.get("sw-cache-timestamp");
    if (cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < ttl) {
      return cached;
    }
  }

  // Fetch fresh copy
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone response and add cache timestamp
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set("sw-cache-timestamp", Date.now().toString());
      headers.set("Cache-Control", `public, max-age=${Math.floor(ttl / 1000)}`);

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, cachedResponse);
    }
    return response;
  } catch (error) {
    // Return cached version even if expired when offline
    if (cached) {
      return cached;
    }
    log("Long-term cache fetch failed:", error);
    return new Response("Script unavailable offline", { status: 503 });
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    log("Cache-first fetch failed:", error);
    return new Response("Asset unavailable offline", { status: 503 });
  }
}

// Network-first strategy for API requests
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache API responses for 5 minutes
      const responseToCache = response.clone();
      responseToCache.headers.set("sw-cache-timestamp", Date.now().toString());
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    log("Network request failed, trying cache:", error);
    const cached = await cache.match(request);
    if (cached) {
      // Check if cached response is less than 5 minutes old
      const timestamp = cached.headers.get("sw-cache-timestamp");
      if (timestamp && Date.now() - parseInt(timestamp) < 5 * 60 * 1000) {
        return cached;
      }
    }
    return new Response("API unavailable offline", { status: 503 });
  }
}

// Stale-while-revalidate for content pages
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Start fetch in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached version immediately if available
  if (cached) {
    return cached;
  }

  // Wait for network if no cache available
  return fetchPromise || caches.match("/offline.html");
}

// Network-first with offline page fallback
async function networkFirstWithOfflineStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    log("Network request failed, trying cache or offline page:", error);
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline page for document requests
    if (request.destination === "document") {
      return caches.match("/offline.html");
    }

    return new Response("Content unavailable offline", { status: 503 });
  }
}

// Background sync for failed requests
self.addEventListener("sync", (event) => {
  log("Background sync triggered:", event.tag);

  if (event.tag === "submit-config") {
    event.waitUntil(syncConfigSubmissions());
  } else if (event.tag === "track-view") {
    event.waitUntil(syncViewTracking());
  } else if (event.tag === "analytics") {
    event.waitUntil(syncAnalyticsData());
  } else if (event.tag.startsWith("retry-")) {
    event.waitUntil(retryFailedRequest(event.tag));
  }
});

// Store for failed requests
const FAILED_REQUESTS_STORE = "failed-requests-v1";
const MAX_RETRY_ATTEMPTS = 3;

// Retry a specific failed request
async function retryFailedRequest(tag) {
  const cache = await caches.open(FAILED_REQUESTS_STORE);
  const metadataResponse = await cache.match(tag);

  if (!metadataResponse) {
    log("No failed request found for:", tag);
    return;
  }

  const requestData = await metadataResponse.json();

  // Check if request is too old (24 hours)
  if (Date.now() - requestData.timestamp > 24 * 60 * 60 * 1000) {
    await cache.delete(tag);
    log("Request too old, removing:", tag);
    return;
  }

  try {
    const request = new Request(requestData.url, {
      method: requestData.method,
      headers: requestData.headers,
      body: requestData.body,
    });

    const response = await fetch(request);

    if (response.ok) {
      // Success - remove from failed requests
      await cache.delete(tag);
      log("Successfully retried request:", requestData.url);

      // Notify clients of success
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "sync-success",
          url: requestData.url,
          id: requestData.id,
        });
      });
    } else if (requestData.attempt < MAX_RETRY_ATTEMPTS) {
      // Failed but can retry
      requestData.attempt++;
      const newResponse = new Response(JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
      });
      await cache.put(new Request(tag), newResponse);

      // Register for another sync
      if (self.registration && self.registration.sync) {
        await self.registration.sync.register(tag);
      }
    } else {
      // Max attempts reached
      await cache.delete(tag);
      log("Max retry attempts reached for:", requestData.url);

      // Notify clients of failure
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "sync-failed",
          url: requestData.url,
          id: requestData.id,
          error: "Max retry attempts reached",
        });
      });
    }
  } catch (err) {
    error("Error retrying request:", err);

    if (requestData.attempt < MAX_RETRY_ATTEMPTS) {
      // Network error - try again later
      requestData.attempt++;
      const newResponse = new Response(JSON.stringify(requestData), {
        headers: { "Content-Type": "application/json" },
      });
      await cache.put(new Request(tag), newResponse);

      // Register for another sync
      if (self.registration && self.registration.sync) {
        await self.registration.sync.register(tag);
      }
    } else {
      await cache.delete(tag);
    }
  }
}

// Sync configuration submissions
async function syncConfigSubmissions() {
  log("Syncing configuration submissions");
  const cache = await caches.open(FAILED_REQUESTS_STORE);
  const requests = await cache.keys();

  const submissionRequests = requests.filter(
    (req) => req.url.includes("/api/submit") || req.url.includes("/submit"),
  );

  for (const request of submissionRequests) {
    await retryFailedRequest(request.url);
  }
}

// Sync view tracking data
async function syncViewTracking() {
  log("Syncing view tracking data");
  const cache = await caches.open(FAILED_REQUESTS_STORE);
  const requests = await cache.keys();

  const trackingRequests = requests.filter(
    (req) =>
      req.url.includes("/api/track") || req.url.includes("/actions/track"),
  );

  for (const request of trackingRequests) {
    await retryFailedRequest(request.url);
  }
}

// Sync analytics data
async function syncAnalyticsData() {
  log("Syncing analytics data");
  const cache = await caches.open(FAILED_REQUESTS_STORE);
  const requests = await cache.keys();

  const analyticsRequests = requests.filter(
    (req) =>
      req.url.includes("umami") ||
      req.url.includes("analytics") ||
      req.url.includes("vitals"),
  );

  for (const request of analyticsRequests) {
    await retryFailedRequest(request.url);
  }
}

// Periodic background sync (fallback)
self.addEventListener("message", (event) => {
  // Security: Validate origin before processing postMessage
  // Only accept messages from trusted origins to prevent malicious commands
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    log("Rejected message from untrusted origin:", event.origin);
    return;
  }

  if (event.data && event.data.type === "start-periodic-sync") {
    setInterval(async () => {
      const cache = await caches.open(FAILED_REQUESTS_STORE);
      const requests = await cache.keys();

      for (const request of requests) {
        if (request.url.startsWith("retry-")) {
          await retryFailedRequest(request.url);
        }
      }
    }, 60000); // Check every minute
  }
});
