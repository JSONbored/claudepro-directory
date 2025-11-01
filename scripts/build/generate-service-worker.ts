#!/usr/bin/env node

/**
 * Service Worker Generation Script - Database-First
 * Generates service-worker.js dynamically from category_configs table and SECURITY_CONFIG.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { getAllCategoryIds } from '../../src/lib/config/category-config.js';
import { SECURITY_CONFIG } from '../../src/lib/constants/security.js';
import { logger } from '../../src/lib/logger.js';
import { ParseStrategy, safeParse } from '../../src/lib/utils/data.utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../..');
const CACHE_DIR = join(ROOT_DIR, '.next', 'cache');
const HASH_FILE = join(CACHE_DIR, 'sw-hash.txt');
const TEMPLATE_PATH = join(ROOT_DIR, 'templates', 'service-worker.template.js');

async function generateServiceWorker() {
  const startTime = Date.now();
  logger.info('🔧 Generating service worker from category_configs table...');

  try {
    // Load service worker template
    const serviceWorkerTemplate = await readFile(TEMPLATE_PATH, 'utf-8');

    // Read package.json for version with production-grade parsing
    const packageJsonContent = await readFile(join(ROOT_DIR, 'package.json'), 'utf-8');
    const packageJsonSchema = z
      .object({
        version: z.string().optional(),
      })
      .passthrough();

    const packageJson = safeParse(packageJsonContent, packageJsonSchema, {
      strategy: ParseStrategy.VALIDATED_JSON,
    });
    const version = packageJson.version || '1.0.0';
    const cacheVersion = version.replace(/\./g, '-');

    // Get all category IDs dynamically from registry
    const categoryIds = getAllCategoryIds();
    logger.info(`📦 Found ${categoryIds.length} categories: ${categoryIds.join(', ')}`);

    // Generate content routes array
    // MODERNIZATION: All categories from registry, no special cases
    const contentRoutes = categoryIds.map((id) => `"/${id}"`);

    // Generate category pattern for detail pages
    const categoryPattern = categoryIds.join('|');

    // Generate allowed origins array from SECURITY_CONFIG
    const allowedOrigins = SECURITY_CONFIG.allowedOrigins.map((origin) => `"${origin}"`);

    // Replace placeholders in template
    const serviceWorkerCode = serviceWorkerTemplate
      .replace(/{{VERSION}}/g, version)
      .replace(/{{CACHE_VERSION}}/g, cacheVersion)
      .replace('{{ALLOWED_ORIGINS}}', `[\n  ${allowedOrigins.join(',\n  ')},\n]`)
      .replace('{{CONTENT_ROUTES}}', `[\n  ${contentRoutes.join(',\n  ')},\n]`)
      .replace('{{CATEGORY_PATTERN}}', categoryPattern);

    // Incremental caching: Check if service worker content changed
    const currentHash = createHash('sha256').update(serviceWorkerCode).digest('hex');
    const previousHash = existsSync(HASH_FILE) ? await readFile(HASH_FILE, 'utf-8') : '';

    if (currentHash === previousHash) {
      logger.info('✓ Service worker unchanged, skipping generation');
      logger.success(`✅ Service worker up-to-date (${Date.now() - startTime}ms)`);
      return true;
    }

    // Write to public/service-worker.js
    const outputPath = join(ROOT_DIR, 'public', 'service-worker.js');
    await writeFile(outputPath, serviceWorkerCode, 'utf-8');

    // Save hash for next build
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    await writeFile(HASH_FILE, currentHash, 'utf-8');

    const duration = Date.now() - startTime;
    logger.success(`✅ Service worker generated in ${duration}ms`);
    logger.info(`📝 Output: ${outputPath}`);
    logger.info(`🎯 Categories: ${categoryIds.length} routes cached`);
    logger.info(`🔒 Origins: ${SECURITY_CONFIG.allowedOrigins.length} origins allowed`);

    return true;
  } catch (err) {
    logger.error('❌ Service worker generation failed:', err);
    throw err;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateServiceWorker()
    .then(() => {
      logger.success('🎉 Service worker generation complete!');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('💥 Service worker generation failed:', err);
      process.exit(1);
    });
}

export { generateServiceWorker };
