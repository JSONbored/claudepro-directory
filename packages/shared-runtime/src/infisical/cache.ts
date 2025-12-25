/**
 * Infisical Secret Cache
 *
 * Caches Infisical secrets in memory for synchronous access.
 * Secrets are pre-loaded at application startup via initializeInfisicalSecrets().
 *
 * This module bridges the async Infisical SDK with synchronous env var access.
 * The cache is registered on `globalThis.__INFISICAL_CACHE__` to allow `env.ts`
 * to access it without direct imports (avoiding Turbopack build issues).
 *
 * **Usage:**
 * ```ts
 * import { initializeInfisicalSecrets } from '@heyclaude/shared-runtime/infisical/cache';
 *
 * // Initialize cache with common secrets
 * await initializeInfisicalSecrets();
 *
 * // Or specify which secrets to pre-fetch
 * await initializeInfisicalSecrets(['DATABASE_URL', 'API_KEY']);
 * ```
 *
 * **Testing:**
 * ```ts
 * import { clearInfisicalCache } from '@heyclaude/shared-runtime/infisical/cache';
 *
 * beforeEach(() => {
 *   clearInfisicalCache(); // Clear cache for fresh test runs
 * });
 * ```
 *
 * **Server-only:** This module uses server-only APIs and must not be imported in client components.
 */

import 'server-only';

// Global interface for registering Infisical cache (to avoid importing in env.ts)
interface GlobalEnv {
  __INFISICAL_CACHE__?: {
    getSecret: (name: string) => string | undefined;
    isInitialized: () => boolean;
    getCachedSecretNames: () => string[];
  };
}

const globalEnv = globalThis as GlobalEnv;

// Dynamic import to avoid circular dependencies
// The Infisical client imports env schema, so we import it dynamically
type InfisicalClientModule = typeof import('./client.ts');

// In-memory cache of Infisical secrets
const infisicalCache = new Map<string, string | undefined>();

// Track initialization state
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;
let initializationError: Error | null = null;

/**
 * List of common environment variables to pre-fetch from Infisical
 * This reduces API calls by fetching all needed secrets at once
 */
const COMMON_SECRET_NAMES = [
  // Database
  'POSTGRES_PRISMA_URL',
  'DIRECT_URL',
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  // Email (Resend)
  'RESEND_API_KEY',
  'RESEND_AUDIENCE_ID',
  'RESEND_WEBHOOK_SECRET',
  // Inngest
  'INNGEST_EVENT_KEY',
  'INNGEST_SIGNING_KEY',
  'INNGEST_URL',
  // Monitoring
  'BETTERSTACK_API_TOKEN',
  'BETTERSTACK_HEARTBEAT_WEEKLY_TASKS',
  'BETTERSTACK_HEARTBEAT_CRITICAL_FAILURE',
  'BETTERSTACK_HEARTBEAT_INNGEST_CRON',
  // Webhooks
  'REVALIDATE_SECRET',
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  'POLAR_ENVIRONMENT',
  'DISCORD_CHANGELOG_WEBHOOK_URL',
  // GitHub
  'GITHUB_TOKEN',
  // IndexNow
  'INDEXNOW_API_KEY',
  'INDEXNOW_TRIGGER_KEY',
  // Infisical meta (for SDK authentication)
  'INFISICAL_CLIENT_ID',
  'INFISICAL_CLIENT_SECRET',
] as const;

/**
 * Initialize Infisical secret cache
 *
 * Fetches all secrets from Infisical (if enabled) and caches them for synchronous access.
 * This is called at application startup to pre-load secrets.
 *
 * Uses lazy async initialization - first call triggers fetch, subsequent calls wait for completion.
 *
 * @param secretNames - Optional list of secret names to pre-fetch. If not provided, uses COMMON_SECRET_NAMES.
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeInfisicalSecrets(secretNames?: readonly string[]): Promise<void> {
  // If already initialized, return immediately
  if (isInitialized) {
    if (initializationError) {
      // If there was an error, don't throw on subsequent calls
      // Just return silently (fallback to process.env)
      return;
    }
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      // Dynamic import to avoid circular dependency
      const infisicalModule = await import('./client.ts');
      const { isInfisicalEnabled, getInfisicalEnvironment, getInfisicalSecret } =
        infisicalModule as InfisicalClientModule;

      // Check if Infisical is enabled (checks feature flag and environment)
      // Note: isInfisicalEnabled() checks credentials, so if it returns false,
      // Infisical is disabled and we should skip initialization
      if (!isInfisicalEnabled()) {
        isInitialized = true;
        return; // Infisical disabled, skip initialization
      }

      // Get environment for fetching secrets
      const environment = getInfisicalEnvironment();

      // Use provided secret names or default list
      const secretsToFetch = secretNames || COMMON_SECRET_NAMES;

      // Fetch all secrets in parallel
      const secretPromises = secretsToFetch.map(async (secretName) => {
        try {
          const value = await getInfisicalSecret(secretName, environment);
          return { secretName, value, success: true };
        } catch (error) {
          // Individual secret fetch failures shouldn't block initialization
          // Return undefined for failed secrets
          return { secretName, value: undefined, success: false, error };
        }
      });

      const results = await Promise.allSettled(secretPromises);

      // Cache successful fetches
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { secretName, value } = result.value;
          // Only cache if value is defined (undefined means secret not found or error)
          // But we still cache undefined to avoid repeated API calls for missing secrets
          infisicalCache.set(secretName, value);
        }
      }

      isInitialized = true;

      // Register cache on global object for env.ts to access (avoids importing server-only module)
      globalEnv.__INFISICAL_CACHE__ = {
        getSecret: (name: string) => infisicalCache.get(name),
        isInitialized: () => isInitialized,
        getCachedSecretNames: () => Array.from(infisicalCache.keys()),
      };
    } catch (error) {
      // Log error but don't throw - allow fallback to process.env
      // This ensures the app continues to work even if Infisical fails
      initializationError = error instanceof Error ? error : new Error(String(error));
      isInitialized = true; // Mark as initialized to prevent retry loops

      // Only log in development to avoid noise in production
      if (
        typeof process !== 'undefined' &&
        process.env &&
        process.env['NODE_ENV'] === 'development'
      ) {
        console.warn(
          '[Infisical] Failed to initialize Infisical secrets cache:',
          initializationError.message
        );
        console.warn('[Infisical] Falling back to process.env for environment variables');
      }
    }
  })();

  await initializationPromise;
}

/**
 * Get secret from Infisical cache
 *
 * Returns cached secret value, or undefined if not found or cache not initialized.
 * This is synchronous and safe to call from readEnv().
 *
 * @param secretName - Name of the secret
 * @returns Secret value, or undefined if not found
 */
export function getInfisicalCachedSecret(secretName: string): string | undefined {
  return infisicalCache.get(secretName);
}

/**
 * Check if Infisical cache is initialized
 *
 * @returns true if cache initialization is complete, false otherwise
 */
export function isInfisicalCacheInitialized(): boolean {
  return isInitialized;
}

/**
 * Check if Infisical cache initialization failed
 *
 * @returns true if initialization failed, false otherwise
 */
export function hasInfisicalCacheError(): boolean {
  return initializationError !== null;
}

/**
 * Get Infisical cache initialization error
 *
 * @returns The initialization error, or null if no error
 */
export function getInfisicalCacheError(): Error | null {
  return initializationError;
}

/**
 * Clear Infisical cache (for testing)
 */
export function clearInfisicalCache(): void {
  infisicalCache.clear();
  isInitialized = false;
  initializationPromise = null;
  initializationError = null;
}

/**
 * Get all cached secret names (for debugging)
 *
 * @returns Array of secret names that are currently cached
 */
export function getCachedSecretNames(): string[] {
  return Array.from(infisicalCache.keys());
}
