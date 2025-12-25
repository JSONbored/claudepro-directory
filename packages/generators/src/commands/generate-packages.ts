/**
 * Unified Package Generator Command
 *
 * Generates packages for all supported types (skills, MCP servers, etc.).
 * Replaces separate generate-skill-packages and generate-mcpb-packages commands.
 *
 * Usage:
 *   pnpm exec heyclaude-generate-packages              # Generate all types
 *   pnpm exec heyclaude-generate-packages --type=skills  # Generate only skills
 *   pnpm exec heyclaude-generate-packages --type=mcpb    # Generate only MCP servers
 */

import { env } from '@heyclaude/shared-runtime/schemas/env';

import { ensureEnvVars } from '../toolkit/env.ts';
import { logger } from '../toolkit/logger.ts';
import { DEFAULT_SUPABASE_URL } from '../toolkit/supabase.ts';

import { runGenerateMcpbPackages } from './generate-mcpb-packages.ts';
import { runGenerateSkillPackages } from './generate-skill-packages.ts';

type PackageType = 'skills' | 'mcpb' | 'all';

/**
 * Parse command line arguments
 */
function parseArgs(): { type: PackageType } {
  const args = process.argv.slice(2);
  let type: PackageType = 'all';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--type' || arg === '-t') {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        logger.error('Missing value for --type', undefined, {
          script: 'generate-packages',
          option: arg,
        });
        showHelp();
        process.exit(1);
      }
      if (value === 'skills' || value === 'mcpb' || value === 'all') {
        type = value as PackageType;
      } else {
        logger.error(
          `Invalid package type: ${value}. Must be one of: skills, mcpb, all`,
          undefined,
          {
            script: 'generate-packages',
            type: value,
          }
        );
        showHelp();
        process.exit(1);
      }
      i++; // Skip the value
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else {
      logger.error(`Unknown option: ${arg}`, undefined, {
        script: 'generate-packages',
        option: arg,
      });
      showHelp();
      process.exit(1);
    }
  }

  return { type };
}

/**
 * Show help message
 */
function showHelp(): void {
  logger.log(`
Usage: heyclaude-generate-packages [OPTIONS]

Generate packages for skills, MCP servers, or both.

Options:
  --type, -t <type>    Package type to generate: skills, mcpb, or all (default: all)
  --help, -h           Show this help message

Examples:
  pnpm exec heyclaude-generate-packages              # Generate all package types
  pnpm exec heyclaude-generate-packages --type=skills  # Generate only skills
  pnpm exec heyclaude-generate-packages --type=mcpb    # Generate only MCP servers

Package Types:
  skills    Generate Claude Desktop skill packages (.zip files)
  mcpb      Generate MCP server packages (.mcpb files)
  all       Generate all package types (default)
`);
}

/**
 * Main entry point
 */
export async function runGeneratePackages(): Promise<void> {
  const { type } = parseArgs();

  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    logger.warn(
      'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
      {
        script: 'generate-packages',
        fallbackUrl: DEFAULT_SUPABASE_URL,
      }
    );
  }

  logger.info('🚀 Unified Package Generator\n', { script: 'generate-packages' });
  logger.info('═'.repeat(80));

  const errors: Array<{ type: PackageType; error: Error }> = [];

  if (type === 'all' || type === 'skills') {
    try {
      logger.info('\n📦 Generating Skills Packages...\n', { script: 'generate-packages' });
      await runGenerateSkillPackages();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push({ type: 'skills', error: err });
      logger.error('❌ Skills package generation failed', err, {
        script: 'generate-packages',
        type: 'skills',
      });
    }
  }

  if (type === 'all' || type === 'mcpb') {
    try {
      logger.info('\n📦 Generating MCPB Packages...\n', { script: 'generate-packages' });
      await runGenerateMcpbPackages();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push({ type: 'mcpb', error: err });
      logger.error('❌ MCPB package generation failed', err, {
        script: 'generate-packages',
        type: 'mcpb',
      });
    }
  }

  logger.info('\n' + '═'.repeat(80));

  if (errors.length > 0) {
    logger.error(`\n❌ ${errors.length} package type(s) failed to generate`, undefined, {
      script: 'generate-packages',
      errors: errors.map((e) => ({ type: e.type, message: e.error.message })),
    });
    for (const { type, error } of errors) {
      logger.error(`   ${type}: ${error.message}`, error, { script: 'generate-packages', type });
    }
    process.exit(1);
  }

  logger.info('\n✨ All package generation complete!\n', { script: 'generate-packages' });
}
