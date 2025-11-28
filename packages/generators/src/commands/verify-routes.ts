import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../toolkit/logger.js';
import { REPO_ROOT } from '../utils/paths.js';

export async function verifyRoutes() {
  const root = REPO_ROOT;
  logger.info('Verifying route configurations...');

  // Find all page.tsx in apps/web/src/app
  const files = execSync('find apps/web/src/app -name "page.tsx"', { cwd: root, encoding: 'utf-8' })
    .split('\n')
    .filter((f) => f.trim());

  let hasError = false;

  for (const file of files) {
    const content = fs.readFileSync(path.join(root, file), 'utf-8');

    // Check for exports
    const hasRevalidate = /export\s+const\s+revalidate\s+=/.test(content);
    const hasDynamic = /export\s+const\s+dynamic\s+=/.test(content);
    const hasRuntime = /export\s+const\s+runtime\s+=/.test(content);

    if (!(hasRevalidate || hasDynamic || hasRuntime)) {
      logger.error(`Missing config in ${file}`);
      logger.warn(`  Must export 'revalidate', 'dynamic', or 'runtime'.`);
      hasError = true;
    }
  }

  if (hasError) {
    logger.error('❌ Verification failed. Please add explicit route configs to the files above.');
    process.exit(1);
  }
  logger.info('✅ verify:routes passed');
}
