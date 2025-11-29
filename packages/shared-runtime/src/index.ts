/**
 * @heyclaude/shared-runtime - Environment-Agnostic Utilities
 *
 * This package provides pure TypeScript utilities that work across all
 * JavaScript runtimes (Node.js, Deno, browser, edge). It has NO React,
 * Next.js, or other framework dependencies.
 *
 * ## What Belongs Here
 *
 * - Configuration constants (APP_CONFIG, ROUTES, etc.)
 * - Pure utility functions (validation, sanitization, formatting)
 * - Error handling and normalization
 * - Logging infrastructure (pino-based)
 * - Security utilities (headers, crypto)
 * - Schema definitions (zod schemas)
 *
 * ## What Does NOT Belong Here
 *
 * - React hooks or components → @heyclaude/web-runtime
 * - Next.js specific utilities → @heyclaude/web-runtime/server
 * - Database operations → @heyclaude/data-layer
 * - Server actions → @heyclaude/web-runtime/actions
 *
 * ## Key Exports
 *
 * - `normalizeError(error, fallback)` - Normalize any error to Error object
 * - `logger` - Structured pino logger instance
 * - `APP_CONFIG` - Application configuration constants
 * - `ROUTES` - Application route definitions
 * - `buildSecurityHeaders()` - HTTP security headers
 *
 * @packageDocumentation
 */

export * from './jsonld.ts';
export * from './security-headers.ts';
export * from './input-validation.ts';
export * from './search-highlight.ts';
export * from './error-handling.ts';
export * from './logging.ts';
// Export logger from logger/index.ts (not from logging.ts to avoid duplicate)
export { createLogger, logger as pinoLogger, createPinoConfig, SENSITIVE_PATTERNS, BASE_CONTEXT } from './logger/index.ts';
// Export logTrace for trace-level logging
export { logTrace } from './logging.ts';
export * from './validate-email.ts';
export * from './sanitize-text.ts';
export * from './og-constants.ts';
export * from './batch-processor.ts';
export * from './timeout.ts';
export * from './circuit-breaker.ts';
export * from './code-highlight.ts';
export * from './content-processing.ts';
export * from './rate-limit.ts';
export * from './webhook/crypto.ts';
export * from './crypto-utils.ts';
// Resolve duplicate export ambiguity from env.ts
export {
  getEnvVar,
  getEnvObject,
  requireEnvVar,
  getNumberEnvVar,
  getBooleanEnvVar,
  getNodeEnv,
  isDevelopment,
  isProduction,
  isVercel,
  clearEnvCache
} from './env.ts';
export * from './proxy/guards.ts';
export * from './error/database-parser.ts';
export * from './config/app.ts';
export * from './config/security.ts';
export * from './config/routes.ts';
export * from './config/services.ts';
export * from './config/time.ts';
export * from './schemas/primitives.ts';
export * from './schemas/env.ts';
export * from './schemas/database.generated.ts';
export * from './object-utils.ts';
export * from './privacy.ts';
// NOTE: Image manipulation is edge-function-only and should not be imported in web app
// This export is commented out to prevent the Deno-only @imagemagick/magick-wasm package
// from being included in the web app bundle. Edge functions can import directly from
// packages/shared-runtime/src/image/manipulation.ts if needed.
// export * from './image/manipulation.ts';
