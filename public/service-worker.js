// Service Worker for Claude Pro Directory
// Version: 1.2.0
// Enhanced PWA support with dynamic content caching and background sync

const CACHE_NAME = 'claudepro-v1.2';
const STATIC_CACHE = 'claudepro-static-v1.2';
const DYNAMIC_CACHE = 'claudepro-dynamic-v1.2';
const API_CACHE = 'claudepro-api-v1.2';

const urlsToCache = [
  '/',
  '/offline.html',
  '/site.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/apple-touch-icon.png'
];

// Content routes that should be cached for offline browsing
const CONTENT_ROUTES = [
  '/agents',
  '/mcp',
  '/rules',
  '/commands',
  '/hooks',
  '/guides'
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Opened static cache');
        return cache.addAll(urlsToCache);
      }),
      // Pre-cache content routes for offline browsing
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Opened dynamic cache');
        return cache.addAll(CONTENT_ROUTES);
      })
    ]).catch((err) => {
      console.log('Service worker installation failed:', err);
    })
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and register background sync
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that aren't in current cache list
          if (cacheName.startsWith('claudepro-') && !currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Enhanced fetch event handler with multiple caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except trusted domains)
  if (url.origin !== location.origin &&
      !url.hostname.includes('umami.claudepro.directory') &&
      !url.hostname.includes('va.vercel-scripts.com')) {
    return;
  }

  // Different strategies based on request type
  if (url.pathname.startsWith('/api/')) {
    // API requests: Network first, cache as fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|webp|avif)$/)) {
    // Static assets: Cache first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (CONTENT_ROUTES.some(route => url.pathname.startsWith(route)) ||
             url.pathname.match(/\/(agents|mcp|rules|commands|hooks|guides)\/[^/]+$/)) {
    // Content pages: Stale while revalidate for fresh content
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
  } else if (url.pathname === '/' || request.destination === 'document') {
    // Main pages: Network first with offline fallback
    event.respondWith(networkFirstWithOfflineStrategy(request, DYNAMIC_CACHE));
  }
});

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
    console.log('Cache-first fetch failed:', error);
    return new Response('Asset unavailable offline', { status: 503 });
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
      responseToCache.headers.set('sw-cache-timestamp', Date.now().toString());
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    console.log('Network request failed, trying cache:', error);
    const cached = await cache.match(request);
    if (cached) {
      // Check if cached response is less than 5 minutes old
      const timestamp = cached.headers.get('sw-cache-timestamp');
      if (timestamp && Date.now() - parseInt(timestamp) < 5 * 60 * 1000) {
        return cached;
      }
    }
    return new Response('API unavailable offline', { status: 503 });
  }
}

// Stale-while-revalidate for content pages
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Start fetch in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Return cached version immediately if available
  if (cached) {
    return cached;
  }

  // Wait for network if no cache available
  return fetchPromise || caches.match('/offline.html');
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
    console.log('Network request failed, trying cache or offline page:', error);
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline page for document requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    return new Response('Content unavailable offline', { status: 503 });
  }
}

// Background sync for failed requests (if supported)
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(retryFailedRequests());
    }
  });
}

async function retryFailedRequests() {
  // Implementation for retrying failed requests when back online
  console.log('Background sync: Retrying failed requests');
}