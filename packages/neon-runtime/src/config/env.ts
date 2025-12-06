/**
 * Environment Configuration for Neon Runtime
 * 
 * Isolated from existing Supabase configuration.
 * Uses Neon-specific environment variables.
 */

/**
 * Get Neon database connection string
 * 
 * Priority:
 * 1. NEON_DATABASE_URL (for Prisma)
 * 2. NEON_MIGRATION_BRANCH_CONNECTION_STRING (migration-test branch)
 * 3. DATABASE_URL (fallback, but should be Neon, not Supabase)
 */
export function getNeonDatabaseUrl(): string {
  const neonUrl = process.env['NEON_DATABASE_URL'];
  if (neonUrl) {
    return neonUrl;
  }

  const migrationBranchUrl = process.env['NEON_MIGRATION_BRANCH_CONNECTION_STRING'];
  if (migrationBranchUrl) {
    return migrationBranchUrl;
  }

  // Fallback - but warn if this is Supabase
  const fallbackUrl = process.env['DATABASE_URL'];
  if (fallbackUrl) {
    if (fallbackUrl.includes('supabase')) {
      console.warn(
        '[neon-runtime] WARNING: Using DATABASE_URL that appears to be Supabase. ' +
        'Set NEON_DATABASE_URL or NEON_MIGRATION_BRANCH_CONNECTION_STRING instead.'
      );
    }
    return fallbackUrl;
  }

  throw new Error(
    'Missing Neon database connection string. ' +
    'Set NEON_DATABASE_URL or NEON_MIGRATION_BRANCH_CONNECTION_STRING in environment variables.'
  );
}

/**
 * Validate that we're using Neon, not Supabase
 */
export function validateNeonConnection(url: string): void {
  if (url.includes('supabase')) {
    throw new Error(
      'Invalid database URL: This appears to be a Supabase connection string. ' +
      'Neon runtime requires a Neon database connection string.'
    );
  }

  if (!url.includes('neon.tech') && !url.includes('neon')) {
    console.warn(
      '[neon-runtime] WARNING: Database URL does not appear to be a Neon connection string.'
    );
  }
}
