/**
 * Unified Hash Cache - Centralized build artifact caching
 * Consolidates 5 separate hash files into single JSON file
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const CACHE_DIR = join(ROOT, '.vercel-cache');
const CACHE_FILE = join(CACHE_DIR, 'build-hashes.json');

export type HashCacheKey =
  | 'schema-dump'
  | 'db-schema'
  | 'zod-schema'
  | 'skill-packages'
  | 'backup-db'
  | 'category-config'
  | 'service-worker';

interface HashCache {
  [key: string]: string;
}

/**
 * Load unified hash cache
 */
export function loadHashCache(): HashCache {
  if (!existsSync(CACHE_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Get hash for specific key
 */
export function getHash(key: HashCacheKey): string | null {
  const cache = loadHashCache();
  return cache[key] || null;
}

/**
 * Set hash for specific key
 */
export function setHash(key: HashCacheKey, hash: string): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  const cache = loadHashCache();
  cache[key] = hash;
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Check if hash has changed
 */
export function hasHashChanged(key: HashCacheKey, newHash: string): boolean {
  const currentHash = getHash(key);
  return currentHash !== newHash;
}
