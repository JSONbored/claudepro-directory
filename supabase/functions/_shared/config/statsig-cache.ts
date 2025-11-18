import { edgeEnv } from './env.ts';

/**
 * Statsig Cache Config Helper
 *
 * Loads Statsig dynamic config values (e.g., cache TTLs) and keeps them
 * available synchronously for edge functions. Falls back to static defaults
 * when Statsig credentials are missing or fetches fail.
 */

type CacheConfigMap = Record<string, unknown>;

const {
  statsig: {
    apiUrl: STATSIG_API_URL,
    serverSecret: STATSIG_SERVER_SECRET,
    configName: STATSIG_CONFIG_NAME,
    refreshIntervalMs: CACHE_REFRESH_INTERVAL_MS,
  },
} = edgeEnv;

let cachedConfig: CacheConfigMap | null = null;
let lastFetchedAt = 0;
let inflightRefresh: Promise<void> | null = null;
let hasLoggedFailure = false;

const statsigEnabled = Boolean(STATSIG_SERVER_SECRET);

async function fetchStatsigConfig(): Promise<void> {
  if (!statsigEnabled) {
    return;
  }

  const response = await fetch(STATSIG_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'statsig-api-key': STATSIG_SERVER_SECRET as string,
    },
    body: JSON.stringify({
      user: { userID: 'supabase-edge-cache' },
      configName: STATSIG_CONFIG_NAME,
      // Avoid unnecessary metadata to keep payload minimal
      includeConfigMetadata: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Statsig cache config request failed: ${response.status} ${response.statusText}`
    );
  }

  const payload = (await response.json()) as { value?: unknown } | null;
  if (!payload || typeof payload.value !== 'object' || payload.value === null) {
    throw new Error('Statsig cache config response missing value');
  }

  cachedConfig = payload.value as CacheConfigMap;
  lastFetchedAt = Date.now();
  hasLoggedFailure = false;
}

function scheduleRefreshIfNeeded(): void {
  if (!statsigEnabled) {
    return;
  }

  const needsRefresh = !cachedConfig || Date.now() - lastFetchedAt > CACHE_REFRESH_INTERVAL_MS;

  if (!needsRefresh || inflightRefresh) {
    return;
  }

  inflightRefresh = fetchStatsigConfig()
    .catch((error) => {
      if (!hasLoggedFailure) {
        console.warn('[statsig-cache] refresh failed', error);
        hasLoggedFailure = true;
      }
    })
    .finally(() => {
      inflightRefresh = null;
    });
}

// Kick off an initial fetch without blocking module evaluation. Callers will
// use default values until the config loads.
scheduleRefreshIfNeeded();

export function getCacheConfigNumber(key: string, fallback: number): number {
  if (!(statsigEnabled && cachedConfig)) {
    scheduleRefreshIfNeeded();
    return fallback;
  }

  scheduleRefreshIfNeeded();

  const value = cachedConfig[key];
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

export function getCacheConfigStringArray(key: string, fallback: string[]): string[] {
  if (!(statsigEnabled && cachedConfig)) {
    scheduleRefreshIfNeeded();
    return fallback;
  }

  scheduleRefreshIfNeeded();

  const value = cachedConfig[key];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  return fallback;
}
