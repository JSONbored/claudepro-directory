import { execSync } from 'node:child_process';
import { logger } from '../toolkit/logger.js';

const EXCLUDE_PATTERNS = [
  // Next.js framework exports
  /:\d+ - (default|metadata|generateMetadata|revalidate|generateStaticParams|middleware|runtime|config)$/,
  // Component default exports (used by Next.js routing)
  /components\/.*:\d+ - default$/,
  // App route exports (used by Next.js)
  /app\/.*:\d+ - (default|metadata|generateMetadata|revalidate|generateStaticParams|GET|POST)$/,
  // Types marked as used
  /\(used in module\)$/,
  // Next.js generated types
  /\.next\/types\//,
];

// Individual pattern constants for reuse in filtering and categorization
const TYPE_GUARD_PATTERN = /is[A-Z]\w+$/;
const RPC_RETURN_PATTERN = /GetGet.*Return$/;
const TYPE_ALIAS_PATTERN = /(ContentItem|FullContentItem)$/;
const TYPE_VALUES_PATTERN = /_VALUES$/;

const INCLUDE_PATTERNS = [
  // Unused type guards
  TYPE_GUARD_PATTERN,
  // Unused RPC return types
  RPC_RETURN_PATTERN,
  // Unused type aliases
  TYPE_ALIAS_PATTERN,
  // Unused type values
  TYPE_VALUES_PATTERN,
];

export function runLintUnusedTypes() {
  let output: string;
  try {
    output = execSync('pnpm type-check:unused', { encoding: 'utf-8' });
  } catch (error) {
    // ts-prune may exit with non-zero status but still produce useful output
    const execError = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
    };

    if (execError.stdout) {
      output =
        typeof execError.stdout === 'string'
          ? execError.stdout
          : execError.stdout.toString('utf-8');
    } else {
      output = execError.message || String(error);
    }
  }

  try {
    const lines = output.split('\n').filter((line) => line.trim());

    const filtered = lines.filter((line) => {
      // Exclude if matches exclude patterns
      if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(line))) {
        return false;
      }

      // Include if matches include patterns (type system issues)
      if (INCLUDE_PATTERNS.some((pattern) => pattern.test(line))) {
        return true;
      }

      return false;
    });

    if (filtered.length === 0) {
      logger.info('✅ No unused type system issues found!');
      process.exit(0);
    }

    const issueCount = filtered.length;
    logger.info(`\n🔍 Found ${issueCount} unused type system issues:\n`);
    console.log(filtered.join('\n'));
    console.log('\n');

    // Group by category using shared patterns
    const typeGuards = filtered.filter((l) => TYPE_GUARD_PATTERN.test(l));
    const rpcReturns = filtered.filter((l) => RPC_RETURN_PATTERN.test(l));
    const typeAliases = filtered.filter((l) => TYPE_ALIAS_PATTERN.test(l));
    const typeValues = filtered.filter((l) => TYPE_VALUES_PATTERN.test(l));

    logger.info('📊 Summary:');
    logger.info(`   Type Guards: ${typeGuards.length}`);
    logger.info(`   RPC Return Types: ${rpcReturns.length}`);
    logger.info(`   Type Aliases: ${typeAliases.length}`);
    logger.info(`   Type Values: ${typeValues.length}`);
    logger.info(
      `   Other: ${filtered.length - typeGuards.length - rpcReturns.length - typeAliases.length - typeValues.length}\n`
    );

    // Exit with failure code when issues are found
    process.exit(1);
  } catch (error) {
    logger.error('Error running ts-prune:', error);
    process.exit(1);
  }
}
