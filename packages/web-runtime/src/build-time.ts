import { env } from '@heyclaude/shared-runtime/schemas/env';

export function isBuildTime(): boolean {
  if (typeof process === 'undefined') {
    return false;
  }

  if (env.NEXT_PHASE === 'phase-production-build') {
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
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return true;
  }

  if (env.NEXT_RUNTIME === 'nodejs') {
    if (!(env.VERCEL || env.VERCEL_ENV || env.VERCEL_URL)) {
      return true;
    }
  }

  if (!(env.VERCEL || env.VERCEL_ENV || env.VERCEL_URL)) {
    return true;
  }

  return false;
}
