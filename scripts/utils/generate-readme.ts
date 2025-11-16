#!/usr/bin/env tsx

/**
 * README Generator - Edge Function API Client
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '@/src/lib/logger';
import { ensureEnvVars } from '../utils/env.js';

const README_PATH = join(process.cwd(), 'README.md');

async function main() {
  try {
    await ensureEnvVars(['NEXT_PUBLIC_SUPABASE_URL']);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/data-api/content/sitewide?format=readme`;

    logger.info('📝 Generating README.md from edge function...\n', { script: 'generate-readme' });

    const response = await fetch(edgeFunctionUrl);

    if (!response.ok) {
      throw new Error(`Edge function failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('text/markdown')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const readme = await response.text();

    writeFileSync(README_PATH, readme, 'utf-8');

    logger.info('✅ README.md generated successfully!', { script: 'generate-readme' });
    logger.info(`   Bytes: ${readme.length}`, { script: 'generate-readme', bytes: readme.length });
    logger.info('   Source: Supabase Edge Function (generate_readme_data RPC)', {
      script: 'generate-readme',
    });
  } catch (error) {
    logger.error(
      '❌ Failed to generate README',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'generate-readme',
      }
    );
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('❌ Fatal error', error instanceof Error ? error : new Error(String(error)), {
    script: 'generate-readme',
  });
  process.exit(1);
});
