/**
 * Type declarations for Node.js globals polyfill
 *
 * These types augment the global scope to support Prisma's CommonJS wrapper
 * and compiled client in Cloudflare Workers environment.
 *
 * Note: We declare these as optional properties to avoid conflicts with Node.js
 * built-in types when they don't exist. The polyfill provides minimal implementations
 * that Prisma's compiled code expects.
 */

declare global {
  /**
   * Module global (used by Prisma's CommonJS wrapper)
   * Minimal type that matches what Prisma expects
   */
  var module:
    | {
        exports: Record<string, unknown>;
      }
    | undefined;

  /**
   * Require global (used by Prisma's CommonJS wrapper)
   * This is a polyfill that throws an error - actual require resolution is handled by wrangler
   */
  var require: ((id: string) => never) | undefined;

  /**
   * __dirname global (used by Prisma's compiled client)
   */
  var __dirname: string | undefined;

  /**
   * __filename global (used by Prisma's compiled client)
   */
  var __filename: string | undefined;
}

export {};
