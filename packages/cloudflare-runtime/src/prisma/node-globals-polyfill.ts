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

// Import type declarations for Node.js globals
import './node-globals-polyfill.js';

// Polyfill module global (used by Prisma's CommonJS wrapper)
// Using type assertion because we're providing a minimal polyfill that matches
// what Prisma expects, not the full Node.js Module type
if (typeof globalThis.module === 'undefined') {
  (globalThis as unknown as { module: { exports: Record<string, unknown> } }).module = {
    exports: {},
  };
}

// Polyfill require global (used by Prisma's CommonJS wrapper)
// Using type assertion because we're providing a minimal polyfill that throws,
// not the full Node.js Require function
if (typeof globalThis.require === 'undefined') {
  (globalThis as unknown as { require: (id: string) => never }).require = function require(id: string) {
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

