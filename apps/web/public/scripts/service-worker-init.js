/**
 * Service Worker Registration Script
 * Production-ready implementation with comprehensive error handling
 *
 * Security considerations:
 * - Only registers on HTTPS (required for service workers)
 * - Validates origin to prevent malicious registrations
 * - Handles all error cases gracefully
 * - Respects user preferences (checks localStorage for opt-out)
 */

(function () {
  "use strict";

  // Development-only logging
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const log = isDev ? console.log.bind(console) : () => {};
  const error = isDev ? console.error.bind(console) : () => {};

  // Store interval ID for update check cleanup
  let updateCheckInterval = null;

  // Feature detection and security checks
  if (typeof window === "undefined") {
    return;
  }

  // Check if service worker API is available
  if (!("serviceWorker" in navigator)) {
    if (isDev) {
      log("[SW] Service worker API not available in this browser");
    }
    return;
  }

  // Verify register method exists (some browsers may have serviceWorker but not register)
  // Use optional chaining and explicit check to avoid errors
  if (
    !navigator.serviceWorker ||
    typeof navigator.serviceWorker.register !== "function"
  ) {
    // Silent return - service workers not supported in this context
    // Only log in development for debugging
    if (isDev) {
      log("[SW] Service worker API not fully supported in this browser/context");
    }
    return;
  }

  // Security check: HTTPS required (except localhost)
  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (isDev) {
      log("[SW] Service worker requires HTTPS (or localhost)");
    }
    return;
  }

  // Check if user has opted out of service workers (privacy preference)
  // Guard localStorage access - can throw SecurityError in restricted contexts
  try {
    if (localStorage.getItem("claudepro-disable-sw") === "true") {
      // Silent return - no need to log in production
      return;
    }
  } catch (err) {
    // If localStorage is unavailable (SecurityError, etc.), treat as not opted out
    // Allow service worker registration to proceed
    if (isDev) {
      log("[SW] localStorage access failed (treating as not opted out):", err);
    }
  }

  // Configuration
  const SW_PATH = "/service-worker.js";
  const SW_SCOPE = "/";
  const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // Check for updates every hour

  /**
   * Register service worker with proper error handling
   */
  async function registerServiceWorker() {
    // Double-check register method is available before attempting registration
    // This is a defensive check - we already checked above, but verify again
    if (
      !navigator.serviceWorker ||
      typeof navigator.serviceWorker.register !== "function"
    ) {
      // Silent return - don't log errors for unsupported browsers
      if (isDev) {
        log("[SW] Service worker register method not available - browser may not support SW");
      }
      return null;
    }

    // Verify service worker file exists by attempting to fetch it
    // This helps catch path issues early
    try {
      const swUrl = new URL(SW_PATH, window.location.origin);
      const response = await fetch(swUrl, { method: "HEAD", cache: "no-store" });
      if (!response.ok) {
        // Log in dev, but don't block registration (might be first load or build issue)
        if (isDev) {
          log("[SW] Service worker file check:", {
            status: response.status,
            statusText: response.statusText,
            url: swUrl.href,
            note: response.status === 404 ? "File not found - may need to rebuild" : "Unexpected status",
          });
        }
        // Don't return early - let registration attempt proceed
        // Registration will fail gracefully if file doesn't exist
      } else if (isDev) {
        log("[SW] Service worker file verified:", swUrl.href);
      }
    } catch (fetchErr) {
      // Network error checking SW file - log but continue (might be offline or dev server)
      if (isDev) {
        log("[SW] Could not verify service worker file (this is OK in development):", {
          error: fetchErr.message,
          note: "Registration will proceed - file may be served by Next.js dev server",
        });
      }
      // Continue with registration attempt
    }

    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: SW_SCOPE,
        // Update on reload for better development experience
        updateViaCache: "none",
      });

      log("[SW] Service worker registered successfully", {
        scope: registration.scope,
        active: !!registration.active,
        waiting: !!registration.waiting,
        installing: !!registration.installing,
      });

      // Handle updates
      handleServiceWorkerUpdates(registration);

      // Check for updates periodically
      // Store interval ID for cleanup in unregister()
      updateCheckInterval = setInterval(() => {
        registration.update().catch((err) => {
          error("[SW] Update check failed:", err);
        });
      }, UPDATE_CHECK_INTERVAL);

      // Handle controller changes (new SW activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        log("[SW] New service worker activated");
        // Optionally show update notification to user
        showUpdateNotification();
      });

      return registration;
    } catch (err) {
      // Enhanced error handling with specific error types
      if (err.name === "SecurityError") {
        error("[SW] Registration blocked by security policy - check HTTPS/localhost");
      } else if (err.name === "TypeError") {
        if (err.message && (err.message.includes("register") || err.message.includes("not a function"))) {
          // This shouldn't happen due to our checks, but handle gracefully
          // Use log instead of error since this is expected for unsupported browsers
          if (isDev) {
            log("[SW] Service worker register method not available (expected for unsupported browsers)", {
              message: err.message,
            });
          }
        } else {
          error("[SW] Invalid service worker URL or scope", {
            path: SW_PATH,
            scope: SW_SCOPE,
            origin: window.location.origin,
            fullUrl: new URL(SW_PATH, window.location.origin).href,
            errorMessage: err.message,
          });
        }
      } else if (err.name === "NetworkError" || err.message?.includes("network")) {
        error("[SW] Network error while fetching service worker", {
          path: SW_PATH,
          message: err.message,
        });
      } else {
        error("[SW] Registration failed:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
          path: SW_PATH,
          scope: SW_SCOPE,
        });
      }

      // Don't throw - allow page to continue loading
      return null;
    }
  }

  /**
   * Handle service worker updates gracefully
   */
  function handleServiceWorkerUpdates(registration) {
    // Handle waiting service worker (update available)
    if (registration.waiting) {
      promptUserToUpdate(registration.waiting);
    }

    // Listen for new waiting workers
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New version available
            promptUserToUpdate(newWorker);
          }
        });
      }
    });
  }

  /**
   * Prompt user to refresh for updates (production-friendly)
   */
  function promptUserToUpdate(worker) {
    // Only show update prompt if page has been visible for more than 30 seconds
    // This prevents annoying users immediately after they load the page
    // Use Navigation Timing Level 2 API with fallbacks
    let pageLoadTime = 0;
    const navEntries = performance.getEntriesByType('navigation');
    const navEntry = navEntries && navEntries.length > 0 ? navEntries[0] : null;
    
    if (navEntry && navEntry.loadEventEnd && navEntry.loadEventEnd > 0) {
      // Navigation Timing Level 2 API
      pageLoadTime = performance.timeOrigin + navEntry.loadEventEnd;
    } else if (performance.timing && performance.timing.loadEventEnd && performance.timing.loadEventEnd > 0) {
      // Fallback to deprecated performance.timing
      pageLoadTime = performance.timing.loadEventEnd;
    } else {
      // Fallback: treat page as just loaded
      pageLoadTime = Date.now();
    }
    
    const timeSinceLoad = Date.now() - pageLoadTime;
    
    // Guard against NaN/undefined values
    if (isNaN(timeSinceLoad) || timeSinceLoad < 0) {
      // If we can't determine load time, treat as just loaded
      worker.postMessage({ type: "SKIP_WAITING" });
      return;
    }

    if (timeSinceLoad < 30000) {
      // Auto-update silently if page just loaded
      worker.postMessage({ type: "SKIP_WAITING" });
      return;
    }

    // Store update availability for potential UI notification
    window.claudeProSWUpdate = {
      available: true,
      worker: worker,
      applyUpdate: () => {
        worker.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      },
    };

    log(
      "[SW] Update available. Call window.claudeProSWUpdate.applyUpdate() to activate.",
    );
  }

  /**
   * Show update notification (integrate with your toast/notification system)
   */
  function showUpdateNotification() {
    // Dispatch custom event that your React app can listen to
    window.dispatchEvent(
      new CustomEvent("sw-update-available", {
        detail: {
          message: "New version available! Refresh to update.",
          action: () => {
            if (
              window.claudeProSWUpdate &&
              window.claudeProSWUpdate.applyUpdate
            ) {
              window.claudeProSWUpdate.applyUpdate();
            } else {
              window.location.reload();
            }
          },
        },
      }),
    );
  }

  /**
   * Clean up old caches if needed (for major version updates)
   */
  async function cleanupOldCaches() {
    if (!("caches" in window)) return;

    try {
      const cacheNames = await caches.keys();
      const currentCachePrefix = "claudepro-";
      // IMPORTANT: These cache names must match the ones in service-worker.js
      // Current version: v1-1-0 (matches service-worker.js)
      const validCaches = [
        "claudepro-static-v1-1-0",
        "claudepro-dynamic-v1-1-0",
        "claudepro-api-v1-1-0",
      ];

      const deletePromises = cacheNames
        .filter(
          (name) =>
            name.startsWith(currentCachePrefix) && !validCaches.includes(name),
        )
        .map((name) => caches.delete(name));

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        log("[SW] Cleaned up", deletePromises.length, "old cache(s)");
      }
    } catch (err) {
      error("[SW] Cache cleanup failed:", err);
    }
  }

  /**
   * Initialize service worker when page loads
   */
  function init() {
    // Wait for DOM to be ready before attempting registration
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        initServiceWorker();
      });
    } else {
      // DOM already ready, but wait for window load to avoid blocking
      window.addEventListener(
        "load",
        () => {
          initServiceWorker();
        },
        { once: true },
      );
    }
  }

  /**
   * Initialize service worker (separated for better error handling)
   */
  async function initServiceWorker() {
    // Final safety check before attempting anything
    if (
      typeof window === "undefined" ||
      !navigator.serviceWorker ||
      typeof navigator.serviceWorker.register !== "function"
    ) {
      // Service workers not supported - silent return
      if (isDev) {
        log("[SW] Service workers not supported in this environment");
      }
      return;
    }

    try {
      // Clean up old caches first
      await cleanupOldCaches();

      // Register service worker
      const registration = await registerServiceWorker();

      if (registration) {
        // Mark PWA as ready
        if (typeof window !== "undefined") {
          window.claudeProPWAReady = true;
          window.dispatchEvent(new Event("pwa-ready"));
          if (isDev) {
            log("[SW] PWA ready - service worker active");
          }
        }
      } else {
        // Registration returned null (failed but handled gracefully)
        if (typeof window !== "undefined") {
          window.claudeProPWAReady = false;
          if (isDev) {
            log("[SW] Service worker registration returned null - service workers may not be supported");
          }
        }
      }
    } catch (err) {
      // Mark PWA as failed but don't break the app
      if (typeof window !== "undefined") {
        window.claudeProPWAReady = false;
        window.claudeProPWAError = err;
        window.dispatchEvent(new Event("pwa-error"));
      }
      // Only log errors in development
      if (isDev) {
        error("[SW] Service worker initialization failed:", err);
      }
    }
  }

  // Initialize
  init();

  /**
   * PWA Install Tracking
   * Track when users install the app to their home screen
   */
  let deferredPrompt = null;

  // Capture the beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    log("[PWA] Install prompt ready");
    // Note: We no longer track 'pwa-installable' events - only track actual installs
  });

  // Track the installation
  window.addEventListener("appinstalled", () => {
    log("[PWA] App installed successfully");

    // Clear the deferred prompt
    deferredPrompt = null;

    // Dispatch custom event for app to show success message
    window.dispatchEvent(new CustomEvent("pwa-installed"));
  });

  // Track when app is launched from home screen
  if (window.matchMedia("(display-mode: standalone)").matches) {
    log("[PWA] App launched in standalone mode");
  }

  // Expose control functions for debugging and user preferences
  // All methods guard against missing APIs and handle errors gracefully
  window.claudeProSW = {
    unregister: async () => {
      if (!navigator.serviceWorker || typeof navigator.serviceWorker.getRegistrations !== "function") {
        return { success: false, error: "Service worker API not available" };
      }

      try {
        // Clear update check interval if running
        if (updateCheckInterval) {
          clearInterval(updateCheckInterval);
          updateCheckInterval = null;
        }
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        try {
          localStorage.setItem("claudepro-disable-sw", "true");
        } catch (err) {
          if (isDev) {
            log("[SW] Failed to set localStorage:", err);
          }
        }
        log("[SW] Service worker unregistered and disabled");
        return { success: true };
      } catch (err) {
        if (isDev) {
          error("[SW] Unregister failed:", err);
        }
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
      }
    },
    enable: () => {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("claudepro-disable-sw");
        }
        if (typeof window !== "undefined" && window.location) {
          window.location.reload();
        }
        return { success: true };
      } catch (err) {
        if (isDev) {
          error("[SW] Enable failed:", err);
        }
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
      }
    },
    status: async () => {
      if (!navigator.serviceWorker || typeof navigator.serviceWorker.getRegistration !== "function") {
        return {
          registered: false,
          active: null,
          waiting: null,
          scope: null,
          error: "Service worker API not available",
        };
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          registered: !!registration,
          active: registration?.active?.state || null,
          waiting: !!registration?.waiting,
          scope: registration?.scope || null,
        };
      } catch (err) {
        if (isDev) {
          error("[SW] Status check failed:", err);
        }
        return {
          registered: false,
          active: null,
          waiting: null,
          scope: null,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    },
    // PWA Install Control
    install: async () => {
      if (!deferredPrompt) {
        log("[PWA] No install prompt available");
        return { success: false, outcome: "no_prompt" };
      }

      try {
        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        log("[PWA] User choice:", outcome);

        // Clear the prompt
        deferredPrompt = null;

        return {
          success: outcome === "accepted",
          outcome,
        };
      } catch (err) {
        log("[PWA] Install prompt failed:", err);
        deferredPrompt = null;
        return { success: false, outcome: "error", error: err instanceof Error ? err.message : "Unknown error" };
      }
    },
    isInstallable: () => {
      return deferredPrompt !== null;
    },
  };
})();
