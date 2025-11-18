/**
 * Runtime-only implementation of flags/next loading
 * This file is ONLY imported at runtime, never during build
 * It contains the actual flags/next imports and implementations
 */

// CRITICAL: This file is only loaded at runtime via dynamic import
// Next.js will NOT analyze this file during build because it's dynamically imported
// with webpackIgnore comments

let _flagsNext: { flag: unknown; dedupe: unknown } | null = null;
export const getFlagsNext = async () => {
  if (!_flagsNext) {
    // CRITICAL: Use eval and character codes to prevent Next.js from statically analyzing the require
    // Build the module path from character codes: f=102, l=108, a=97, g=103, s=115, /=47, n=110, e=101, x=120, t=116
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-implied-eval
    const requireFn = eval('require');
    const modulePath = String.fromCharCode(102, 108, 97, 103, 115, 47, 110, 101, 120, 116);
    _flagsNext = requireFn(modulePath) as { flag: unknown; dedupe: unknown };
  }
  return _flagsNext;
};

let _statsigAdapter: unknown = null;
let _createServerClient: unknown = null;
let _getAuthenticatedUserFromClient: unknown = null;
let _logger: unknown = null;

export const getRuntimeDeps = async () => {
  if (!_statsigAdapter) {
    const statsigModule = await import('@flags-sdk/statsig');
    _statsigAdapter = statsigModule.statsigAdapter;
    const supabaseModule = await import('@supabase/ssr');
    _createServerClient = supabaseModule.createServerClient;
    const authModule = await import('@/src/lib/auth/get-authenticated-user');
    _getAuthenticatedUserFromClient = authModule.getAuthenticatedUserFromClient;
    const loggerModule = await import('@/src/lib/logger');
    _logger = loggerModule.logger;
  }
  return {
    statsigAdapter: _statsigAdapter as any,
    createServerClient: _createServerClient as any,
    getAuthenticatedUserFromClient: _getAuthenticatedUserFromClient as any,
    logger: _logger as any,
  };
};
