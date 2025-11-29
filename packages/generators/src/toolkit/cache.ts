/**
 * Unified Build Cache System
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from './logger.js';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CACHE_DIR = path.join(ROOT, '.build-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const CACHE_VERSION = '1.0.0';

interface CacheEntry {
  hash: string;
  metadata?: {
    duration?: number;
    files?: string[];
    reason?: string;
  };
  timestamp: string;
}

interface BuildCache {
  caches: Record<string, CacheEntry>;
  lastUpdated: string;
  version: string;
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
    const content = readFileSync(CACHE_FILE, 'utf8');
    const cache = JSON.parse(content) as BuildCache;

    if (cache.version !== CACHE_VERSION) {
      logger.warn('Cache version mismatch, resetting', {
        command: 'cache',
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
    const errorObj = normalizeError(error, 'Cache read error');
    logger.warn('Cache corrupted, resetting', { command: 'cache', err: errorObj });
    return {
      version: CACHE_VERSION,
      lastUpdated: new Date().toISOString(),
      caches: {},
    };
  }
}

function saveCache(cache: BuildCache): void {
  cache.lastUpdated = new Date().toISOString();
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export function computeHash(content: object | string): string {
  const input = typeof content === 'string' ? content : JSON.stringify(content);
  return createHash('sha256').update(input).digest('hex');
}

export function hasHashChanged(scriptKey: string, currentHash: string): boolean {
  const cache = loadCache();
  const stored = cache.caches[scriptKey];
  return stored?.hash !== currentHash;
}

export function getHash(scriptKey: string): null | string {
  const cache = loadCache();
  return cache.caches[scriptKey]?.hash ?? null;
}

export function setHash(
  scriptKey: string,
  hash: string,
  metadata?: {
    duration?: number;
    files?: string[];
    reason?: string;
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
        const errorObj = normalizeError(error, 'Cache update failed');
        throw new Error(`Failed to update cache after ${maxRetries} attempts: ${errorObj.message}`);
      }
      const backoffMs = 10 * 2 ** (attempt - 1);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, backoffMs);
    }
  }
}

export function clearHash(scriptKey: string): void {
  const cache = loadCache();
  // Create new caches object without the specified key
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [scriptKey]: _, ...remainingCaches } = cache.caches;
  cache.caches = remainingCaches;
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
  newestEntry: null | string;
  oldestEntry: null | string;
  totalDuration: number;
  totalEntries: number;
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

  const sorted = entries.toSorted(
    (a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
  );

  const totalDuration = entries.reduce(
    (sum, [, entry]) => sum + (entry.metadata?.duration ?? 0),
    0
  );

  return {
    totalEntries: entries.length,
    oldestEntry: sorted[0]?.[0] ?? null,
    newestEntry: sorted.at(-1)?.[0] ?? null,
    totalDuration,
  };
}

export function printCache(): void {
  const cache = loadCache();
  // Use logger for structured logging, but format for CLI readability
  logger.info('Build Cache Contents', {
    command: 'cache',
    version: cache.version,
    lastUpdated: cache.lastUpdated,
    entryCount: Object.keys(cache.caches).length,
  });

  if (Object.keys(cache.caches).length === 0) {
    logger.info('Cache is empty', { command: 'cache' });
    return;
  }

  // Log each cache entry with structured data
  for (const [key, entry] of Object.entries(cache.caches)) {
    logger.info('Cache entry', {
      command: 'cache',
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
