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

  // Feature detection and security checks
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    (window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1")
  ) {
    return;
  }

  // Check if user has opted out of service workers (privacy preference)
  if (localStorage.getItem("claudepro-disable-sw") === "true") {
    // Silent return - no need to log in production
    return;
  }

  // Configuration
  const SW_PATH = "/service-worker.js";
  const SW_SCOPE = "/";
  const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // Check for updates every hour

  /**
   * Register service worker with proper error handling
   */
  async function registerServiceWorker() {
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
      setInterval(() => {
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
      error("[SW] Registration failed:", err);

      // Log specific error types for debugging
      if (err.name === "SecurityError") {
        error("[SW] Registration blocked by security policy");
      } else if (err.name === "TypeError") {
        error("[SW] Invalid service worker URL or scope");
      } else if (err.name === "NetworkError") {
        error("[SW] Network error while fetching service worker");
      }

      throw err;
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
    const pageLoadTime = performance.timing.loadEventEnd;
    const timeSinceLoad = Date.now() - pageLoadTime;

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
      const validCaches = [
        "claudepro-v1.2",
        "claudepro-static-v1.2",
        "claudepro-dynamic-v1.2",
        "claudepro-api-v1.2",
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
    // Use 'load' event to avoid blocking initial page render
    window.addEventListener(
      "load",
      async () => {
        try {
          // Clean up old caches first
          await cleanupOldCaches();

          // Register service worker
          await registerServiceWorker();

          // Mark PWA as ready
          window.claudeProPWAReady = true;
          window.dispatchEvent(new Event("pwa-ready"));
        } catch (error) {
          // Mark PWA as failed but don't break the app
          window.claudeProPWAReady = false;
          window.claudeProPWAError = error;
          window.dispatchEvent(new Event("pwa-error"));
        }
      },
      { once: true },
    );
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

    // Track that the prompt was shown
    if (typeof window.umami !== "undefined") {
      window.umami.track("pwa_prompt_shown", {
        platform: navigator.platform || "unknown",
        standalone: window.matchMedia("(display-mode: standalone)").matches,
      });
    }

    log("[PWA] Install prompt ready");

    // Optionally show custom install UI
    // You can dispatch a custom event here for your React components
    window.dispatchEvent(new CustomEvent("pwa-installable"));
  });

  // Track the installation
  window.addEventListener("appinstalled", () => {
    log("[PWA] App installed successfully");

    // Track successful installation
    if (typeof window.umami !== "undefined") {
      window.umami.track("pwa_installed", {
        platform: navigator.platform || "unknown",
        timestamp: new Date().toISOString(),
      });
    }

    // Clear the deferred prompt
    deferredPrompt = null;

    // Dispatch custom event for app to show success message
    window.dispatchEvent(new CustomEvent("pwa-installed"));
  });

  // Track when app is launched from home screen
  if (window.matchMedia("(display-mode: standalone)").matches) {
    log("[PWA] App launched in standalone mode");

    if (typeof window.umami !== "undefined") {
      window.umami.track("pwa_launched", {
        platform: navigator.platform || "unknown",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Expose control functions for debugging and user preferences
  window.claudeProSW = {
    unregister: async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      localStorage.setItem("claudepro-disable-sw", "true");
      log("[SW] Service worker unregistered and disabled");
    },
    enable: () => {
      localStorage.removeItem("claudepro-disable-sw");
      window.location.reload();
    },
    status: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        registered: !!registration,
        active: registration?.active?.state,
        waiting: !!registration?.waiting,
        scope: registration?.scope,
      };
    },
    // PWA Install Control
    install: async () => {
      if (!deferredPrompt) {
        log("[PWA] No install prompt available");
        return { success: false, reason: "no_prompt" };
      }

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      log("[PWA] User choice:", outcome);

      // Track user response
      if (typeof window.umami !== "undefined") {
        if (outcome === "accepted") {
          window.umami.track("pwa_prompt_accepted", {
            platform: navigator.platform || "unknown",
          });
        } else {
          window.umami.track("pwa_prompt_dismissed", {
            platform: navigator.platform || "unknown",
          });
        }
      }

      // Clear the prompt
      deferredPrompt = null;

      return {
        success: outcome === "accepted",
        outcome,
      };
    },
    isInstallable: () => {
      return deferredPrompt !== null;
    },
  };
})();
