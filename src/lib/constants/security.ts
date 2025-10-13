/**
 * Security Configuration Constants
 *
 * Extracted to separate file to prevent circular dependencies.
 * This file contains security-related configuration that's used in schema validation.
 *
 * @module constants/security
 */

/**
 * Security Configuration
 * Used for trusted hostname validation, security headers, and allowed origins
 */
export const SECURITY_CONFIG = {
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
  // Trusted hostnames for validation
  trustedHostnames: {
    github: ['github.com', 'www.github.com'] as const,
    umami: ['umami.claudepro.directory'] as const,
    vercel: ['va.vercel-scripts.com'] as const,
  },
  // Allowed origins for postMessage
  allowedOrigins: ['https://claudepro.directory', 'https://www.claudepro.directory'] as const,
} as const;
