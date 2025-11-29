/** Runtime environment variable validation schema */

import { getEnvObject, logger, normalizeError, nonEmptyString, urlString } from '@heyclaude/shared-runtime';
import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server and contain sensitive data
 */
const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development')
      .describe('Application runtime environment mode'),

    // Next.js framework variables
    NEXT_PHASE: z
      .string()
      .optional()
      .describe('Next.js build phase (e.g., "phase-production-build", "phase-development-server")'),
    NEXT_RUNTIME: z
      .enum(['nodejs', 'edge'])
      .optional()
      .describe('Next.js runtime environment (nodejs or edge)'),

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

    UMAMI_WEBSITE_ID: z
      .string()
      .uuid()
      .optional()
      .describe('Umami analytics website ID for server-side tracking'),
    UMAMI_API_URL: urlString
      .optional()
      .describe('Umami API endpoint URL for server-side analytics'),

    RATE_LIMIT_SECRET: z
      .string()
      .min(32)
      .optional()
      .describe('Secret key for rate limiting token generation (minimum 32 characters)'),

    CACHE_WARM_AUTH_TOKEN: z
      .string()
      .min(32)
      .optional()
      .describe('Authorization token for cache warming endpoints (minimum 32 characters)'),

    BYPASS_RELATED_CACHE: z
      .enum(['true', 'false'])
      .optional()
      .describe('Development flag to bypass related content caching'),

    VIEW_COUNT_SALT: z
      .string()
      .min(16)
      .optional()
      .describe('Salt for secure view count hashing (minimum 16 characters)'),

    WEBHOOK_SECRET: z
      .string()
      .min(32)
      .optional()
      .describe('Secret key for webhook signature validation (minimum 32 characters)'),

    CRON_SECRET: z
      .string()
      .min(32)
      .optional()
      .describe('Secret key for cron job authorization (minimum 32 characters)'),

    REVALIDATE_SECRET: z
      .string()
      .min(32)
      .optional()
      .describe(
        'Secret key for on-demand ISR revalidation from Supabase webhooks (minimum 32 characters)'
      ),

    BETTERSTACK_HEARTBEAT_DAILY_MAINTENANCE: urlString
      .optional()
      .describe('BetterStack heartbeat URL for daily maintenance cron monitoring'),
    BETTERSTACK_HEARTBEAT_WEEKLY_TASKS: urlString
      .optional()
      .describe('BetterStack heartbeat URL for weekly tasks cron monitoring'),

    RESEND_API_KEY: nonEmptyString
      .optional()
      .describe('Resend API key for transactional email and newsletter subscriptions'),
    RESEND_AUDIENCE_ID: nonEmptyString
      .optional()
      .describe('Resend Audience ID for newsletter contact management'),
    RESEND_WEBHOOK_SECRET: nonEmptyString
      .optional()
      .describe('Resend webhook signing secret (from Svix) for verifying webhook authenticity'),

    SUPABASE_SERVICE_ROLE_KEY: nonEmptyString
      .optional()
      .describe('Supabase service role key for admin operations (bypasses RLS)'),

    GITHUB_BOT_TOKEN: nonEmptyString
      .optional()
      .describe(
        'GitHub Personal Access Token for automated PR creation (requires Contents + Pull Requests permissions)'
      ),

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
    npm_package_version: nonEmptyString
      .default('1.0.0')
      .describe('NPM package version from package.json'),
    npm_package_name: z.string().optional().describe('NPM package name from package.json'),
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
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z
      .string()
      .uuid()
      .optional()
      .describe('Public Umami analytics website ID exposed to the browser'),
    NEXT_PUBLIC_UMAMI_SCRIPT_URL: urlString
      .optional()
      .describe('Public Umami analytics script URL for client-side tracking'),

    NEXT_PUBLIC_DEBUG_ANALYTICS: z
      .enum(['true', 'false'])
      .optional()
      .describe('Enable debug logging for analytics in the browser'),
    NEXT_PUBLIC_ENABLE_PWA: z
      .enum(['true', 'false'])
      .optional()
      .describe('Enable Progressive Web App features'),

    NEXT_PUBLIC_API_URL: urlString.optional().describe('Public API endpoint URL'),
    NEXT_PUBLIC_SITE_URL: urlString.optional().describe('Public site URL for canonical links'),

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
  'RATE_LIMIT_SECRET',
  'CACHE_WARM_AUTH_TOKEN',
  'VIEW_COUNT_SALT',
  'WEBHOOK_SECRET',
  'CRON_SECRET',
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

  const rawEnv = getEnvObject();
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const errorDetails = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    const normalized = normalizeError(
      new Error(`Invalid environment variables: ${errorDetails}`),
      'Invalid environment variables detected'
    );
    logger.error('Invalid environment variables detected', normalized, {
      errorDetails,
      phase: 'validation',
    });

    // In production, we should fail fast on invalid env vars
    if ((rawEnv['NODE_ENV'] ?? 'development') === 'production') {
      throw new Error('Invalid environment variables. Check the logs for details.');
    }

    // In development, warn but continue with defaults
    logger.warn('Using default values for missing environment variables');
    cachedEnv = envSchema.parse({
      ...rawEnv,
      NODE_ENV: rawEnv['NODE_ENV'] ?? 'development',
    });
    return cachedEnv;
  }

  // Production validation - server-side only for security
  const isServer = typeof window === 'undefined';
  const isBuildPhase =
    rawEnv['NEXT_PHASE'] === 'phase-production-build' ||
    rawEnv['NEXT_PHASE'] === 'phase-production-server';
  const isProductionRuntime =
    rawEnv['NODE_ENV'] === 'production' || rawEnv['VERCEL_ENV'] === 'production';

  if (isServer && !isBuildPhase && isProductionRuntime) {
    const missingRequiredEnvs = productionRequiredEnvs.filter((envVar) => !rawEnv[envVar]);

    if (missingRequiredEnvs.length > 0) {
      const missingVars = missingRequiredEnvs.join(', ');

      logger.error('Missing required production environment variables for security features');
      throw new Error(
        `Missing required production environment variables: ${missingVars}. These are required for security and functionality in production.`
      );
    }

    const securityValidations = [
      {
        name: 'RATE_LIMIT_SECRET',
        value: rawEnv['RATE_LIMIT_SECRET'],
        minLength: 32,
      },
      {
        name: 'CACHE_WARM_AUTH_TOKEN',
        value: rawEnv['CACHE_WARM_AUTH_TOKEN'],
        minLength: 32,
      },
      {
        name: 'VIEW_COUNT_SALT',
        value: rawEnv['VIEW_COUNT_SALT'],
        minLength: 16,
      },
      {
        name: 'WEBHOOK_SECRET',
        value: rawEnv['WEBHOOK_SECRET'],
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

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';

/**
 * Security configuration
 * Production Security: Frozen to prevent runtime mutations
 */
export const securityConfig = Object.freeze({
  rateLimitSecret: env.RATE_LIMIT_SECRET,
  cacheWarmToken: env.CACHE_WARM_AUTH_TOKEN,
  isSecured: !!env.RATE_LIMIT_SECRET,
} as const);

/**
 * Build configuration
 * Production Security: Frozen to prevent runtime mutations
 */
export const buildConfig = Object.freeze({
  version: env.npm_package_version,
  packageName: env.npm_package_name,
} as const);
