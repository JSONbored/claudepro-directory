/**
 * Unified Build Cache System
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.js';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CACHE_DIR = join(ROOT, '.build-cache');
const CACHE_FILE = join(CACHE_DIR, 'cache.json');
const CACHE_VERSION = '1.0.0';

interface CacheEntry {
  hash: string;
  timestamp: string;
  metadata?: {
    reason?: string;
    duration?: number;
    files?: string[];
  };
}

interface BuildCache {
  version: string;
  lastUpdated: string;
  caches: Record<string, CacheEntry>;
}

function loadCache(): BuildCache {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  if (!existsSync(CACHE_FILE)) {
    return {
      version: CACHE_VERSION,
      lastUpdated: new Date().toISOString(),
      caches: {},
    };
  }

  try {
    const content = readFileSync(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(content) as BuildCache;

    if (cache.version !== CACHE_VERSION) {
      logger.warn('Cache version mismatch, resetting', {
        oldVersion: cache.version,
        newVersion: CACHE_VERSION,
      });
      return {
        version: CACHE_VERSION,
        lastUpdated: new Date().toISOString(),
        caches: {},
      };
    }

    return cache;
  } catch (error) {
    const { normalizeError } = await import('@heyclaude/shared-runtime');
    const errorObj = normalizeError(error, 'Cache read error');
    logger.warn('Cache corrupted, resetting', { err: errorObj });
    return {
      version: CACHE_VERSION,
      lastUpdated: new Date().toISOString(),
      caches: {},
    };
  }
}

function saveCache(cache: BuildCache): void {
  cache.lastUpdated = new Date().toISOString();
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

export function computeHash(content: string | object): string {
  const input = typeof content === 'string' ? content : JSON.stringify(content);
  return createHash('sha256').update(input).digest('hex');
}

export function hasHashChanged(scriptKey: string, currentHash: string): boolean {
  const cache = loadCache();
  const stored = cache.caches[scriptKey];
  return !stored || stored.hash !== currentHash;
}

export function getHash(scriptKey: string): string | null {
  const cache = loadCache();
  return cache.caches[scriptKey]?.hash || null;
}

export function setHash(
  scriptKey: string,
  hash: string,
  metadata?: {
    reason?: string;
    duration?: number;
    files?: string[];
  }
): void {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const cache = loadCache();
      const entry: CacheEntry = {
        hash,
        timestamp: new Date().toISOString(),
      };
      if (metadata) {
        entry.metadata = metadata;
      }
      cache.caches[scriptKey] = entry;
      saveCache(cache);
      return;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(`Failed to update cache after ${maxRetries} attempts: ${error}`);
      }
      const backoffMs = 10 * 2 ** (attempt - 1);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, backoffMs);
    }
  }
}

export function clearHash(scriptKey: string): void {
  const cache = loadCache();
  delete cache.caches[scriptKey];
  saveCache(cache);
}

export function clearAllHashes(): void {
  const cache = loadCache();
  cache.caches = {};
  saveCache(cache);
}

export function getCacheKeys(): string[] {
  const cache = loadCache();
  return Object.keys(cache.caches);
}

export function getCacheStats(): {
  totalEntries: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  totalDuration: number;
} {
  const cache = loadCache();
  const entries = Object.entries(cache.caches);

  if (entries.length === 0) {
    return {
      totalEntries: 0,
      oldestEntry: null,
      newestEntry: null,
      totalDuration: 0,
    };
  }

  const sorted = entries.sort(
    (a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
  );

  const totalDuration = entries.reduce(
    (sum, [, entry]) => sum + (entry.metadata?.duration || 0),
    0
  );

  return {
    totalEntries: entries.length,
    oldestEntry: sorted[0]?.[0] || null,
    newestEntry: sorted[sorted.length - 1]?.[0] || null,
    totalDuration,
  };
}

export function printCache(): void {
  const cache = loadCache();
  // Use logger for structured logging, but format for CLI readability
  logger.info('Build Cache Contents', {
    version: cache.version,
    lastUpdated: cache.lastUpdated,
    entryCount: Object.keys(cache.caches).length,
  });

  if (Object.keys(cache.caches).length === 0) {
    logger.info('Cache is empty');
    return;
  }

  // Log each cache entry with structured data
  for (const [key, entry] of Object.entries(cache.caches)) {
    logger.info('Cache entry', {
      key,
      hash: entry.hash.slice(0, 16) + '...',
      timestamp: entry.timestamp,
      time: new Date(entry.timestamp).toLocaleString(),
      ...(entry.metadata?.reason && { reason: entry.metadata.reason }),
      ...(entry.metadata?.duration && { duration: `${entry.metadata.duration}ms` }),
      ...(entry.metadata?.files && entry.metadata.files.length > 0 && {
        files: entry.metadata.files.join(', '),
      }),
    });
  }
}
