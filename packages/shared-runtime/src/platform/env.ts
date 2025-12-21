/**
 * Platform-Agnostic Environment Variable Access
 *
 * Provides standardized access to environment variables across all platforms.
 * Abstracts platform-specific environment variable names into a unified interface.
 *
 * @module platform/env
 */

import { detectPlatform } from './detection.ts';
// Lazy import to avoid circular dependency during module initialization
// platform/env.ts is imported by logger/config.ts, which can cause TDZ issues
// if env is imported at top level when schemas/env.ts calls validateEnv()

/**
 * Standardized deployment environment values
 */
export type DeploymentEnv = 'production' | 'preview' | 'development' | 'build';

/**
 * Gets the deployment environment in a platform-agnostic way.
 *
 * Priority order:
 * 1. DEPLOYMENT_ENV (explicit, platform-agnostic)
 * 2. VERCEL_ENV (Vercel-specific)
 * 3. NETLIFY_CONTEXT (Netlify-specific)
 * 4. CF_PAGES_BRANCH (Cloudflare-specific)
 * 5. NODE_ENV (fallback)
 *
 * @returns The deployment environment
 *
 * @example
 * ```ts
 * const env = getDeploymentEnv();
 * if (env === 'production') {
 *   // Production-specific logic
 * }
 * ```
 */
export function getDeploymentEnv(): DeploymentEnv {
  // This function cannot be async, so we read from process.env directly
  if (typeof process === 'undefined' || !process.env) {
    return 'development';
  }

  const platform = detectPlatform();

  // Priority 1: Explicit DEPLOYMENT_ENV (platform-agnostic)
  // DEPLOYMENT_ENV is not in schema (platform-specific), use getEnvVar for dynamic access
  const explicitEnv = typeof process !== 'undefined' && process.env ? process.env['DEPLOYMENT_ENV'] : undefined;
  if (explicitEnv) {
    const normalized = explicitEnv.toLowerCase().trim();
    if (
      normalized === 'production' ||
      normalized === 'preview' ||
      normalized === 'development' ||
      normalized === 'build'
    ) {
      return normalized as DeploymentEnv;
    }
  }

  // Priority 2: Platform-specific environment detection
  switch (platform) {
    case 'aws':
      // AWS Amplify uses AMPLIFY_ENV
      // Platform-specific env vars not in schema - use process.env directly
      const amplifyEnvVar = typeof process !== 'undefined' && process.env ? process.env['AMPLIFY_ENV'] : undefined;
      if (amplifyEnvVar) {
        const amplifyEnv = amplifyEnvVar.toLowerCase();
        if (amplifyEnv === 'production') return 'production';
        return 'preview';
      }
      break;

    case 'cloudflare':
      // CF_PAGES_BRANCH: main (production) or branch name (preview)
      // Platform-specific env vars not in schema - use process.env directly
      const cfPagesBranch = typeof process !== 'undefined' && process.env ? process.env['CF_PAGES_BRANCH'] : undefined;
      if (cfPagesBranch) {
        return cfPagesBranch === 'main' ? 'production' : 'preview';
      }
      break;

    case 'netlify':
      // NETLIFY_CONTEXT: production, deploy-preview, branch-deploy, dev
      // Platform-specific env vars not in schema - use process.env directly
      const netlifyContext = typeof process !== 'undefined' && process.env ? process.env['NETLIFY_CONTEXT'] : undefined;
      if (netlifyContext) {
        const context = netlifyContext.toLowerCase();
        if (context === 'production') return 'production';
        if (context === 'deploy-preview' || context === 'branch-deploy') return 'preview';
        return 'development';
      }
      break;

    case 'railway':
      // Railway uses RAILWAY_ENVIRONMENT
      // Platform-specific env vars not in schema - use process.env directly
      const railwayEnv = typeof process !== 'undefined' && process.env ? process.env['RAILWAY_ENVIRONMENT'] : undefined;
      if (railwayEnv) {
        return railwayEnv === 'production' ? 'production' : 'preview';
      }
      break;

    case 'render':
      // Render uses RENDER_ENV
      // Platform-specific env vars not in schema - use process.env directly
      const renderEnvVar = typeof process !== 'undefined' && process.env ? process.env['RENDER_ENV'] : undefined;
      if (renderEnvVar) {
        const renderEnv = renderEnvVar.toLowerCase();
        if (renderEnv === 'production') return 'production';
        return 'preview';
      }
      break;

    case 'vercel':
      // VERCEL_ENV: production, preview, development
      // Read directly from process.env to avoid circular dependency with schemas/env.ts
      const vercelEnvVar =
        typeof process !== 'undefined' && process.env ? process.env['VERCEL_ENV'] : undefined;
      if (vercelEnvVar) {
        const vercelEnv = vercelEnvVar.toLowerCase();
        if (vercelEnv === 'production') return 'production';
        if (vercelEnv === 'preview') return 'preview';
        return 'development';
      }
      break;
  }

  // Priority 3: NODE_ENV fallback
  // Note: NODE_ENV is 'production' during builds, so we need to detect build phase
  // Read directly from process.env to avoid circular dependency with schemas/env.ts
  const nodeEnv =
    typeof process !== 'undefined' && process.env ? process.env['NODE_ENV'] : undefined;
  const nextPhase =
    typeof process !== 'undefined' && process.env ? process.env['NEXT_PHASE'] : undefined;

  if (nodeEnv === 'production') {
    // Check if this is a build phase (not runtime)
    const isBuildPhase =
      nextPhase === 'phase-production-build' ||
      nextPhase === 'phase-production-server' ||
      (typeof process.argv !== 'undefined' &&
        process.argv.some(
          (arg) => arg.includes('next') && (arg.includes('build') || arg.includes('export'))
        ));

    if (isBuildPhase && platform === 'unknown') {
      return 'build'; // Local build
    }

    // If on a known platform, it's production
    if (platform !== 'unknown') {
      return 'production';
    }

    // Otherwise, assume production (fallback)
    return 'production';
  }

  return 'development';
}

/**
 * Gets the deployment URL in a platform-agnostic way.
 *
 * Priority order:
 * 1. DEPLOYMENT_URL (explicit, platform-agnostic)
 * 2. Platform-specific URL variables
 *
 * @returns The deployment URL, or undefined if not available
 *
 * @example
 * ```ts
 * const url = getDeploymentUrl();
 * if (url) {
 *   console.log(`Deployed at: ${url}`);
 * }
 * ```
 */
export function getDeploymentUrl(): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  // Priority 1: Explicit DEPLOYMENT_URL
  // DEPLOYMENT_URL is not in schema (platform-specific), use process.env directly
  const deploymentUrl = typeof process !== 'undefined' && process.env ? process.env['DEPLOYMENT_URL'] : undefined;
  if (deploymentUrl) {
    return process.env['DEPLOYMENT_URL'];
  }

  // Priority 2: Platform-specific URLs
  const platform = detectPlatform();
  switch (platform) {
    case 'vercel':
      return process.env['VERCEL_URL'];
    case 'netlify':
      return process.env['DEPLOY_PRIME_URL'] || process.env['URL'];
    case 'cloudflare':
      return process.env['CF_PAGES_URL'];
    case 'aws':
      return process.env['AMPLIFY_HOST'];
    case 'railway':
      return process.env['RAILWAY_PUBLIC_DOMAIN'];
    case 'render':
      return process.env['RENDER_EXTERNAL_URL'];
    default:
      return undefined;
  }
}

/**
 * Gets the deployment branch name in a platform-agnostic way.
 *
 * @returns The branch name, or undefined if not available
 */
export function getDeploymentBranch(): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  // Priority 1: Explicit DEPLOYMENT_BRANCH
  if (process.env['DEPLOYMENT_BRANCH']) {
    return process.env['DEPLOYMENT_BRANCH'];
  }

  // Priority 2: Platform-specific branch variables
  const platform = detectPlatform();
  switch (platform) {
    case 'vercel':
      return process.env['VERCEL_GIT_COMMIT_REF'];
    case 'netlify':
      return process.env['HEAD'] || process.env['BRANCH'];
    case 'cloudflare':
      return process.env['CF_PAGES_BRANCH'];
    case 'aws':
      return process.env['AWS_BRANCH'];
    case 'railway':
      return process.env['RAILWAY_GIT_BRANCH'];
    case 'render':
      return process.env['RENDER_GIT_BRANCH'];
    default:
      return undefined;
  }
}

/**
 * Gets the deployment commit SHA in a platform-agnostic way.
 *
 * @returns The commit SHA, or undefined if not available
 */
export function getDeploymentCommit(): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  // Priority 1: Explicit DEPLOYMENT_COMMIT
  if (process.env['DEPLOYMENT_COMMIT']) {
    return process.env['DEPLOYMENT_COMMIT'];
  }

  // Priority 2: Platform-specific commit variables
  const platform = detectPlatform();
  switch (platform) {
    case 'vercel':
      return process.env['VERCEL_GIT_COMMIT_SHA'];
    case 'netlify':
      return process.env['COMMIT_REF'];
    case 'cloudflare':
      return process.env['CF_PAGES_COMMIT_SHA'];
    case 'aws':
      return process.env['AWS_COMMIT_ID'];
    case 'railway':
      return process.env['RAILWAY_GIT_COMMIT_SHA'];
    case 'render':
      return process.env['RENDER_GIT_COMMIT'];
    default:
      return undefined;
  }
}

/**
 * Gets the pull request ID in a platform-agnostic way.
 *
 * This is primarily used for preview deployments to create isolated branch environments.
 *
 * @returns The pull request ID, or undefined if not available
 */
export function getDeploymentPullRequestId(): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  // Priority 1: Explicit DEPLOYMENT_PULL_REQUEST_ID
  if (process.env['DEPLOYMENT_PULL_REQUEST_ID']) {
    return process.env['DEPLOYMENT_PULL_REQUEST_ID'];
  }

  // Priority 2: Platform-specific PR ID variables
  const platform = detectPlatform();
  switch (platform) {
    case 'vercel':
      return process.env['VERCEL_GIT_PULL_REQUEST_ID'];
    case 'netlify':
      // Netlify doesn't have a direct PR ID, but we can use DEPLOY_PRIME_URL or REVIEW_ID
      // REVIEW_ID is available in deploy previews
      return process.env['REVIEW_ID'];
    case 'cloudflare':
      // Cloudflare Pages doesn't expose PR ID directly
      return undefined;
    case 'aws':
      // AWS Amplify doesn't expose PR ID directly
      return undefined;
    case 'railway':
      // Railway doesn't expose PR ID directly
      return undefined;
    case 'render':
      // Render doesn't expose PR ID directly
      return undefined;
    default:
      return undefined;
  }
}
