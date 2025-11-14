#!/usr/bin/env tsx

import { execSync } from 'node:child_process';

const ALLOWLIST = new Set([
  'src/lib/auth/get-authenticated-user.ts',
  'src/lib/auth/use-authenticated-user.ts',
]);

function run() {
  let output = '';
  try {
    output = execSync('rg --no-heading -n "auth\\\\.getUser" src', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    // ripgrep exits with code 1 when there are no matches. That's a success case for us.
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as any).status === 1
    ) {
      return;
    }

    console.error('Failed to run ripgrep for auth guard enforcement.', error);
    process.exit(1);
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
    console.error('❌ Detected direct supabase.auth.getUser() usage outside approved helpers:\n');
    for (const violation of violations) {
      console.error(`  - ${violation}`);
    }
    console.error(
      '\nPlease use getAuthenticatedUser() (server) or useAuthenticatedUser() (client) instead.'
    );
    process.exit(1);
  }
}

run();
