import { env } from '@heyclaude/shared-runtime/schemas/env';
import { detectPlatform, getDeploymentEnv } from '@heyclaude/shared-runtime/platform';

/**
 * Detects if code is running during Next.js build time (static generation)
 * 
 * This is used to optimize database queries during build by using service role client
 * instead of anon client, which bypasses RLS and is significantly faster.
 * 
 * Detection methods (in order of reliability):
 * 1. NEXT_PHASE === 'phase-production-build' (most reliable - set by Next.js)
 * 2. process.argv contains 'next' and 'build' (works for direct next build commands)
 * 3. Deployment env is 'build' (platform-agnostic detection)
 * 
 * @returns true if running during build time, false otherwise
 */
export function isBuildTime(): boolean {
  if (typeof process === 'undefined') {
    return false;
  }

  // Method 1: Check NEXT_PHASE (most reliable - set by Next.js during build)
  // Read directly from process.env to avoid schema caching issues
  const nextPhase = typeof process.env !== 'undefined' ? process.env['NEXT_PHASE'] : undefined;
  if (nextPhase === 'phase-production-build' || nextPhase === 'phase-production-server') {
    return true;
  }

  // Method 2: Check process.argv for build commands
  // This works when Next.js is invoked directly (e.g., "next build" or "pnpm build")
  if (typeof process.argv !== 'undefined') {
    const argvString = process.argv.join(' ');
    const isBuildCommand = 
      (argvString.includes('next') && (argvString.includes('build') || argvString.includes('export'))) ||
      argvString.includes('turbo') && argvString.includes('build');
    if (isBuildCommand) {
      return true;
    }
  }

  // Method 3: Check deployment environment (platform-agnostic)
  // If env is 'build', we're definitely in a build phase
  const deploymentEnv = getDeploymentEnv();
  if (deploymentEnv === 'build') {
    return true;
  }

  // Method 4: Check if NODE_ENV is production but we're not on a known platform (local build)
  // Next.js sets NODE_ENV=production during build, even locally
  // If we're not on a known platform and NODE_ENV is production, this is likely a local build
  const nodeEnv = typeof process.env !== 'undefined' ? process.env['NODE_ENV'] : undefined;
  const platform = detectPlatform();
  
  if (nodeEnv === 'production' && platform === 'unknown') {
    // Additional check: if we have Supabase env vars, this is likely a build
    // (builds need database access, so env vars should be present)
    const hasSupabaseEnv =
      env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (hasSupabaseEnv) {
      // We have Supabase env but not on a known platform and NODE_ENV is production
      // This is most likely a local build
      return true;
    }
  }

  // Method 5: Fallback - if we don't have Supabase env, assume build (will fail anyway)
  const hasSupabaseEnv =
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return true;
  }

  return false;
}
