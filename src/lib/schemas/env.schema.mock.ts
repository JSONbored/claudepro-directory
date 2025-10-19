/**
 * Environment Schema - Storybook Mock Implementation
 *
 * This file provides mock environment variables for Storybook.
 * Avoids loading server-side environment validation.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real env.schema.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/schemas/env.schema.ts for production implementation
 */

// Mock environment flags
export const isDevelopment = true;
export const isProduction = false;
export const isTest = false;

// Mock environment object with only client-safe variables
export const env = {
  NODE_ENV: 'development' as const,
  NEXT_PUBLIC_DEBUG_ANALYTICS: 'false',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:6006',
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: '',
  NEXT_PUBLIC_VERCEL_ENV: 'development' as const,
};
