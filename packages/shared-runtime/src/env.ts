type EnvRecord = Record<string, string | undefined>;

interface GlobalEnv {
  Deno?: {
    env?: {
      get?(key: string): string | undefined;
      toObject?(): Record<string, string>;
    };
  };
  process?: {
    env?: EnvRecord;
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
 */
const NEXT_PUBLIC_ENV_VARS: EnvRecord = {
  // Supabase - required for client-side database access
  NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  // Analytics
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env['NEXT_PUBLIC_UMAMI_WEBSITE_ID'],
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: process.env['NEXT_PUBLIC_UMAMI_SCRIPT_URL'],
  // Feature flags
  NEXT_PUBLIC_DEBUG_ANALYTICS: process.env['NEXT_PUBLIC_DEBUG_ANALYTICS'],
  NEXT_PUBLIC_ENABLE_PWA: process.env['NEXT_PUBLIC_ENABLE_PWA'],
  // URLs
  NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
  NEXT_PUBLIC_SITE_URL: process.env['NEXT_PUBLIC_SITE_URL'],
  NEXT_PUBLIC_BASE_URL: process.env['NEXT_PUBLIC_BASE_URL'],
  NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  // Edge functions
  NEXT_PUBLIC_FLUX_STATION_URL: process.env['NEXT_PUBLIC_FLUX_STATION_URL'],
  // Vercel platform
  NEXT_PUBLIC_VERCEL_PROJECT_ID: process.env['NEXT_PUBLIC_VERCEL_PROJECT_ID'],
  // Logging (for client-side logger config)
  NEXT_PUBLIC_LOGGER_CONSOLE: process.env['NEXT_PUBLIC_LOGGER_CONSOLE'],
  NEXT_PUBLIC_LOGGER_VERBOSE: process.env['NEXT_PUBLIC_LOGGER_VERBOSE'],
};

function normalizeValue(value: null | string | undefined): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value;
}

function readEnv(name: string): string | undefined {
  if (envCache.has(name)) {
    return envCache.get(name);
  }

  let value: string | undefined;

  // For NEXT_PUBLIC_* variables, use the pre-inlined values first (works on client)
  if (name.startsWith('NEXT_PUBLIC_') && name in NEXT_PUBLIC_ENV_VARS) {
    value = normalizeValue(NEXT_PUBLIC_ENV_VARS[name]);
  }

  // Deno environment (edge functions)
  const denoEnv = globalEnv.Deno?.env;
  if (!value && denoEnv?.get) {
    try {
      value = normalizeValue(denoEnv.get(name));
    } catch {
      value = undefined;
    }
  }

  // Node.js environment (server-side)
  const nodeEnv = globalEnv.process?.env;
  if (!value && nodeEnv) {
    value = normalizeValue(nodeEnv[name]);
  }

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

export function getEnvObject(): EnvRecord {
  // Start with NEXT_PUBLIC_* variables (inlined at build time, works on client)
  const record: EnvRecord = { ...NEXT_PUBLIC_ENV_VARS };

  // Deno environment (edge functions)
  const denoEnv = globalEnv.Deno?.env;
  if (denoEnv?.toObject) {
    const denoRecord = denoEnv.toObject();
    for (const [key, value] of Object.entries(denoRecord)) {
      record[key] = normalizeValue(value);
    }
    return record;
  }

  // Node.js environment (server-side) - merge with NEXT_PUBLIC_* vars
  const nodeEnv = globalEnv.process?.env;
  if (nodeEnv) {
    return { ...record, ...nodeEnv };
  }

  return record;
}

export function clearEnvCache(): void {
  envCache.clear();
}

export function getNodeEnv(): string | undefined {
  return readEnv('NODE_ENV');
}

export const isDevelopment = getNodeEnv() === 'development';
export const isProduction = getNodeEnv() === 'production';
export const isVercel = readEnv('VERCEL') === '1';
