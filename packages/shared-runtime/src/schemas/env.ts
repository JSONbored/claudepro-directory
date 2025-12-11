/** Runtime environment variable validation schema */

import { z } from 'zod';

import { getEnvObject } from '../env.ts';
import { logger, normalizeError } from '../logger/index.ts';

import { nonEmptyString, optionalUrlString } from './primitives.ts';

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

    REVALIDATE_SECRET: z
      .preprocess(
        (val) => (val === '' || val === null ? undefined : val),
        z.string().min(32).optional()
      )
      .describe(
        'Secret key for on-demand ISR revalidation from Supabase webhooks (minimum 32 characters)'
      ),

    BETTERSTACK_HEARTBEAT_WEEKLY_TASKS: optionalUrlString
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
    NEXT_PUBLIC_SITE_URL: optionalUrlString.describe('Public site URL for canonical links'),

    NEXT_PUBLIC_SUPABASE_URL: optionalUrlString
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
 * 
 * Note: Previously required variables (RATE_LIMIT_SECRET, CACHE_WARM_AUTH_TOKEN,
 * VIEW_COUNT_SALT, WEBHOOK_SECRET, CRON_SECRET) have been removed as they are
 * not actually used in the codebase. They were likely planned for future features
 * that were never implemented or replaced by other implementations.
 */
const productionRequiredEnvs = [
  // No variables currently required - all security features use optional env vars
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
  
  // Check if we're in build phase - be more lenient during builds
  // Netlify may not pass all env vars during build, but they're available at runtime
  const isBuildPhase =
    rawEnv['NEXT_PHASE'] === 'phase-production-build' ||
    rawEnv['NEXT_PHASE'] === 'phase-production-server';
  
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const errorDetails = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
    
    // Debug: Log actual values for problematic env vars to understand what Netlify is passing
    // Check BOTH rawEnv (normalized) AND process.env (raw) to see if normalization is the issue
    const debugValues: Record<string, unknown> = {};
    const problematicKeys = ['REVALIDATE_SECRET', 'BETTERSTACK_HEARTBEAT_WEEKLY_TASKS', 'NEXT_PUBLIC_SUPABASE_URL'];
    for (const key of problematicKeys) {
      const rawValue = rawEnv[key];
      // Also check process.env directly to see if normalization is truncating
      const processEnvValue = typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
      debugValues[key] = {
        exists: key in rawEnv,
        type: typeof rawValue,
        length: typeof rawValue === 'string' ? rawValue.length : 'N/A',
        processEnvLength: typeof processEnvValue === 'string' ? processEnvValue.length : 'N/A',
        processEnvExists: processEnvValue !== undefined,
        valuePreview: typeof rawValue === 'string' 
          ? (rawValue.length > 0 ? `${rawValue.substring(0, 50)}${rawValue.length > 50 ? '...' : ''}` : '(empty string)')
          : String(rawValue),
        processEnvPreview: typeof processEnvValue === 'string'
          ? (processEnvValue.length > 0 ? `${processEnvValue.substring(0, 50)}${processEnvValue.length > 50 ? '...' : ''}` : '(empty string)')
          : String(processEnvValue),
        isUndefined: rawValue === undefined,
        isNull: rawValue === null,
        isEmptyString: rawValue === '',
        processEnvIsEmpty: processEnvValue === '',
      };
    }
    
    const validationError = new Error(`Invalid environment variables: ${errorDetails}`);
    // Fire-and-forget: validation must remain synchronous
    const normalized = normalizeError(validationError, 'Invalid environment variables detected');
    void logger.error({
      err: normalized,
      module: 'shared-runtime',
      operation: 'validateEnv',
      errorDetails,
      phase: 'validation',
      isBuildPhase,
      debugValues, // Include debug info to see what Netlify is actually passing
    }, 'Invalid environment variables detected');

    // During build phase, be lenient - env vars may not be available yet
    // Netlify may not pass all env vars during build, but they're available at runtime
    // They'll be validated again at runtime when they're actually needed
    if (isBuildPhase) {
      logger.warn({
        module: 'shared-runtime',
        operation: 'validateEnv',
        phase: 'build',
        errorDetails,
      }, 'Skipping strict env validation during build phase - will validate at runtime');
      // Use a permissive parse that filters out invalid optional fields
      const buildTimeEnv: Record<string, unknown> = { ...rawEnv };
      // Remove invalid optional fields - they'll be validated at runtime
      for (const [key] of Object.entries(parsed.error.flatten().fieldErrors)) {
        // For optional fields, remove invalid values (set to undefined)
        // This allows the build to proceed - validation happens at runtime
        delete buildTimeEnv[key];
      }
      // Parse with cleaned env - optional fields will be undefined if invalid
      cachedEnv = envSchema.parse({
        ...buildTimeEnv,
        NODE_ENV: rawEnv['NODE_ENV'] ?? 'development',
      });
      return cachedEnv;
    }

    // In production runtime (not build), we should fail fast on invalid env vars
    if ((rawEnv['NODE_ENV'] ?? 'development') === 'production') {
      throw new Error('Invalid environment variables. Check the logs for details.');
    }

    // In development, warn but continue with defaults
    logger.warn({
      module: 'shared-runtime',
      operation: 'validateEnv',
    }, 'Using default values for missing environment variables');
    cachedEnv = envSchema.parse({
      ...rawEnv,
      NODE_ENV: rawEnv['NODE_ENV'] ?? 'development',
    });
    return cachedEnv;
  }

  // Production validation - server-side only for security  
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime check for SSR detection
  const isServer = globalThis.window === undefined;
  // Reuse isBuildPhase from above (line 247)
  const isProductionRuntime =
    rawEnv['NODE_ENV'] === 'production' || rawEnv['VERCEL_ENV'] === 'production';

  if (isServer && !isBuildPhase && isProductionRuntime) {
    const missingRequiredEnvs = productionRequiredEnvs.filter((envVar) => !rawEnv[envVar]);

    if (missingRequiredEnvs.length > 0) {
      const missingVars = missingRequiredEnvs.join(', ');
      const missingEnvError = new Error(`Missing required production environment variables: ${missingVars}`);
      
      // Fire-and-forget: log the error before throwing
      const normalized = normalizeError(missingEnvError, 'Missing required production environment variables for security features');
      void logger.error({
        err: normalized,
        module: 'shared-runtime',
        operation: 'validateEnv',
        missingVars,
      }, 'Missing required production environment variables for security features');
      throw new Error(
        `Missing required production environment variables: ${missingVars}. These are required for security and functionality in production.`
      );
    }

    // Security validations removed - these env vars are no longer used
    // Previously validated: RATE_LIMIT_SECRET, CACHE_WARM_AUTH_TOKEN, VIEW_COUNT_SALT, WEBHOOK_SECRET
    // These were removed as they are not actually used in the codebase
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
 * Build configuration
 * Production Security: Frozen to prevent runtime mutations
 */
export const buildConfig = Object.freeze({
  version: env['npm_package_version'],
  packageName: env['npm_package_name'],
} as const);
