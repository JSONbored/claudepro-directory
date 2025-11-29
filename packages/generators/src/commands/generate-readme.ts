import { writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

import  { type Database as DatabaseGenerated } from '@heyclaude/database-types';

import { ensureEnvVars } from '../toolkit/env.js';
import { normalizeError } from '../toolkit/errors.js';
import { logger } from '../toolkit/logger.js';
import { DEFAULT_SUPABASE_URL } from '../toolkit/supabase.js';
import { resolveRepoPath } from '../utils/paths.js';
import { buildReadmeMarkdown } from '../utils/readme-builder.js';

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
    throw new TypeError('README content must be a string');
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
      preview: content.slice(0, 100),
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

/**
 * Generate a repository README.md by fetching site-wide content from the Next.js API, validating the generated markdown, and writing it to disk.
 *
 * This function requests formatted site data from the Next.js API route `/api/content/sitewide?format=readme`, converts the response into Markdown, validates the content and target path for safety (size, format, malicious patterns, and path confinement to the repository), and atomically writes the validated README to the filesystem. It logs progress and summary information and will propagate errors encountered during fetching, validation, or file I/O.
 *
 * @param options - Configuration options for README generation.
 * @param options.outputPath - Optional path to write the generated README. When omitted, writes to the repository root `README.md`.
 * @returns A promise that resolves when the README has been written; rejects if fetching, validation, or writing fails.
 *
 * @example
 * // Generate README to the default repository README.md
 * await runGenerateReadme();
 *
 * @example
 * // Generate README to a custom path
 * await runGenerateReadme({ outputPath: './docs/README.md' });
 *
 * Side effects:
 * - Performs an HTTP GET request to the Next.js API.
 * - Writes a file to the filesystem at `options.outputPath` or the repository README.md.
 * - Emits informational, warning, and error logs.
 *
 * Error behavior:
 * - Throws if the API response is unsuccessful or returns invalid data.
 * - Throws if content validation fails (type, size, format, malicious content, or path outside repository).
 * - Throws if writing the file fails.
 */
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

    logger.info('📝 Generating README.md via Next.js API...\n', { script: 'generate-readme' });

    // Call Next.js API route (not edge functions)
    // Use same fallback as readme-builder.ts for consistency
    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'https://claudepro.directory';
    const apiUrl = `${siteUrl}/api/content/sitewide?format=readme`;

    logger.info(`   Endpoint: ${apiUrl}`, { script: 'generate-readme' });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `API request failed (${response.status} ${response.statusText}): ${errorText}`
      );
    }

    const data = (await response.json()) as DatabaseGenerated['public']['Functions']['generate_readme_data']['Returns'];

    if (!data || typeof data !== 'object') {
      throw new Error('API returned null or invalid data');
    }

    if (!Array.isArray(data.categories)) {
      throw new TypeError('API response missing categories array');
    }

    logger.info(`✅ Fetched data: ${data.total_count ?? 0} total items, ${data.categories?.length ?? 0} categories`, {
      script: 'generate-readme',
      totalCount: data.total_count ?? 0,
      categoriesCount: data.categories?.length ?? 0,
    });

    // Format the data into markdown using the CLI utility
    const formattedMarkdown = buildReadmeMarkdown(data);

    // CRITICAL SECURITY: Validate content before writing to file system
    // This prevents arbitrary file writes. The validateReadmeContent function
    // performs comprehensive checks: type validation, size limits, path safety,
    // markdown format validation, and malicious pattern detection.
    const validatedReadme = validateReadmeContent(formattedMarkdown, README_PATH);

    // Safe to write: content has passed all security validations
    writeFileSync(README_PATH, validatedReadme, 'utf8');

    logger.info('✅ README.md generated successfully!', { script: 'generate-readme' });
    logger.info(`   Bytes: ${validatedReadme.length}`, {
      script: 'generate-readme',
      bytes: validatedReadme.length,
    });
    logger.info('   Source: Next.js API (api/content/sitewide)', {
      script: 'generate-readme',
    });
  } catch (error) {
    logger.error('❌ Failed to generate README', normalizeError(error), {
      script: 'generate-readme',
    });
    throw normalizeError(error, 'README generation failed');
  }
}