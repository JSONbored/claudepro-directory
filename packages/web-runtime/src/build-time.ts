export function isBuildTime(): boolean {
  if (typeof process === 'undefined') {
    return false;
  }

  if (process.env['NEXT_PHASE'] === 'phase-production-build') {
    return true;
  }

  if (typeof process.argv !== 'undefined') {
    const isBuildCommand = process.argv.some(
      (arg) => arg.includes('next') && (arg.includes('build') || arg.includes('export'))
    );
    if (isBuildCommand) {
      return true;
    }
  }

  const hasSupabaseEnv =
    process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!hasSupabaseEnv) {
    return true;
  }

  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    if (!(process.env['VERCEL'] || process.env['VERCEL_ENV'] || process.env['VERCEL_URL'])) {
      return true;
    }
  }

  if (!(process.env['VERCEL'] || process.env['VERCEL_ENV'] || process.env['VERCEL_URL'])) {
    return true;
  }

  return false;
}
