import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { callEdgeFunction } from '../toolkit/edge.js';
import { ensureEnvVars } from '../toolkit/env.js';
import { normalizeError } from '../toolkit/errors.js';
import { logger } from '../toolkit/logger.js';
import { DEFAULT_SUPABASE_URL } from '../toolkit/supabase.js';
import { resolveRepoPath } from '../utils/paths.js';

export interface GenerateReadmeOptions {
  outputPath?: string;
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
    logger.info('   Endpoint: /functions/v1/data-api/content/sitewide?format=readme', {
      script: 'generate-readme',
    });

    const readme = await callEdgeFunction<string>(
      '/data-api/content/sitewide?format=readme',
      {},
      { responseType: 'text', requireAuth: false, timeoutMs: 15_000 }
    );

    writeFileSync(README_PATH, readme, 'utf-8');

    logger.info('✅ README.md generated successfully!', { script: 'generate-readme' });
    logger.info(`   Bytes: ${readme.length}`, { script: 'generate-readme', bytes: readme.length });
    logger.info('   Source: Supabase Edge Function (data-api/content)', {
      script: 'generate-readme',
    });
  } catch (error) {
    logger.error('❌ Failed to generate README', normalizeError(error), {
      script: 'generate-readme',
    });
    throw error instanceof Error ? error : new Error(String(error));
  }
}
