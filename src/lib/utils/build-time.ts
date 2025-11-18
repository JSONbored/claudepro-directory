/**
 * Build-time Detection Utility
 *
 * Centralized utility to detect if we're in a build-time context.
 * Used to prevent server function calls, Edge Config access, and other
 * build-incompatible operations during static generation.
 *
 * CRITICAL: flags/next uses Vercel Edge Config as a cache layer.
 * Accessing Edge Config during build triggers "Server Functions cannot be called" errors.
 * This utility MUST be used before any flags/next imports.
 */

/**
 * Detect if we're in build-time static generation context
 *
 * CRITICAL: This must be EXTREMELY conservative - during static generation,
 * we MUST return true to prevent ANY flags/next imports, even if env vars are present.
 *
 * During static generation/prerendering, Next.js analyzes modules and any `require('flags/next')`
 * calls trigger Edge Config access, causing "Server Functions cannot be called" errors.
 *
 * @returns true if we're in build-time, false if runtime
 */
export function isBuildTime(): boolean {
  if (typeof process === 'undefined') {
    return false; // Browser context - definitely not build-time
  }

  // Next.js sets NEXT_PHASE during build - this is the most reliable indicator
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true;
  }

  // CRITICAL: During static generation (prerendering), Next.js may not set NEXT_PHASE
  // but we can detect it by checking if we're in a build process
  // Check for build command in process arguments FIRST (before env var check)
  if (typeof process.argv !== 'undefined') {
    const isBuildCommand = process.argv.some(
      (arg) => arg.includes('next') && (arg.includes('build') || arg.includes('export'))
    );
    if (isBuildCommand) {
      return true; // We're definitely in build-time
    }
  }

  // CRITICAL: During static generation (prerendering), Next.js analyzes modules
  // and ANY require('flags/next') calls trigger Edge Config access
  // We MUST be EXTREMELY conservative and assume build-time unless we're 100% certain we're in runtime

  // PRIMARY HEURISTIC: During static generation/prerendering, env vars are often missing
  // If env vars are missing, we're almost certainly in build context
  // CRITICAL: This check MUST happen before any flags/next imports to prevent Edge Config access
  const hasSupabaseEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseEnv) {
    return true; // Conservative: assume build-time if env vars missing
  }

  // CRITICAL: During static generation, we're in Node.js runtime but NOT in a request context
  // If we're in Node.js runtime but NOT in Vercel production, we're likely building
  // During local builds, VERCEL env vars are not set
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // If we don't have Vercel environment indicators, we're likely in a build context
    // Be EXTREMELY conservative: assume build-time unless we're definitely in Vercel production
    if (!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL)) {
      // We're likely in a local build context
      // CRITICAL: Return true to prevent ANY flags/next imports during static generation
      return true;
    }
  }

  // FINAL CHECK: During static generation (prerendering), we're in Node.js runtime
  // but NOT in a request context. We MUST assume build-time unless we're 100% certain
  // we're in a Vercel production runtime request.
  //
  // CRITICAL: During local builds, VERCEL env vars are NEVER set, so we MUST return true
  // This prevents ANY flags/next imports during static generation
  if (!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL)) {
    // We're in a local build context - ALWAYS assume build-time
    // This is the most conservative approach and prevents Edge Config access
    return true;
  }

  // Only return false if we're absolutely certain we're in Vercel production runtime
  // This should only happen during actual request handling in production
  return false;
}
