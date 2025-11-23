/**
 * Unified Build Cache System
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
      console.warn(`⚠️  Cache version mismatch (${cache.version} → ${CACHE_VERSION}), resetting`);
      return {
        version: CACHE_VERSION,
        lastUpdated: new Date().toISOString(),
        caches: {},
      };
    }

    return cache;
  } catch (error) {
    console.warn(
      '⚠️  Cache corrupted, resetting',
      error instanceof Error ? error.message : String(error)
    );
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
  console.log('\n📦 Build Cache Contents\n');
  console.log(`Version: ${cache.version}`);
  console.log(`Last Updated: ${cache.lastUpdated}\n`);

  if (Object.keys(cache.caches).length === 0) {
    console.log('   (empty)\n');
    return;
  }

  for (const [key, entry] of Object.entries(cache.caches)) {
    console.log(`🔑 ${key}`);
    console.log(`   Hash: ${entry.hash.slice(0, 16)}...`);
    console.log(`   Time: ${new Date(entry.timestamp).toLocaleString()}`);
    if (entry.metadata?.reason) {
      console.log(`   Reason: ${entry.metadata.reason}`);
    }
    if (entry.metadata?.duration) {
      console.log(`   Duration: ${entry.metadata.duration}ms`);
    }
    if (entry.metadata?.files && entry.metadata.files.length > 0) {
      console.log(`   Files: ${entry.metadata.files.join(', ')}`);
    }
    console.log('');
  }
}
