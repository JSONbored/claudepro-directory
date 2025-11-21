#!/usr/bin/env tsx

/**
 * MCPB Package Verification Script
 *
 * Verifies that all MCP content has corresponding .mcpb packages:
 * 1. Queries database for all MCP content
 * 2. Checks for missing mcpb_storage_url
 * 3. Verifies storage bucket files match database entries
 * 4. Reports discrepancies
 *
 * Usage:
 *   pnpm tsx scripts/utils/verify-mcpb-packages.ts
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';
import { ensureEnvVars } from '../utils/env.js';

await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

const SUPABASE_URL =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://hgtjdifxfapoltfflowc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface VerificationResult {
  total_mcp_content: number;
  with_packages: number;
  missing_packages: number;
  missing_packages_list: Array<{
    id: string;
    slug: string;
    title: string | null;
  }>;
  storage_mismatches: number;
  storage_mismatches_list: Array<{
    id: string;
    slug: string;
    has_db_url: boolean;
    has_storage_file: boolean;
  }>;
}

/**
 * Verify all MCP content has packages
 */
async function verifyMcpbPackages(): Promise<VerificationResult> {
  logger.info('🔍 Verifying MCPB packages for all MCP content...\n', {
    script: 'verify-mcpb-packages',
  });

  // 1. Fetch all MCP content from database
  const { data: mcpContent, error: fetchError } = await supabase
    .from('content')
    .select('id, slug, title, mcpb_storage_url, mcpb_build_hash, mcpb_last_built_at')
    .eq('category', 'mcp')
    .order('slug');

  if (fetchError) {
    throw new Error(`Failed to fetch MCP content: ${fetchError.message}`);
  }

  if (!mcpContent || mcpContent.length === 0) {
    logger.info('✅ No MCP content found in database', {
      script: 'verify-mcpb-packages',
    });
    return {
      total_mcp_content: 0,
      with_packages: 0,
      missing_packages: 0,
      missing_packages_list: [],
      storage_mismatches: 0,
      storage_mismatches_list: [],
    };
  }

  logger.info(`📊 Found ${mcpContent.length} MCP content entries\n`, {
    script: 'verify-mcpb-packages',
    total: mcpContent.length,
  });

  // 2. Check for missing packages
  const missingPackages = mcpContent.filter(
    (mcp) => !mcp.mcpb_storage_url || mcp.mcpb_storage_url.trim().length === 0
  );

  // 3. Verify storage bucket files exist for entries with mcpb_storage_url
  const withPackages = mcpContent.filter(
    (mcp) => mcp.mcpb_storage_url && mcp.mcpb_storage_url.trim().length > 0
  );

  const storageMismatches: VerificationResult['storage_mismatches_list'] = [];

  for (const mcp of withPackages) {
    // Check if file exists in storage bucket
    const { data: fileData, error: fileError } = await supabase.storage
      .from('mcpb-packages')
      .list('packages', {
        search: mcp.slug,
      });

    const hasStorageFile =
      !fileError && fileData && fileData.some((file) => file.name === `${mcp.slug}.mcpb`);

    if (!hasStorageFile) {
      storageMismatches.push({
        id: mcp.id,
        slug: mcp.slug,
        has_db_url: true,
        has_storage_file: false,
      });
    }
  }

  // 4. Build result
  const result: VerificationResult = {
    total_mcp_content: mcpContent.length,
    with_packages: withPackages.length,
    missing_packages: missingPackages.length,
    missing_packages_list: missingPackages.map((mcp) => ({
      id: mcp.id,
      slug: mcp.slug,
      title: mcp.title,
    })),
    storage_mismatches: storageMismatches.length,
    storage_mismatches_list: storageMismatches,
  };

  // 5. Report results
  logger.info('═'.repeat(80), { script: 'verify-mcpb-packages' });
  logger.info('📦 MCPB Package Verification Results', {
    script: 'verify-mcpb-packages',
  });
  logger.info(`${'═'.repeat(80)}\n`, { script: 'verify-mcpb-packages' });

  logger.info(`Total MCP content: ${result.total_mcp_content}`, {
    script: 'verify-mcpb-packages',
  });
  logger.info(`With packages: ${result.with_packages}`, {
    script: 'verify-mcpb-packages',
  });
  logger.info(`Missing packages: ${result.missing_packages}`, {
    script: 'verify-mcpb-packages',
  });
  logger.info(`Storage mismatches: ${result.storage_mismatches}\n`, {
    script: 'verify-mcpb-packages',
  });

  if (result.missing_packages > 0) {
    logger.warn('⚠️  Missing packages:', {
      script: 'verify-mcpb-packages',
      missing_count: result.missing_packages,
      missingPackages: result.missing_packages_list.map((mcp) => ({
        slug: mcp.slug,
        title: mcp.title || 'No title',
      })), // Array support enables better log querying and analysis
    });
    logger.info('\nMissing packages list:', {
      script: 'verify-mcpb-packages',
    });
    // Also log individual items for console readability
    for (const mcp of result.missing_packages_list) {
      logger.info(`  - ${mcp.slug} (${mcp.title || 'No title'})`, {
        script: 'verify-mcpb-packages',
      });
    }
    logger.info('', { script: 'verify-mcpb-packages' });
  }

  if (result.storage_mismatches > 0) {
    logger.warn('⚠️  Storage mismatches:', {
      script: 'verify-mcpb-packages',
      mismatches_count: result.storage_mismatches,
      storageMismatches: result.storage_mismatches_list.map((mcp) => ({
        slug: mcp.slug,
      })), // Array support enables better log querying and analysis
    });
    logger.info('\nStorage mismatch list:', {
      script: 'verify-mcpb-packages',
    });
    // Also log individual items for console readability
    for (const mcp of result.storage_mismatches_list) {
      logger.info(`  - ${mcp.slug}: DB has URL but storage file missing`, {
        script: 'verify-mcpb-packages',
      });
    }
    logger.info('', { script: 'verify-mcpb-packages' });
  }

  if (result.missing_packages === 0 && result.storage_mismatches === 0) {
    logger.info('✅ All MCP content has valid packages!\n', {
      script: 'verify-mcpb-packages',
    });
  } else {
    logger.warn(
      `⚠️  Found ${result.missing_packages + result.storage_mismatches} issues that need attention\n`,
      {
        script: 'verify-mcpb-packages',
      }
    );
  }

  return result;
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await verifyMcpbPackages();

    // Exit with error code if issues found
    if (result.missing_packages > 0 || result.storage_mismatches > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error : String(error);
    logger.error('Fatal error in MCPB package verification', errorMessage, {
      script: 'verify-mcpb-packages',
    });
    process.exit(1);
  }
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error : String(error);
  logger.error('Fatal error in MCPB package verification', errorMessage, {
    script: 'verify-mcpb-packages',
  });
  process.exit(1);
});
