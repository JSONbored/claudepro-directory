import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../toolkit/logger.js';
import { REPO_ROOT } from '../utils/paths.js';

const BANNED_IMPORTS = [
  {
    pattern: /from\s+['"]@vercel\/flags/,
    message:
      'Do not import @vercel/flags SDKs directly. Use packages/web-runtime/src/feature-flags helpers.',
  },
  {
    pattern: /from\s+['"]statsig-node['"]/,
    message:
      'Do not import statsig-node directly. Use packages/web-runtime/src/feature-flags helpers.',
  },
  {
    pattern: /from\s+['"]statsig-js['"]/,
    message:
      'Do not import statsig-js directly. Use packages/web-runtime/src/feature-flags helpers.',
  },
];

const ALLOWED_DIR = 'packages/web-runtime/src/feature-flags';
const EXCLUDED_FILES = ['packages/generators/src/commands/verify-flags.ts'];

export async function verifyFlags() {
  const root = REPO_ROOT;
  logger.info('Verifying feature flag imports...');

  // Use git ls-files to respect gitignore
  const files = execSync('git ls-files', { cwd: root, encoding: 'utf-8' })
    .split('\n')
    .filter((f) => f && (f.endsWith('.ts') || f.endsWith('.tsx')))
    .filter((f) => !f.startsWith(ALLOWED_DIR))
    .filter((f) => !EXCLUDED_FILES.some((excluded) => f.includes(excluded)));

  let hasError = false;

  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf-8');
    for (const { pattern, message } of BANNED_IMPORTS) {
      if (pattern.test(content)) {
        if (content.includes('// verify-flags-ignore')) continue;

        logger.error(`Violation in ${file}:`);
        logger.error(`  ${message}`);

        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (pattern.test(line)) {
            logger.error(`  Line ${i + 1}: ${line.trim()}`);
          }
        });
        hasError = true;
      }
    }
  }

  if (hasError) {
    logger.error('❌ Verification failed. Please fix the import violations above.');
    process.exit(1);
  }
  logger.info('✅ verify:flags passed');
}
