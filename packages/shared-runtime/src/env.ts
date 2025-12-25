type EnvRecord = Record<string, string | undefined>;

interface GlobalEnv {
  process?: {
    env?: EnvRecord;
  };
  // Global Infisical cache interface (populated by server-only code)
  __INFISICAL_CACHE__?: {
    getSecret: (name: string) => string | undefined;
    isInitialized: () => boolean;
    getCachedSecretNames: () => string[];
  };
}

const globalEnv = globalThis as GlobalEnv;
const envCache = new Map<string, string | undefined>();

/**
 * NEXT_PUBLIC_* variables must be explicitly referenced for Next.js to inline them.
 * Next.js replaces `process.env.NEXT_PUBLIC_X` at build time, but NOT dynamic access
 * like `process.env[name]` or `{...process.env}`.
 *
 * This object provides explicit references that Next.js can inline at build time.
 * IMPORTANT: Must use bracket notation for TypeScript index signature compliance,
 * but Next.js still inlines these because the string literals are statically analyzable.
 *
 * MAINTENANCE: When adding new NEXT_PUBLIC_* env vars, add them here too!
 * @see https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser
 *
 * Note: Using lazy initialization via getter function to avoid temporal dead zone issues
 * during module initialization when called from validateEnv() in schemas/env.ts.
 * Using IIFE to create cache object immediately at module scope to avoid TDZ.
 */
const _nextPublicEnvVarsCache = (() => {
  const cache: { value: EnvRecord | null } = { value: null };
  return cache;
})();

function getNextPublicEnvVars(): EnvRecord {
  if (_nextPublicEnvVarsCache.value === null) {
    _nextPublicEnvVarsCache.value = {
      // Supabase - required for client-side database access
      NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      // URLs
      NEXT_PUBLIC_SITE_URL: process.env['NEXT_PUBLIC_SITE_URL'],
      NEXT_PUBLIC_BASE_URL: process.env['NEXT_PUBLIC_BASE_URL'],
      NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
      NEXT_PUBLIC_FLUX_STATION_URL: process.env['NEXT_PUBLIC_FLUX_STATION_URL'],
      // Logging (for client-side logger config)
      NEXT_PUBLIC_LOGGER_CONSOLE: process.env['NEXT_PUBLIC_LOGGER_CONSOLE'],
      NEXT_PUBLIC_LOGGER_VERBOSE: process.env['NEXT_PUBLIC_LOGGER_VERBOSE'],
    };
  }
  return _nextPublicEnvVarsCache.value;
}

function normalizeValue(value: null | string | undefined): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value;
}

/**
 * Check if Infisical cache is available (via global interface)
 *
 * The Infisical cache is registered on globalThis by server-only code.
 * This allows env.ts to check the cache without importing server-only modules,
 * which prevents Turbopack from analyzing server-only imports in client components.
 */
function getInfisicalCache(): GlobalEnv['__INFISICAL_CACHE__'] {
  return globalEnv.__INFISICAL_CACHE__;
}

/**
 * Read environment variable with Infisical integration
 *
 * Priority order (when Infisical enabled):
 * 1. envCache (cached value - fastest)
 * 2. Infisical cache (if initialized and enabled) - checked synchronously if module loaded
 * 3. NEXT_PUBLIC_* vars (for client-side vars - build-time inlining)
 * 4. process.env (Node.js environment)
 *
 * Note: NEXT_PUBLIC_* vars skip Infisical to ensure build-time inlining works.
 * Infisical cache is lazy-loaded - first access uses process.env, subsequent accesses use cache.
 */
function readEnv(name: string): string | undefined {
  // Check cache first (fastest path - includes previously resolved Infisical values)
  if (envCache.has(name)) {
    return envCache.get(name);
  }

  let value: string | undefined;

  // Priority 1: Check Infisical cache (if initialized and enabled)
  // Skip for NEXT_PUBLIC_* vars to ensure build-time inlining works
  // Uses global interface to avoid importing server-only modules
  if (!name.startsWith('NEXT_PUBLIC_')) {
    const infisicalCache = getInfisicalCache();

    // If cache is available and initialized, check it synchronously
    if (infisicalCache && infisicalCache.isInitialized()) {
      const infisicalValue = infisicalCache.getSecret(name);
      // Only use Infisical value if it's a non-null string (null means secret not found)
      if (infisicalValue !== undefined && infisicalValue !== null) {
        value = normalizeValue(infisicalValue);
        // Cache in envCache for faster subsequent access
        envCache.set(name, value);
        return value;
      }
    }
  }

  // Priority 2: For NEXT_PUBLIC_* variables, use the pre-inlined values first (works on client)
  // These skip Infisical to ensure Next.js build-time inlining works correctly
  if (name.startsWith('NEXT_PUBLIC_')) {
    const nextPublicVars = getNextPublicEnvVars();
    if (name in nextPublicVars) {
      value = normalizeValue(nextPublicVars[name]);
    }
  }

  // Priority 3: Node.js environment (server-side)
  // This is the fallback if Infisical is disabled or secret not found
  const nodeEnv = globalEnv.process?.env;
  if (!value && nodeEnv) {
    value = normalizeValue(nodeEnv[name]);
  }

  // Cache the resolved value (from Infisical or process.env)
  envCache.set(name, value);
  return value;
}

export function getEnvVar(name: string): string | undefined {
  return readEnv(name);
}

export function requireEnvVar(name: string, message?: string): string {
  const value = readEnv(name);
  if (value === undefined) {
    throw new Error(message ?? `Missing required environment variable: ${name}`);
  }
  return value;
}

export function getNumberEnvVar(name: string, fallback?: number): number | undefined {
  const value = readEnv(name);
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getBooleanEnvVar(name: string, fallback?: boolean): boolean | undefined {
  const value = readEnv(name);
  if (value === undefined) {
    return fallback;
  }
  if (/^(true|1|yes|on)$/i.test(value)) {
    return true;
  }
  if (/^(false|0|no|off)$/i.test(value)) {
    return false;
  }
  return fallback;
}

/**
 * Get all environment variables as a record
 *
 * This function is used by validateEnv() for schema validation.
 * It includes Infisical cache values (if initialized) with priority over process.env.
 *
 * Priority order:
 * 1. Infisical cache (if initialized, for non-NEXT_PUBLIC_* vars)
 * 2. NEXT_PUBLIC_* vars (from inlined values or process.env)
 * 3. process.env (Node.js environment)
 *
 * Note: Infisical cache is async-initialized, so first call may use process.env only.
 */
export function getEnvObject(): EnvRecord {
  // Check if we're in build phase - during build, Next.js may have inlined truncated values
  // Read directly from process.env instead of using inlined NEXT_PUBLIC_ENV_VARS
  const isBuildPhase =
    typeof process !== 'undefined' &&
    process.env &&
    (process.env['NEXT_PHASE'] === 'phase-production-build' ||
      process.env['NEXT_PHASE'] === 'phase-production-server');

  // During build, read directly from process.env to avoid using truncated inlined values
  // At runtime, use inlined values for client-side compatibility
  // Use try-catch to handle cases where getNextPublicEnvVars() is called during module initialization
  let record: EnvRecord = {};
  if (!isBuildPhase) {
    try {
      record = { ...getNextPublicEnvVars() };
    } catch {
      // If cache isn't ready yet (TDZ), read directly from process.env for NEXT_PUBLIC_* vars
      // This handles the circular dependency case during module initialization
      if (typeof process !== 'undefined' && process.env) {
        const nextPublicVars: EnvRecord = {};
        const nextPublicKeys = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          'NEXT_PUBLIC_SITE_URL',
          'NEXT_PUBLIC_BASE_URL',
          'NEXT_PUBLIC_APP_URL',
          'NEXT_PUBLIC_FLUX_STATION_URL',
          'NEXT_PUBLIC_LOGGER_CONSOLE',
          'NEXT_PUBLIC_LOGGER_VERBOSE',
        ];
        for (const key of nextPublicKeys) {
          if (key in process.env) {
            nextPublicVars[key] = normalizeValue(process.env[key]);
          }
        }
        record = nextPublicVars;
      }
    }
  }

  // Node.js environment (server-side) - merge with NEXT_PUBLIC_* vars
  // Normalize all values to convert empty strings to undefined
  const nodeEnv = globalEnv.process?.env;
  let normalized: EnvRecord = {};
  if (nodeEnv) {
    for (const [key, value] of Object.entries(nodeEnv)) {
      normalized[key] = normalizeValue(value);
    }
  }

  // Merge Infisical cache values (if initialized) - they take priority over process.env
  // Skip for NEXT_PUBLIC_* vars (handled above) and build phase
  if (!isBuildPhase) {
    const infisicalCache = getInfisicalCache();
    if (infisicalCache && infisicalCache.isInitialized()) {
      // Get all cached secret names
      const cachedNames = infisicalCache.getCachedSecretNames();
      for (const secretName of cachedNames) {
        // Skip NEXT_PUBLIC_* vars (handled separately for build-time inlining)
        if (!secretName.startsWith('NEXT_PUBLIC_')) {
          const infisicalValue = infisicalCache.getSecret(secretName);
          if (infisicalValue !== undefined) {
            // Infisical values take priority over process.env
            normalized[secretName] = normalizeValue(infisicalValue);
          }
        }
      }
    }
  }

  // During build, use process.env directly (avoids truncated inlined values)
  // At runtime, merge with inlined values for client compatibility
  return isBuildPhase ? normalized : { ...record, ...normalized };
}

export function clearEnvCache(): void {
  envCache.clear();
}

export function getNodeEnv(): string | undefined {
  return readEnv('NODE_ENV');
}

export const isDevelopment = getNodeEnv() === 'development';
export const isProduction = getNodeEnv() === 'production';
// Use platform detection utility for platform-agnostic checks
export { isVercel } from './platform/index.ts';
