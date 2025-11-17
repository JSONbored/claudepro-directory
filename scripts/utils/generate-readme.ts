#!/usr/bin/env tsx

/**
 * README Generator - Edge Function API Client
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import { ensureEnvVars } from '../utils/env.js';

const README_PATH = join(process.cwd(), 'README.md');

async function main() {
  try {
    await ensureEnvVars(['NEXT_PUBLIC_SUPABASE_URL']);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    // Endpoint: /functions/v1/data-api/content/sitewide?format=readme
    // Route: data-api edge function -> content route -> sitewide handler -> readme format
    // Should return: text/markdown content with HTTP 200
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/data-api/content/sitewide?format=readme`;

    logger.info('📝 Generating README.md from edge function...\n', { script: 'generate-readme' });
    logger.info(`   Endpoint: ${edgeFunctionUrl}`, { script: 'generate-readme' });

    const response = await fetch(edgeFunctionUrl);

    if (!response.ok) {
      // Try to get error details from response body
      let errorDetails = '';
      try {
        const errorBody = await response.text();
        if (errorBody) {
          try {
            const parsed = JSON.parse(errorBody);
            errorDetails = ` - ${JSON.stringify(parsed)}`;
          } catch {
            errorDetails = ` - ${errorBody.slice(0, 200)}`;
          }
        }
      } catch {
        // Ignore errors when reading error body
      }

      throw new Error(
        `Edge function failed: ${response.status} ${response.statusText}${errorDetails}`
      );
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType?.includes('text/markdown')) {
      throw new Error(
        `Unexpected content type: ${contentType}. Expected text/markdown. Response status: ${response.status}`
      );
    }

    const readme = await response.text();

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
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('❌ Fatal error', normalizeError(error), {
    script: 'generate-readme',
  });
  process.exit(1);
});
