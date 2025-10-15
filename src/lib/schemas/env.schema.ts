/**
 * Production-grade environment variable validation
 * Ensures all environment variables are properly typed and validated at runtime
 * This prevents runtime errors from missing or malformed environment variables
 */

import { z } from 'zod';
import { nonEmptyString, urlString } from '@/src/lib/schemas/primitives/base-strings';

// Logger import - must be lazy to avoid circular dependency during env initialization
function getLogger(): {
  error: (msg: string) => void;
  warn: (msg: string) => void;
} {
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
const serverEnvSchema = z
  .object({
    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development')
      .describe('Application runtime environment mode'),

    // Redis/Upstash configuration
    KV_REST_API_URL: urlString
      .optional()
      .describe('Upstash Redis REST API endpoint URL for key-value storage'),
    KV_REST_API_TOKEN: nonEmptyString
      .optional()
      .describe('Authentication token for Upstash Redis REST API'),

    // Arcjet security - Required in production for rate limiting and DDoS protection
    ARCJET_KEY: nonEmptyString
      .optional()
      .describe('Arcjet API key for rate limiting and DDoS protection (required in production)'),

    // Vercel environment
    VERCEL: z.enum(['1']).optional().describe('Flag indicating if running on Vercel platform'),
    VERCEL_ENV: z
      .enum(['production', 'preview', 'development'])
      .optional()
      .describe('Vercel deployment environment type'),
    VERCEL_URL: z.string().optional().describe('Vercel deployment URL'),
    VERCEL_REGION: z.string().optional().describe('Vercel deployment region'),
    VERCEL_GIT_COMMIT_SHA: z.string().optional().describe('Git commit SHA of the deployment'),
    VERCEL_GIT_COMMIT_MESSAGE: z
      .string()
      .optional()
      .describe('Git commit message of the deployment'),
    VERCEL_GIT_COMMIT_AUTHOR_NAME: z
      .string()
      .optional()
      .describe('Git commit author name of the deployment'),

    // Analytics configuration (optional for development)
    UMAMI_WEBSITE_ID: z
      .string()
      .uuid()
      .optional()
      .describe('Umami analytics website ID for server-side tracking'),
    UMAMI_API_URL: urlString
      .optional()
      .describe('Umami API endpoint URL for server-side analytics'),

    // Rate limiting secrets
    RATE_LIMIT_SECRET: z
      .string()
      .min(32)
      .optional()
      .describe('Secret key for rate limiting token generation (minimum 32 characters)'),

    // Cache warming authorization
    CACHE_WARM_AUTH_TOKEN: z
      .string()
      .min(32)
      .optional()
      .describe('Authorization token for cache warming endpoints (minimum 32 characters)'),

    // Development cache bypass flags
    BYPASS_RELATED_CACHE: z
      .enum(['true', 'false'])
      .optional()
      .describe('Development flag to bypass related content caching'),

    // View count security salt
    VIEW_COUNT_SALT: z
      .string()
      .min(16)
      .optional()
      .describe('Salt for secure view count hashing (minimum 16 characters)'),

    // Webhook security
    WEBHOOK_SECRET: z
      .string()
      .min(32)
      .optional()
      .describe('Secret key for webhook signature validation (minimum 32 characters)'),

    // Cron job security
    CRON_SECRET: z
      .string()
      .min(32)
      .optional()
      .describe('Secret key for cron job authorization (minimum 32 characters)'),

    // Email provider (Resend)
    RESEND_API_KEY: nonEmptyString
      .optional()
      .describe('Resend API key for transactional email and newsletter subscriptions'),

    RESEND_AUDIENCE_ID: nonEmptyString
      .optional()
      .describe('Resend Audience ID for newsletter contact management'),

    RESEND_WEBHOOK_SECRET: nonEmptyString
      .optional()
      .describe('Resend webhook signing secret (from Svix) for verifying webhook authenticity'),

    // Supabase (server-side only)
    SUPABASE_SERVICE_ROLE_KEY: nonEmptyString
      .optional()
      .describe('Supabase service role key for admin operations (bypasses RLS)'),

    // GitHub (content submissions)
    GITHUB_BOT_TOKEN: nonEmptyString
      .optional()
      .describe(
        'GitHub Personal Access Token for automated PR creation (requires Contents + Pull Requests permissions)'
      ),

    // Polar.sh (payments)
    POLAR_ACCESS_TOKEN: nonEmptyString
      .optional()
      .describe('Polar.sh API access token for payment operations'),
    POLAR_WEBHOOK_SECRET: nonEmptyString
      .optional()
      .describe('Polar.sh webhook secret for signature verification'),
    POLAR_ENVIRONMENT: z
      .enum(['sandbox', 'production'])
      .optional()
      .describe('Polar.sh environment (sandbox for testing, production for live)'),
  })
  .describe(
    'Server-side environment variables containing sensitive data only accessible on the server'
  );

/**
 * Build-time environment variables schema
 * These are available during the build process
 */
const buildEnvSchema = z
  .object({
    // Package version from npm
    npm_package_version: nonEmptyString
      .default('1.0.0')
      .describe('NPM package version from package.json'),
    npm_package_name: z.string().optional().describe('NPM package name from package.json'),
    // Server port
    PORT: nonEmptyString.default('3000').describe('Server port for local development'),
  })
  .describe('Build-time environment variables available during the build process');

/**
 * Client-side environment variables schema
 * These are exposed to the browser and must not contain sensitive data
 * All client env vars must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z
  .object({
    // Public analytics
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z
      .string()
      .uuid()
      .optional()
      .describe('Public Umami analytics website ID exposed to the browser'),
    NEXT_PUBLIC_UMAMI_SCRIPT_URL: urlString
      .optional()
      .describe('Public Umami analytics script URL for client-side tracking'),

    // Debug flags
    NEXT_PUBLIC_DEBUG_ANALYTICS: z
      .enum(['true', 'false'])
      .optional()
      .describe('Enable debug logging for analytics in the browser'),
    NEXT_PUBLIC_ENABLE_PWA: z
      .enum(['true', 'false'])
      .optional()
      .describe('Enable Progressive Web App features'),

    // Public API endpoints
    NEXT_PUBLIC_API_URL: urlString.optional().describe('Public API endpoint URL'),
    NEXT_PUBLIC_SITE_URL: urlString.optional().describe('Public site URL for canonical links'),

    // Supabase (client-side safe)
    NEXT_PUBLIC_SUPABASE_URL: urlString
      .optional()
      .describe('Supabase project URL (safe for client-side)'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmptyString
      .optional()
      .describe('Supabase anonymous/public key (safe for client-side, RLS enforced)'),
  })
  .describe(
    'Client-side environment variables exposed to the browser (must not contain sensitive data)'
  );

/**
 * Combined environment schema
 */
const envSchema = serverEnvSchema
  .merge(clientEnvSchema)
  .merge(buildEnvSchema)
  .describe('Combined environment schema merging server, client, and build-time variables');

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
  'CRON_SECRET', // Cron job authorization
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
 *
 * Note: Not frozen to allow Next.js segment configuration exports to work
 * Nested config objects (securityConfig, buildConfig) are frozen for security
 */
export const env = validateEnv();

/**
 * Helper functions for common environment checks
 */
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';

/**
 * Security configuration
 * Production Security: Frozen to prevent runtime mutations
 */
export const securityConfig = Object.freeze({
  arcjetKey: env.ARCJET_KEY,
  rateLimitSecret: env.RATE_LIMIT_SECRET,
  cacheWarmToken: env.CACHE_WARM_AUTH_TOKEN,
  isSecured: !!(env.ARCJET_KEY && env.RATE_LIMIT_SECRET),
} as const);

/**
 * Build configuration
 * Production Security: Frozen to prevent runtime mutations
 */
export const buildConfig = Object.freeze({
  version: env.npm_package_version,
  packageName: env.npm_package_name,
} as const);
