import { execSync } from 'node:child_process';
import { logger } from '../toolkit/logger.js';

const ALLOWLIST = new Set([
  'apps/web/src/lib/auth/get-authenticated-user.ts',
  'apps/web/src/lib/auth/use-authenticated-user.ts',
]);

export function runLintAuthGuards(): void {
  let output = '';
  try {
    output = execSync('rg --no-heading -n "auth\\.getUser" apps/web/src', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number' &&
      (error as { status: number }).status === 1
    ) {
      return;
    }

    logger.error(
      'Failed to run ripgrep for auth guard enforcement.',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'check-auth-guards',
      }
    );
    throw error instanceof Error ? error : new Error(String(error));
  }

  const violations = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const [filePath] = line.split(':');
      return filePath && !ALLOWLIST.has(filePath);
    });

  if (violations.length > 0) {
    logger.error(
      '❌ Detected direct supabase.auth.getUser() usage outside approved helpers:\n',
      undefined,
      {
        script: 'check-auth-guards',
        violationCount: violations.length,
      }
    );
    for (const violation of violations) {
      logger.error(`  - ${violation}`, undefined, { script: 'check-auth-guards', violation });
    }
    logger.error(
      '\nPlease use getAuthenticatedUser() (server) or useAuthenticatedUser() (client) instead.',
      undefined,
      { script: 'check-auth-guards' }
    );
    throw new Error('Auth guard lint violations detected.');
  }
}
