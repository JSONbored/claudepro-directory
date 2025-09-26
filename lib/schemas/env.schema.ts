/**
 * Production-grade environment variable validation
 * Ensures all environment variables are properly typed and validated at runtime
 * This prevents runtime errors from missing or malformed environment variables
 */

import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server and contain sensitive data
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Redis/Upstash configuration
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),

  // Arcjet security
  ARCJET_KEY: z.string().min(1).optional(),

  // Vercel environment
  VERCEL: z.enum(['1']).optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_REGION: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  VERCEL_GIT_COMMIT_MESSAGE: z.string().optional(),
  VERCEL_GIT_COMMIT_AUTHOR_NAME: z.string().optional(),

  // Analytics configuration (optional for development)
  UMAMI_WEBSITE_ID: z.string().uuid().optional(),
  UMAMI_API_URL: z.string().url().optional(),

  // Rate limiting secrets
  RATE_LIMIT_SECRET: z.string().min(32).optional(),

  // Cache warming authorization
  CACHE_WARM_AUTH_TOKEN: z.string().min(32).optional(),

  // Development cache bypass flags
  BYPASS_RELATED_CACHE: z.enum(['true', 'false']).optional(),
});

/**
 * Build-time environment variables schema
 * These are available during the build process
 */
const buildEnvSchema = z.object({
  // Package version from npm
  npm_package_version: z.string().default('1.0.0'),
  npm_package_name: z.string().optional(),
  // Server port
  PORT: z.string().default('3000'),
});

/**
 * Client-side environment variables schema
 * These are exposed to the browser and must not contain sensitive data
 * All client env vars must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  // Public analytics
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().uuid().optional(),
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: z.string().url().optional(),

  // Debug flags
  NEXT_PUBLIC_DEBUG_ANALYTICS: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_ENABLE_PWA: z.enum(['true', 'false']).optional(),

  // Public API endpoints
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

/**
 * Combined environment schema
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema).merge(buildEnvSchema);

/**
 * Type definitions exported from schemas
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type BuildEnv = z.infer<typeof buildEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validation function with comprehensive error handling
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables detected:');
    console.error(parsed.error.flatten().fieldErrors);

    // In production, we should fail fast on invalid env vars
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables. Check the logs for details.');
    }

    // In development, warn but continue with defaults
    console.warn('⚠️ Using default values for missing environment variables');
    return envSchema.parse({
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
  }

  return parsed.data;
}

/**
 * Validated and typed environment variables
 * This ensures type safety throughout the application
 */
export const env = validateEnv();

/**
 * Helper functions for common environment checks
 */
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isVercel = env.VERCEL === '1';
export const isPreview = env.VERCEL_ENV === 'preview';

/**
 * Redis configuration with fallback
 */
export const redisConfig = {
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN,
  isConfigured: !!(env.KV_REST_API_URL && env.KV_REST_API_TOKEN),
} as const;

/**
 * Security configuration
 */
export const securityConfig = {
  arcjetKey: env.ARCJET_KEY,
  rateLimitSecret: env.RATE_LIMIT_SECRET,
  cacheWarmToken: env.CACHE_WARM_AUTH_TOKEN,
  isSecured: !!(env.ARCJET_KEY && env.RATE_LIMIT_SECRET),
} as const;

/**
 * Analytics configuration
 */
export const analyticsConfig = {
  umamiWebsiteId: env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
  umamiScriptUrl: env.NEXT_PUBLIC_UMAMI_SCRIPT_URL,
  debugEnabled: env.NEXT_PUBLIC_DEBUG_ANALYTICS === 'true',
  isConfigured: !!(env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && env.NEXT_PUBLIC_UMAMI_SCRIPT_URL),
} as const;

/**
 * Site configuration
 */
export const siteConfig = {
  url:
    env.NEXT_PUBLIC_SITE_URL ||
    (isProduction ? 'https://claudepro.directory' : `http://localhost:${env.PORT}`),
  apiUrl: env.NEXT_PUBLIC_API_URL || '/api',
  isPWAEnabled: env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  bypassCache: env.BYPASS_RELATED_CACHE === 'true',
} as const;

/**
 * Build configuration
 */
export const buildConfig = {
  version: env.npm_package_version,
  packageName: env.npm_package_name,
} as const;

/**
 * Export the schema for use in other files
 */
export { envSchema, serverEnvSchema, clientEnvSchema, buildEnvSchema };

/**
 * Type guard functions for runtime checks
 */
export function hasRedisConfig(): boolean {
  return redisConfig.isConfigured;
}

export function hasSecurityConfig(): boolean {
  return securityConfig.isSecured;
}

export function hasAnalyticsConfig(): boolean {
  return analyticsConfig.isConfigured;
}
