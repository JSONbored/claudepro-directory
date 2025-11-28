import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SECURITY_CONFIG } from '@heyclaude/shared-runtime';
import { ParseStrategy, safeParse } from '@heyclaude/web-runtime/core';
import { VALID_CATEGORIES } from '@heyclaude/web-runtime/data/config/category';
import { z } from 'zod';
import { computeHash, hasHashChanged, setHash } from '../toolkit/cache.js';
import { logger } from '../toolkit/logger.js';
import { resolvePackagePath, resolveRepoPath } from '../utils/paths.js';

const TEMPLATE_PATH = resolvePackagePath('templates', 'service-worker.template.js');
const ROOT_DIR = resolveRepoPath();

export async function runGenerateServiceWorker(): Promise<boolean> {
  const startTime = Date.now();
  logger.info('🔧 Generating service worker from generated category config...', {
    script: 'generate-service-worker',
  });

  try {
    const serviceWorkerTemplate = await readFile(TEMPLATE_PATH, 'utf-8');
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

    const categoryIds = VALID_CATEGORIES;
    logger.info(`📦 Found ${categoryIds.length} categories: ${categoryIds.join(', ')}`, {
      script: 'generate-service-worker',
      categoryCount: categoryIds.length,
    });

    const contentRoutes = categoryIds.map((id: string) => `"/${id}"`);
    const categoryPattern = categoryIds.join('|');
    const allowedOrigins = SECURITY_CONFIG.allowedOrigins.map((origin: string) => `"${origin}"`);

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

    const serviceWorkerCode = serviceWorkerTemplate
      .replace(/{{VERSION}}/g, version)
      .replace(/{{CACHE_VERSION}}/g, cacheVersion)
      .replace('{{ALLOWED_ORIGINS}}', `[\n  ${allowedOrigins.join(',\n  ')},\n]`)
      .replace('{{CONTENT_ROUTES}}', `[\n  ${contentRoutes.join(',\n  ')},\n]`)
      .replace('{{CATEGORY_PATTERN}}', categoryPattern);

    const outputPath = join(ROOT_DIR, 'apps/web/public', 'service-worker.js');
    await writeFile(outputPath, serviceWorkerCode, 'utf-8');

    const duration = Date.now() - startTime;

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
