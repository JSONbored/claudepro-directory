import { writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { callEdgeFunction } from '../toolkit/edge.js';
import { ensureEnvVars } from '../toolkit/env.js';
import { normalizeError } from '../toolkit/errors.js';
import { logger } from '../toolkit/logger.js';
import { DEFAULT_SUPABASE_URL } from '../toolkit/supabase.js';
import { resolveRepoPath } from '../utils/paths.js';

export interface GenerateReadmeOptions {
  outputPath?: string;
}

/**
 * Validate README content before writing to file system
 * Prevents arbitrary file upload and ensures content is safe
 */
function validateReadmeContent(content: unknown, outputPath: string): string {
  // Ensure content is a string
  if (typeof content !== 'string') {
    throw new Error('README content must be a string');
  }

  // Check for reasonable size limits (README should not exceed 1MB)
  const MAX_README_SIZE = 1024 * 1024; // 1MB
  if (content.length > MAX_README_SIZE) {
    logger.warn('README content exceeds size limit, truncating', {
      script: 'generate-readme',
      size: content.length,
      maxSize: MAX_README_SIZE,
    });
    throw new Error(`README content too large: ${content.length} bytes (max: ${MAX_README_SIZE})`);
  }

  // Validate minimum content (should not be empty)
  if (content.trim().length === 0) {
    throw new Error('README content is empty');
  }

  // Validate it looks like markdown (should start with # or contain markdown patterns)
  const markdownPatterns = /^#|^##|^\*\*|^\[|^```|^---/m;
  if (!markdownPatterns.test(content)) {
    logger.warn('README content does not appear to be valid markdown', {
      script: 'generate-readme',
      preview: content.substring(0, 100),
    });
    // Don't throw - allow through but log warning for security monitoring
  }

  // Validate file path is safe (within repo directory)
  const repoRoot = resolveRepoPath();
  const resolvedPath = isAbsolute(outputPath) ? outputPath : resolve(repoRoot, outputPath);
  const normalizedRepoRoot = resolve(repoRoot);
  const normalizedPath = resolve(resolvedPath);

  if (!normalizedPath.startsWith(normalizedRepoRoot)) {
    throw new Error(
      `Invalid output path: ${outputPath} is outside repository root. This prevents arbitrary file write.`
    );
  }

  // Check for suspicious patterns that might indicate malicious content
  const suspiciousPatterns = [
    /<script[^>]*>/i, // Script tags
    /javascript:/i, // JavaScript URLs
    /on\w+\s*=/i, // Event handlers
    /eval\s*\(/i, // Eval calls
    /exec\s*\(/i, // Exec calls
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      logger.error('README content contains suspicious patterns', {
        script: 'generate-readme',
        pattern: pattern.toString(),
      });
      throw new Error('README content contains potentially malicious patterns');
    }
  }

  return content;
}

export async function runGenerateReadme(options: GenerateReadmeOptions = {}): Promise<void> {
  const README_PATH = options.outputPath ?? join(resolveRepoPath(), 'README.md');

  try {
    await ensureEnvVars([]);

    if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
      logger.warn(
        'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
        {
          script: 'generate-readme',
          fallbackUrl: DEFAULT_SUPABASE_URL,
        }
      );
    }

    logger.info('📝 Generating README.md from edge function...\n', { script: 'generate-readme' });
    logger.info('   Endpoint: /functions/v1/public-api/content/sitewide?format=readme', {
      script: 'generate-readme',
    });

    const readme = await callEdgeFunction<string>(
      '/public-api/content/sitewide?format=readme',
      {},
      { responseType: 'text', requireAuth: false, timeoutMs: 15_000 }
    );

    // CRITICAL SECURITY: Validate HTTP-sourced content before writing to file system
    // This prevents arbitrary file upload attacks. The validateReadmeContent function
    // performs comprehensive checks: type validation, size limits, path safety,
    // markdown format validation, and malicious pattern detection.
    const validatedReadme = validateReadmeContent(readme, README_PATH);

    // Safe to write: content has passed all security validations
    writeFileSync(README_PATH, validatedReadme, 'utf-8');

    logger.info('✅ README.md generated successfully!', { script: 'generate-readme' });
    logger.info(`   Bytes: ${validatedReadme.length}`, {
      script: 'generate-readme',
      bytes: validatedReadme.length,
    });
    logger.info('   Source: Supabase Edge Function (public-api/content)', {
      script: 'generate-readme',
    });
  } catch (error) {
    logger.error('❌ Failed to generate README', normalizeError(error), {
      script: 'generate-readme',
    });
    throw error instanceof Error ? error : new Error(String(error));
  }
}
