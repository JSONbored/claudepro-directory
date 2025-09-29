/**
 * Production-grade environment variable validation
 * Ensures all environment variables are properly typed and validated at runtime
 * This prevents runtime errors from missing or malformed environment variables
 */

import { z } from 'zod';

// Logger import - must be lazy to avoid circular dependency during env initialization
function getLogger(): { error: (msg: string) => void; warn: (msg: string) => void } {
  try {
    // Lazy load to avoid circular dependency
    const loggerModule = require('../logger');
    return loggerModule.logger;
  } catch {
    // Fallback to console if logger is not available during early initialization
    return {
      error: (msg: string) => {
        // biome-ignore lint/suspicious/noConsole: Fallback for early initialization before logger is available
        console.error(msg);
      },
      warn: (msg: string) => {
        // biome-ignore lint/suspicious/noConsole: Fallback for early initialization before logger is available
        console.warn(msg);
      },
    };
  }
}

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

  // Arcjet security - Required in production for rate limiting and DDoS protection
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

  // View count security salt
  VIEW_COUNT_SALT: z.string().min(16).optional(),

  // GitHub API integration
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_OWNER: z.string().min(1).optional(),
  GITHUB_REPO: z.string().min(1).optional(),

  // Webhook security
  WEBHOOK_SECRET: z.string().min(32).optional(),
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
 * Production-specific required environment variables
 * These must be set in production for security and functionality
 */
const productionRequiredEnvs = [
  'ARCJET_KEY', // DDoS and rate limiting protection
  'RATE_LIMIT_SECRET', // Rate limiting security
  'CACHE_WARM_AUTH_TOKEN', // Cache warming authorization
  'VIEW_COUNT_SALT', // Secure view count generation
  'WEBHOOK_SECRET', // Webhook signature validation
] as const;

/**
 * Validation function with comprehensive error handling
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const log = getLogger();
    const errorDetails = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);

    log.error(`Invalid environment variables detected: ${errorDetails}`);

    // In production, we should fail fast on invalid env vars
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables. Check the logs for details.');
    }

    // In development, warn but continue with defaults
    log.warn('Using default values for missing environment variables');
    return envSchema.parse({
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
  }

  // Additional production validation - Skip during build phase
  // These variables are injected at runtime in Vercel, not available during build
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (typeof window === 'undefined' && !process.env.VERCEL);

  if (
    !isBuildPhase &&
    (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production')
  ) {
    const missingRequiredEnvs = productionRequiredEnvs.filter((envVar) => !process.env[envVar]);

    if (missingRequiredEnvs.length > 0) {
      const log = getLogger();
      const missingVars = missingRequiredEnvs.join(', ');

      log.error(`Missing required production environment variables: ${missingVars}`);
      throw new Error(
        `Missing required production environment variables: ${missingVars}. These are required for security and functionality in production.`
      );
    }

    // Validate that security tokens meet minimum requirements
    if (process.env.RATE_LIMIT_SECRET && process.env.RATE_LIMIT_SECRET.length < 32) {
      throw new Error('RATE_LIMIT_SECRET must be at least 32 characters for production security');
    }
    if (process.env.CACHE_WARM_AUTH_TOKEN && process.env.CACHE_WARM_AUTH_TOKEN.length < 32) {
      throw new Error(
        'CACHE_WARM_AUTH_TOKEN must be at least 32 characters for production security'
      );
    }
    if (process.env.VIEW_COUNT_SALT && process.env.VIEW_COUNT_SALT.length < 16) {
      throw new Error('VIEW_COUNT_SALT must be at least 16 characters for production security');
    }
    if (process.env.WEBHOOK_SECRET && process.env.WEBHOOK_SECRET.length < 32) {
      throw new Error('WEBHOOK_SECRET must be at least 32 characters for production security');
    }
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
 * GitHub configuration
 */
export const githubConfig = {
  token: env.GITHUB_TOKEN,
  owner: env.GITHUB_OWNER,
  repo: env.GITHUB_REPO,
  isConfigured: !!(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO),
} as const;

/**
 * Webhook configuration
 */
export const webhookConfig = {
  secret: env.WEBHOOK_SECRET,
  isConfigured: !!env.WEBHOOK_SECRET,
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

export function hasGitHubConfig(): boolean {
  return githubConfig.isConfigured;
}

export function hasWebhookConfig(): boolean {
  return webhookConfig.isConfigured;
}
