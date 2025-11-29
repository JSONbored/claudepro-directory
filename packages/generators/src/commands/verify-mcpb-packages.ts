import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';
import { createServiceRoleClient, DEFAULT_SUPABASE_URL } from '../toolkit/supabase.js';

interface VerificationResult {
  missing_packages: number;
  missing_packages_list: Array<{
    id: string;
    slug: string;
    title: null | string;
  }>;
  storage_mismatches: number;
  storage_mismatches_list: Array<{
    has_db_url: boolean;
    has_storage_file: boolean;
    id: string;
    slug: string;
  }>;
  total_mcp_content: number;
  with_packages: number;
}

export async function runVerifyMcpbPackages(): Promise<VerificationResult> {
  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

  if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    logger.warn(
      'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
      {
        script: 'verify-mcpb-packages',
        fallbackUrl: DEFAULT_SUPABASE_URL,
      }
    );
  }

  const supabase = createServiceRoleClient();

  logger.info('🔍 Verifying MCPB packages for all MCP content...\n', {
    script: 'verify-mcpb-packages',
  });

  const { data: mcpContent, error: fetchError } = await supabase
    .from('content')
    .select('id, slug, title, mcpb_storage_url, mcpb_build_hash, mcpb_last_built_at')
    .eq('category', 'mcp')
    .order('slug');

  if (fetchError) {
    throw new Error(`Failed to fetch MCP content: ${fetchError.message}`);
  }

  if (mcpContent.length === 0) {
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

  const missingPackages = mcpContent.filter(
    (mcp) => !mcp.mcpb_storage_url || mcp.mcpb_storage_url.trim().length === 0
  );

  const withPackages = mcpContent.filter(
    (mcp) => Boolean(mcp.mcpb_storage_url) && mcp.mcpb_storage_url.trim().length > 0
  );

  const storageMismatches: VerificationResult['storage_mismatches_list'] = [];

  for (const mcp of withPackages) {
    const { data: fileData, error: fileError } = await supabase.storage
      .from('mcpb-packages')
      .list('packages', {
        search: mcp.slug,
      });

    const hasStorageFile =
      !fileError && Boolean(fileData) && fileData.some((file) => file.name === `${mcp.slug}.mcpb`);

    if (!hasStorageFile) {
      storageMismatches.push({
        id: mcp.id,
        slug: mcp.slug,
        has_db_url: true,
        has_storage_file: false,
      });
    }
  }

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
        title: (mcp.title && mcp.title.trim()) ? mcp.title.trim() : 'No title',
      })),
    });
    logger.info('\nMissing packages list:', {
      script: 'verify-mcpb-packages',
    });
    for (const mcp of result.missing_packages_list) {
      const title = (mcp.title && mcp.title.trim()) ? mcp.title.trim() : 'No title';
      logger.info(`  - ${mcp.slug} (${title})`, {
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
      })),
    });
    logger.info('\nStorage mismatch list:', {
      script: 'verify-mcpb-packages',
    });
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
