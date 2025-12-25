/**
 * Infisical Client for Node.js/Next.js
 *
 * Provides a singleton Infisical SDK client for fetching secrets at runtime and build time.
 * Uses Universal Auth (client ID + secret) from environment variables.
 *
 * Secrets are fetched with environment-specific values (dev, staging, prod)
 * from a single secret name in Infisical.
 *
 * **Feature-flagged:** Only initializes if `infisical.enabled` feature flag is true.
 * This allows others to use the codebase without Infisical if they prefer.
 *
 * **Usage:**
 * ```ts
 * import { getInfisicalSecret, getInfisicalEnvironment } from '@heyclaude/shared-runtime/infisical/client';
 *
 * // Get environment (dev, staging, prod)
 * const env = getInfisicalEnvironment();
 *
 * // Get a secret
 * const secret = await getInfisicalSecret('DATABASE_URL', env);
 * ```
 *
 * **Testing:**
 * ```ts
 * import { resetInfisicalState } from '@heyclaude/shared-runtime/infisical/client';
 *
 * beforeEach(() => {
 *   resetInfisicalState(); // Clear cached state for fresh test runs
 * });
 * ```
 *
 * **Server-only:** This module uses server-only APIs and must not be imported in client components.
 */

import 'server-only';

import { InfisicalSDK, type Secret } from '@infisical/sdk';
import { env } from '../schemas/env';

/**
 * Infisical configuration
 *
 * Project ID comes from .infisical.json workspaceId.
 * This is the Infisical project/workspace where secrets are stored.
 */
const INFISICAL_PROJECT_ID = '413cd9a2-c1d8-43d6-b7d3-f12699647b27'; // From .infisical.json workspaceId
const INFISICAL_SITE_URL = 'https://app.infisical.com'; // Default Infisical Cloud URL

/**
 * Cache for Infisical client instance (singleton across requests)
 * Note: In Node.js, we can cache across requests (unlike Workers)
 */
let infisicalClient: InfisicalSDK | null = null;
let authPromise: Promise<void> | null = null;
let isEnabled: boolean | null = null;

/**
 * Reset Infisical module state (for testing only)
 *
 * Clears cached values to allow tests to change environment variables
 * and get fresh results from isInfisicalEnabled() and getInfisicalClient().
 *
 * @internal This function is exported for testing purposes only
 */
export function resetInfisicalState(): void {
  infisicalClient = null;
  authPromise = null;
  isEnabled = null;
}

/**
 * Check if Infisical is enabled via feature flag (environment-aware)
 *
 * Infisical is enabled ONLY for dev environment by default.
 * For staging/prod, it's disabled (secrets come from Vercel env vars).
 *
 * Priority:
 * 1. INFISICAL_ENABLED environment variable (explicit override - highest priority)
 * 2. Environment-based check (dev = enabled, staging/prod = disabled)
 * 3. FEATURE_FLAGS['infisical.enabled'] from unified-config (if available)
 * 4. Presence of credentials in dev environment (fallback)
 *
 * @returns true if Infisical is enabled for current environment, false otherwise
 */
export function isInfisicalEnabled(): boolean {
  // Cache the check result (feature flags are static)
  if (isEnabled !== null) {
    return isEnabled;
  }

  // Priority 1: Check environment variable first (explicit override - highest priority)
  // This allows manual override regardless of environment
  if (env.INFISICAL_ENABLED !== undefined) {
    isEnabled = env.INFISICAL_ENABLED === 'true' || env.INFISICAL_ENABLED === '1';
    return isEnabled;
  }

  // Priority 2: Environment-based check (dev = enabled, staging/prod = disabled)
  // For production and staging, secrets come from Vercel env vars, not Infisical SDK
  const currentEnv = getInfisicalEnvironment();
  if (currentEnv === 'prod' || currentEnv === 'staging') {
    // Disabled for production and staging (secrets come from Vercel env vars)
    isEnabled = false;
    return isEnabled;
  }

  // For dev environment, continue to check credentials
  // Note: We skip unified-config check here to avoid circular dependencies
  // The feature flag is checked in web-runtime code that uses Infisical

  // Priority 3: Fallback - check if credentials exist (env vars)
  // This allows Infisical to work in dev even if feature flag system isn't loaded
  // If credentials are present in dev, assume Infisical should be enabled
  const hasEnvCredentials =
    Boolean(env.INFISICAL_CLIENT_ID) && Boolean(env.INFISICAL_CLIENT_SECRET);

  // Only enable if we're in dev and have credentials
  isEnabled = currentEnv === 'dev' && hasEnvCredentials;
  return isEnabled;
}

/**
 * Get or create Infisical SDK client instance
 *
 * Authenticates using Universal Auth credentials from environment variables.
 * Client is cached as a singleton to avoid re-authentication.
 *
 * **Feature-flagged:** Returns null if Infisical is disabled.
 *
 * @returns Authenticated Infisical SDK client, or null if disabled
 * @throws Error if authentication fails
 */
export async function getInfisicalClient(): Promise<InfisicalSDK | null> {
  // Check feature flag first
  if (!isInfisicalEnabled()) {
    return null;
  }

  // Return cached client if already authenticated
  if (infisicalClient && authPromise === null) {
    return infisicalClient;
  }

  // If authentication is in progress, wait for it
  if (authPromise) {
    await authPromise;
    if (infisicalClient) {
      return infisicalClient;
    }
  }

  // Get credentials from environment variables
  const clientId = env.INFISICAL_CLIENT_ID;
  const clientSecret = env.INFISICAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Infisical credentials not found. Set INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET:\n' +
        '\n' +
        '**Local Development:**\n' +
        '  - Set environment variables: INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET\n' +
        '  - Or use Infisical CLI: infisical run --env=dev -- <command>\n' +
        '\n' +
        '**Production (Vercel):**\n' +
        '  - Set INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET in Vercel environment variables\n'
    );
  }

  // Create new client and authenticate
  const client = new InfisicalSDK({
    siteUrl: INFISICAL_SITE_URL,
  });

  // Start authentication (cache the promise)
  authPromise = (async () => {
    try {
      // Authenticate with Universal Auth
      // Note: clientId and clientSecret should be the Universal Auth credentials
      // These are different from regular API keys - they're specifically for Universal Auth
      await client.auth().universalAuth.login({
        clientId: clientId!,
        clientSecret: clientSecret!,
      });

      // Cache the authenticated client
      infisicalClient = client;
      authPromise = null; // Mark authentication as complete
    } catch (error) {
      authPromise = null; // Reset on error
      // Provide more helpful error message for authentication failures
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error(
          `Infisical authentication failed: Invalid credentials. ` +
            `Please verify that INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET are correct Universal Auth credentials. ` +
            `These are different from regular API keys - they must be Universal Auth client ID and secret created in Infisical dashboard.`
        );
      }
      throw error;
    }
  })();

  await authPromise;
  return infisicalClient!;
}

/**
 * Get secret value from Infisical by name (recursive search)
 *
 * Fetches the secret for the specified environment (dev, staging, prod).
 * Infisical supports different values per environment for the same secret name.
 *
 * Uses recursive search to find secrets in subdirectories, matching the CLI behavior
 * when using the `--recursive` flag.
 *
 * **Feature-flagged:** Returns undefined if Infisical is disabled.
 *
 * @param secretName - Name of the secret in Infisical (e.g., 'POSTGRES_PRISMA_URL')
 * @param environment - Environment slug ('dev', 'staging', 'prod')
 * @param secretPath - Optional path to start search from (defaults to '/')
 * @returns Secret value, undefined if not found, or undefined if Infisical is disabled
 * @throws Error if Infisical authentication fails or API error occurs
 */
export async function getInfisicalSecret(
  secretName: string,
  environment: 'dev' | 'staging' | 'prod',
  secretPath: string = '/'
): Promise<string | undefined> {
  // Check feature flag first
  if (!isInfisicalEnabled()) {
    return undefined;
  }

  try {
    const client = await getInfisicalClient();
    if (!client) {
      return undefined;
    }

    // Use listSecrets with recursive: true to search subdirectories
    // This matches the CLI behavior when using --recursive flag
    const secrets = await client.secrets().listSecrets({
      environment,
      projectId: INFISICAL_PROJECT_ID,
      secretPath,
      recursive: true, // Search recursively in subdirectories
      viewSecretValue: true,
      expandSecretReferences: true,
      includeImports: false,
    });

    // Find the secret by name (case-sensitive match)
    // Secret object has secretKey property (name of the secret)
    const secret = secrets.secrets?.find((s: Secret) => s.secretKey === secretName);

    if (!secret) {
      return undefined;
    }

    // Return the secret value
    // The Secret type from Infisical SDK has secretValue property
    return secret.secretValue || undefined;
  } catch (error) {
    // If secret doesn't exist (404 or similar), return undefined (don't throw)
    // This allows optional secrets to be gracefully handled
    if (
      error instanceof Error &&
      (error.message.includes('not found') ||
        error.message.includes('404') ||
        error.message.includes('does not exist'))
    ) {
      return undefined;
    }
    // Re-throw authentication errors, API errors, etc.
    throw error;
  }
}

/**
 * Determine environment from NODE_ENV or explicit config
 *
 * Node.js/Next.js can determine their environment from:
 * - Explicit INFISICAL_ENV variable (highest priority - allows override)
 * - NODE_ENV variable (development → 'dev', production → 'prod')
 * - Default to 'dev' for safety
 *
 * @returns Environment slug ('dev', 'staging', or 'prod')
 */
export function getInfisicalEnvironment(): 'dev' | 'staging' | 'prod' {
  // Priority 1: Check for explicit INFISICAL_ENV variable (allows override)
  const infisicalEnv = env.INFISICAL_ENV;
  if (infisicalEnv === 'dev' || infisicalEnv === 'staging' || infisicalEnv === 'prod') {
    return infisicalEnv;
  }

  // Priority 2: Check NODE_ENV (fallback if INFISICAL_ENV not set)
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv === 'development') {
    return 'dev';
  }
  if (nodeEnv === 'production') {
    return 'prod';
  }

  // Default to 'dev' for safety (less risky than defaulting to 'prod')
  return 'dev';
}
