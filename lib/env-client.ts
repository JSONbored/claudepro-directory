/**
 * Client-safe environment helpers
 *
 * These can be safely imported in any component (client or server)
 * without triggering the full environment validation that requires
 * server-only variables.
 */

// Client-safe environment checks
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// These are build-time constants, safe for client
export const isVercel = process.env.VERCEL === '1';
export const isPreview = process.env.VERCEL_ENV === 'preview';

// Runtime environment detection for Edge Runtime compatibility
export const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';
export const isBrowser = typeof window !== 'undefined';
