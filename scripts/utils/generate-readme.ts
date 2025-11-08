#!/usr/bin/env tsx

/**
 * README Generator - Edge Function API Client
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureEnvVars } from '../utils/env.js';

const README_PATH = join(process.cwd(), 'README.md');

async function main() {
  try {
    await ensureEnvVars(['NEXT_PUBLIC_SUPABASE_URL']);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/readme-generator`;

    console.log('📝 Generating README.md from edge function...\n');

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

    console.log('✅ README.md generated successfully!');
    console.log(`   Bytes: ${readme.length}`);
    console.log('   Source: Supabase Edge Function (generate_readme_data RPC)');
  } catch (error) {
    console.error('❌ Failed to generate README:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
