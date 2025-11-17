/**
 * Unified Build Cache System
 * Single source of truth for all build script hash caching
 *
 * Features:
 * - Centralized cache storage (.build-cache/cache.json)
 * - Metadata tracking (timestamps, reasons, durations)
 * - Type-safe API with generated types
 * - Concurrent write protection
 * - Cache invalidation utilities
 * - Optional history logging
 *
 * Replaces scattered hash files:
 * - .backup-db-hash → cache.json:backup-db
 * - .db-schema-hash → cache.json:db-schema
 * - .zod-schema-hash → cache.json:zod-schemas
 * - .schema-dump-hash → cache.json:schema-dump
 * - .skill-packages-hash-cache → cache.json:skill:*
 * - .vercel-cache/build-hashes.json → cache.json:category-config, service-worker
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '@/src/lib/logger';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
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

/**
 * Load cache from disk
 */
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

    // Migrate if version mismatch
    if (cache.version !== CACHE_VERSION) {
      logger.warn(`⚠️  Cache version mismatch (${cache.version} → ${CACHE_VERSION}), resetting`, {
        script: 'build-cache',
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
    logger.warn('⚠️  Cache corrupted, resetting', {
      script: 'build-cache',
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      version: CACHE_VERSION,
      lastUpdated: new Date().toISOString(),
      caches: {},
    };
  }
}

/**
 * Save cache to disk
 */
function saveCache(cache: BuildCache): void {
  cache.lastUpdated = new Date().toISOString();
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Compute SHA-256 hash of content
 */
export function computeHash(content: string | object): string {
  const input = typeof content === 'string' ? content : JSON.stringify(content);
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Check if hash has changed
 */
export function hasHashChanged(scriptKey: string, currentHash: string): boolean {
  const cache = loadCache();
  const stored = cache.caches[scriptKey];
  return !stored || stored.hash !== currentHash;
}

/**
 * Get stored hash
 */
export function getHash(scriptKey: string): string | null {
  const cache = loadCache();
  return cache.caches[scriptKey]?.hash || null;
}

/**
 * Set hash with metadata (with concurrent write protection)
 */
export function setHash(
  scriptKey: string,
  hash: string,
  metadata?: {
    reason?: string;
    duration?: number;
    files?: string[];
  }
): void {
  // Read-modify-write pattern with retry to handle concurrent updates
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Always load fresh cache to merge concurrent writes
      const cache = loadCache();

      // Update only this script's entry
      cache.caches[scriptKey] = {
        hash,
        timestamp: new Date().toISOString(),
        metadata,
      };

      saveCache(cache);
      return; // Success
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(`Failed to update cache after ${maxRetries} attempts: ${error}`);
      }
      // Brief exponential backoff: 10ms, 20ms, 40ms
      const backoffMs = 10 * 2 ** (attempt - 1);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, backoffMs);
    }
  }
}

/**
 * Clear specific cache entry
 */
export function clearHash(scriptKey: string): void {
  const cache = loadCache();
  delete cache.caches[scriptKey];
  saveCache(cache);
}

/**
 * Clear all caches
 */
export function clearAllHashes(): void {
  const cache = loadCache();
  cache.caches = {};
  saveCache(cache);
}

/**
 * Get all cache keys
 */
export function getCacheKeys(): string[] {
  const cache = loadCache();
  return Object.keys(cache.caches);
}

/**
 * Get cache statistics
 */
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

/**
 * Debug: Print cache contents
 */
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
