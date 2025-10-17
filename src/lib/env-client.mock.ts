/**
 * Client Environment - Storybook Mock Implementation
 *
 * This file provides mock environment helpers for Storybook.
 * These are client-safe environment checks that don't require server variables.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real env-client.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/env-client.ts for production implementation
 */

// Mock environment as development for Storybook
export const isDevelopment = true;
export const isProduction = false;
export const isVercel = false;
