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

// These are build-time constants, safe for client
export const isVercel = process.env['VERCEL'] === '1';
