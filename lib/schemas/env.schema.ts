/**
 * Production-grade environment variable validation
 * Ensures all environment variables are properly typed and validated at runtime
 * This prevents runtime errors from missing or malformed environment variables
 */

import { z } from 'zod';
import { nonEmptyString, urlString } from '@/lib/schemas/primitives/base-strings';

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
  KV_REST_API_URL: urlString.optional(),
  KV_REST_API_TOKEN: nonEmptyString.optional(),

  // Arcjet security - Required in production for rate limiting and DDoS protection
  ARCJET_KEY: nonEmptyString.optional(),

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
  UMAMI_API_URL: urlString.optional(),

  // Rate limiting secrets
  RATE_LIMIT_SECRET: z.string().min(32).optional(),

  // Cache warming authorization
  CACHE_WARM_AUTH_TOKEN: z.string().min(32).optional(),

  // Development cache bypass flags
  BYPASS_RELATED_CACHE: z.enum(['true', 'false']).optional(),

  // View count security salt
  VIEW_COUNT_SALT: z.string().min(16).optional(),

  // GitHub API integration
  GITHUB_TOKEN: nonEmptyString.optional(),
  GITHUB_OWNER: nonEmptyString.optional(),
  GITHUB_REPO: nonEmptyString.optional(),

  // Webhook security
  WEBHOOK_SECRET: z.string().min(32).optional(),
});

/**
 * Build-time environment variables schema
 * These are available during the build process
 */
const buildEnvSchema = z.object({
  // Package version from npm
  npm_package_version: nonEmptyString.default('1.0.0'),
  npm_package_name: z.string().optional(),
  // Server port
  PORT: nonEmptyString.default('3000'),
});

/**
 * Client-side environment variables schema
 * These are exposed to the browser and must not contain sensitive data
 * All client env vars must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  // Public analytics
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().uuid().optional(),
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: urlString.optional(),

  // Debug flags
  NEXT_PUBLIC_DEBUG_ANALYTICS: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_ENABLE_PWA: z.enum(['true', 'false']).optional(),

  // Public API endpoints
  NEXT_PUBLIC_API_URL: urlString.optional(),
  NEXT_PUBLIC_SITE_URL: urlString.optional(),
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
 * Memoized validation cache for performance
 * Validation runs once per process, not on every import
 */
let cachedEnv: Env | null = null;
let validationAttempted = false;

/**
 * Validation function with comprehensive error handling and memoization
 * Performance: Runs validation once per process lifecycle
 * Security: Server-only validation never executes client-side
 */
function validateEnv(): Env {
  // Performance: Return cached result on subsequent calls
  if (validationAttempted && cachedEnv) {
    return cachedEnv;
  }

  validationAttempted = true;

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
    cachedEnv = envSchema.parse({
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
    return cachedEnv;
  }

  // Additional production validation - ONLY RUN SERVER-SIDE
  // Security-critical: This validation MUST NEVER run client-side
  // Client bundles must not include server-only env var names or validation logic
  const isServer = typeof window === 'undefined';
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-production-server';
  const isProductionRuntime =
    process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  // Only validate server-only env vars on server, outside build phase, in production runtime
  // This ensures: 1) No client-side exposure 2) No build-time failures 3) Runtime security enforcement
  if (isServer && !isBuildPhase && isProductionRuntime) {
    const missingRequiredEnvs = productionRequiredEnvs.filter((envVar) => !process.env[envVar]);

    if (missingRequiredEnvs.length > 0) {
      const log = getLogger();
      const missingVars = missingRequiredEnvs.join(', ');

      // Security: Log without exposing which specific vars are missing in production logs
      log.error('Missing required production environment variables for security features');
      throw new Error(
        `Missing required production environment variables: ${missingVars}. These are required for security and functionality in production.`
      );
    }

    // Validate minimum security token lengths - fail fast on weak secrets
    const securityValidations = [
      {
        name: 'RATE_LIMIT_SECRET',
        value: process.env.RATE_LIMIT_SECRET,
        minLength: 32,
      },
      {
        name: 'CACHE_WARM_AUTH_TOKEN',
        value: process.env.CACHE_WARM_AUTH_TOKEN,
        minLength: 32,
      },
      {
        name: 'VIEW_COUNT_SALT',
        value: process.env.VIEW_COUNT_SALT,
        minLength: 16,
      },
      {
        name: 'WEBHOOK_SECRET',
        value: process.env.WEBHOOK_SECRET,
        minLength: 32,
      },
    ];

    for (const validation of securityValidations) {
      if (validation.value && validation.value.length < validation.minLength) {
        throw new Error(
          `${validation.name} must be at least ${validation.minLength} characters for production security`
        );
      }
    }
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * Validated and typed environment variables
 * Performance: Lazy evaluation with memoization
 * Security: Server-only validation never runs client-side
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
