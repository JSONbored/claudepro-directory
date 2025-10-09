/**
 * Middleware Compatibility Layer for Vercel
 *
 * Next.js canary (15.6.0-canary.54) requires the middleware file to be named "proxy.ts"
 * for proper functionality. However, Vercel's deployment system expects "middleware.ts"
 * to apply functions configuration from vercel.json.
 *
 * This file re-exports everything from proxy.ts to satisfy both requirements:
 * - Next.js canary gets proxy.ts (actual implementation)
 * - Vercel finds middleware.ts (for build system compatibility)
 *
 * Re-exported items:
 * - middleware function (main request handler)
 * - runtime config ('nodejs')
 * - config (matcher configuration)
 *
 * Note: This is intentionally a compatibility/adapter file, not a barrel file.
 * The noBarrelFile rule is suppressed because this serves a specific architectural purpose.
 *
 * @see src/proxy.ts - Actual middleware implementation
 */

// biome-ignore lint/performance/noBarrelFile: This is a compatibility layer for Vercel, not a barrel file
export { config, middleware, runtime } from './proxy';
