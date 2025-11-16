#!/usr/bin/env node

/**
 * Service Worker Generation Script - Database-First
 * Generates service-worker.js dynamically from VALID_CATEGORIES and SECURITY_CONFIG.
 *
 * OPTIMIZATIONS:
 * - Static categories (no database call at build time)
 * - Input-based hashing (skips template rendering when inputs unchanged)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { ALL_CATEGORY_IDS } from '../../src/lib/config/category-config.generated.js';
import { SECURITY_CONFIG } from '../../src/lib/constants.js';
import { ParseStrategy, safeParse } from '../../src/lib/utils/data.utils.js';
import { computeHash, hasHashChanged, setHash } from '../utils/build-cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../..');
const TEMPLATE_PATH = join(__dirname, 'templates', 'service-worker.template.js');

async function generateServiceWorker() {
  const startTime = Date.now();
  logger.info('🔧 Generating service worker from generated category config...', {
    script: 'generate-service-worker',
  });

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

    // Get all category IDs from generated config (build-time safe, no database call)
    const categoryIds = ALL_CATEGORY_IDS;
    logger.info(`📦 Found ${categoryIds.length} categories: ${categoryIds.join(', ')}`, {
      script: 'generate-service-worker',
      categoryCount: categoryIds.length,
      categories: categoryIds,
    });

    // Generate content routes array
    // MODERNIZATION: All categories from registry, no special cases
    const contentRoutes = categoryIds.map((id) => `"/${id}"`);

    // Generate category pattern for detail pages
    const categoryPattern = categoryIds.join('|');

    // Generate allowed origins array from SECURITY_CONFIG
    const allowedOrigins = SECURITY_CONFIG.allowedOrigins.map((origin) => `"${origin}"`);

    // OPTIMIZATION: Hash inputs instead of output (faster - skips template rendering)
    const inputHash = computeHash({
      categoryIds,
      allowedOrigins: SECURITY_CONFIG.allowedOrigins,
      version,
    });

    if (!hasHashChanged('service-worker', inputHash)) {
      logger.info('✓ Service worker unchanged (inputs identical), skipping generation', {
        script: 'generate-service-worker',
      });
      logger.info(`✅ Service worker up-to-date (${Date.now() - startTime}ms)`, {
        script: 'generate-service-worker',
        duration: `${Date.now() - startTime}ms`,
      });
      return true;
    }

    // Replace placeholders in template
    const serviceWorkerCode = serviceWorkerTemplate
      .replace(/{{VERSION}}/g, version)
      .replace(/{{CACHE_VERSION}}/g, cacheVersion)
      .replace('{{ALLOWED_ORIGINS}}', `[\n  ${allowedOrigins.join(',\n  ')},\n]`)
      .replace('{{CONTENT_ROUTES}}', `[\n  ${contentRoutes.join(',\n  ')},\n]`)
      .replace('{{CATEGORY_PATTERN}}', categoryPattern);

    // Write to public/service-worker.js
    const outputPath = join(ROOT_DIR, 'public', 'service-worker.js');
    await writeFile(outputPath, serviceWorkerCode, 'utf-8');

    const duration = Date.now() - startTime;

    // Save input hash for next build with metadata
    setHash('service-worker', inputHash, {
      reason: 'Service worker regenerated',
      duration,
      files: [outputPath],
    });
    logger.info(`✅ Service worker generated in ${duration}ms`, {
      script: 'generate-service-worker',
      duration: `${duration}ms`,
    });
    logger.info(`📝 Output: ${outputPath}`, { script: 'generate-service-worker', outputPath });
    logger.info(`🎯 Categories: ${categoryIds.length} routes cached`, {
      script: 'generate-service-worker',
      categoryCount: categoryIds.length,
    });
    logger.info(`🔒 Origins: ${SECURITY_CONFIG.allowedOrigins.length} origins allowed`, {
      script: 'generate-service-worker',
      originCount: SECURITY_CONFIG.allowedOrigins.length,
    });

    return true;
  } catch (err) {
    logger.error(
      '❌ Service worker generation failed',
      err instanceof Error ? err : new Error(String(err)),
      {
        script: 'generate-service-worker',
      }
    );
    throw err;
  }
}

// Run if executed directly
// Convert import.meta.url to file path and compare with process.argv[1]
const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1];
const isMainModule = currentFilePath === executedFilePath;

if (isMainModule) {
  generateServiceWorker()
    .then(() => {
      logger.info('🎉 Service worker generation complete!', { script: 'generate-service-worker' });
      process.exit(0);
    })
    .catch((err) => {
      logger.error(
        '💥 Service worker generation failed',
        err instanceof Error ? err : new Error(String(err)),
        {
          script: 'generate-service-worker',
        }
      );
      process.exit(1);
    });
}

export { generateServiceWorker };
