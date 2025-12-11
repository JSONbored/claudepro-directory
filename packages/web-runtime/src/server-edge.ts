/**
 * Edge-Safe Server Exports for Proxy/Middleware
 * 
 * This barrel exports ONLY edge-compatible functions that don't import pino.
 * Use this in proxy.ts and middleware.ts files to avoid pulling in Node.js-only dependencies.
 * 
 * ⚠️ IMPORTANT: This is a minimal export set for edge compatibility.
 * For full server functionality, use @heyclaude/web-runtime/server instead.
 * 
 * **Why This Exists:**
 * - The main server.ts barrel exports many modules that import logger (pino)
 * - Netlify analyzes middleware bundles and fails if pino is detected
 * - This barrel only exports edge-safe functions with zero pino dependencies
 * 
 * **Usage:**
 * - ✅ Use in proxy.ts, middleware.ts, and other edge-compatible files
 * - ❌ Don't use in server components that need full server functionality
 */

// Edge-safe proxy utilities (no pino dependency)
export * from './proxy/next.ts';

// Edge-safe Supabase middleware (no pino dependency)
export * from './supabase/middleware.ts';

// Edge-safe error normalization (no pino dependency)
export { normalizeErrorEdge } from './errors-edge.ts';
