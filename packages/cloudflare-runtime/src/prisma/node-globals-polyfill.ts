/**
 * Node.js Globals Polyfill for Cloudflare Workers
 *
 * Prisma's CommonJS wrapper and compiled client use Node.js globals (module, require, __dirname, __filename)
 * which are not available in Cloudflare Workers even with nodejs_compat.
 * This polyfill ensures these globals are available before Prisma loads.
 *
 * IMPORTANT: This file MUST be imported FIRST, before any Prisma imports.
 * The package.json marks this file as having side effects to ensure it runs.
 */

// Polyfill module global (used by Prisma's CommonJS wrapper)
if (typeof globalThis.module === 'undefined') {
  // @ts-expect-error - We're polyfilling Node.js globals
  globalThis.module = {
    exports: {},
  };
}

// Polyfill require global (used by Prisma's CommonJS wrapper)
if (typeof globalThis.require === 'undefined') {
  // @ts-expect-error - We're polyfilling Node.js globals
  globalThis.require = function require(id: string) {
    // This is a minimal polyfill - actual require resolution is handled by wrangler
    throw new Error(`require('${id}') is not supported in Cloudflare Workers. Use ES modules instead.`);
  };
}

// Polyfill __dirname (used by Prisma's compiled client)
if (typeof (globalThis as { __dirname?: string }).__dirname === 'undefined') {
  (globalThis as { __dirname: string }).__dirname = '/';
}

// Polyfill __filename (used by Prisma's compiled client)
if (typeof (globalThis as { __filename?: string }).__filename === 'undefined') {
  (globalThis as { __filename: string }).__filename = '/worker.js';
}

