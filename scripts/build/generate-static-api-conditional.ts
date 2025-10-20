#!/usr/bin/env node
/**
 * Conditional Static API Generator
 * 
 * Smart build optimization that only generates static API files when needed:
 * - SKIP on preview builds (saves ~10s every preview)
 * - SKIP on production if content unchanged (saves ~10s most deployments)
 * - GENERATE on production when content actually changed
 * 
 * Uses hash-based detection with Vercel build cache persistence.
 * 
 * @module scripts/build/generate-static-api-conditional
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const CACHE_FILE = join(ROOT_DIR, '.next', 'cache', 'static-api-hash.json');

/**
 * Environment detection
 */
const VERCEL_ENV = process.env.VERCEL_ENV || 'development';
const isProduction = VERCEL_ENV === 'production';
const isPreview = VERCEL_ENV === 'preview';

/**
 * Hash all content files to detect changes
 * Only hashes content directory since that's what feeds static API
 */
async function hashContentDirectory(): Promise<string> {
  console.log('📊 Calculating content hash...');
  
  const contentDir = join(ROOT_DIR, 'content');
  const files = await glob('**/*.{json,mdx}', { cwd: contentDir });
  
  if (files.length === 0) {
    console.warn('⚠️  No content files found');
    return 'empty';
  }
  
  const fileHashes = await Promise.all(
    files.map(async (file) => {
      const filepath = join(contentDir, file);
      const content = await readFile(filepath);
      return createHash('sha256').update(content).digest('hex');
    })
  );
  
  const combinedHash = createHash('sha256')
    .update(fileHashes.join(''))
    .digest('hex');
  
  console.log(`   Files hashed: ${files.length}`);
  console.log(`   Content hash: ${combinedHash.substring(0, 12)}...`);
  
  return combinedHash;
}

/**
 * Load hash cache (persisted in Vercel build cache)
 */
async function loadHashCache(): Promise<{ contentHash?: string } | null> {
  try {
    const cacheContent = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(cacheContent);
  } catch {
    return null;
  }
}

/**
 * Save hash cache
 */
async function saveHashCache(contentHash: string): Promise<void> {
  const cacheDir = join(ROOT_DIR, '.next', 'cache');
  await mkdir(cacheDir, { recursive: true });
  
  await writeFile(
    CACHE_FILE,
    JSON.stringify({
      contentHash,
      timestamp: new Date().toISOString(),
      environment: VERCEL_ENV,
    }, null, 2)
  );
}

/**
 * Main conditional generation logic
 */
async function main() {
  console.log('🔍 Static API Generation - Conditional Check\n');
  console.log(`   Environment: ${VERCEL_ENV}`);
  console.log(`   Production: ${isProduction}`);
  console.log(`   Preview: ${isPreview}\n`);
  
  // OPTIMIZATION 1: Always skip preview builds
  if (isPreview) {
    console.log('⚡ SKIP: Preview build detected');
    console.log('   → Preview builds use serverless API routes');
    console.log('   → Saves ~10 seconds build time\n');
    process.exit(0);
  }
  
  // OPTIMIZATION 2: Skip if content unchanged (production only)
  if (isProduction) {
    const currentHash = await hashContentDirectory();
    const cache = await loadHashCache();
    
    if (cache?.contentHash === currentHash) {
      console.log('✓ SKIP: Content unchanged since last build');
      console.log('   → Static API files are already up to date');
      console.log('   → Saves ~10 seconds build time\n');
      process.exit(0);
    }
    
    console.log('⚡ GENERATE: Content changed, static API needs update\n');
    
    // Generate static API files
    const { generateStaticAPI } = await import('./generate-static-api.js');
    await generateStaticAPI();
    
    // Save new hash to cache
    await saveHashCache(currentHash);
    
    console.log('\n✓ Static API generation complete');
    console.log('   → Files cached in .next/cache/ (persists across Vercel builds)');
    process.exit(0);
  }
  
  // Development/local builds: Skip by default (use serverless routes)
  console.log('⚡ SKIP: Local development build');
  console.log('   → Use serverless API routes for local development');
  console.log('   → To test static API locally: npm run generate:static-api\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Static API conditional check failed:', error);
  process.exit(1);
});
