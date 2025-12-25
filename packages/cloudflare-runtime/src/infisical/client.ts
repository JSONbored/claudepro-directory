/**
 * Infisical Client for Cloudflare Workers
 *
 * Provides a singleton Infisical SDK client for fetching secrets at runtime.
 * Uses Universal Auth (client ID + secret) stored in Cloudflare Secrets Store.
 *
 * Secrets are fetched with environment-specific values (dev, staging, prod)
 * from a single secret name in Infisical.
 */

import { InfisicalSDK } from '@infisical/sdk';
import type { ExtendedEnv } from '../config/env.js';
import { getSecret } from '../config/env.js';

/**
 * Note: This module uses dynamic imports in parseEnv to avoid circular dependencies.
 * The Infisical client is initialized on first use and cached per request.
 */

/**
 * Infisical configuration
 *
 * Project ID comes from .infisical.json workspaceId.
 * This is the Infisical project/workspace where secrets are stored.
 */
const INFISICAL_PROJECT_ID = '413cd9a2-c1d8-43d6-b7d3-f12699647b27'; // From .infisical.json workspaceId
const INFISICAL_SITE_URL = 'https://app.infisical.com'; // Default Infisical Cloud URL

/**
 * Cache for Infisical client instance (per request)
 * Note: We don't cache across requests in Workers, but we can cache within a request
 */
let infisicalClient: InfisicalSDK | null = null;
let authPromise: Promise<void> | null = null;

/**
 * Get or create Infisical SDK client instance
 *
 * Authenticates using Universal Auth credentials from Secrets Store.
 * Client is cached per request to avoid re-authentication.
 *
 * @param env - Cloudflare Workers env object with Secrets Store bindings
 * @returns Authenticated Infisical SDK client
 */
export async function getInfisicalClient(env: ExtendedEnv): Promise<InfisicalSDK> {
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

  // Create new client and authenticate
  const client = new InfisicalSDK({
    siteUrl: INFISICAL_SITE_URL,
  });

  // Start authentication (cache the promise)
  authPromise = (async () => {
    try {
      // Get Infisical auth credentials from Secrets Store
      const [clientId, clientSecret] = await Promise.all([
        getSecret(env.INFISICAL_CLIENT_ID_SECRET, 'INFISICAL_CLIENT_ID'),
        getSecret(env.INFISICAL_CLIENT_SECRET_SECRET, 'INFISICAL_CLIENT_SECRET'),
      ]);

      // Authenticate with Universal Auth
      await client.auth().universalAuth.login({
        clientId,
        clientSecret,
      });

      // Cache the authenticated client
      infisicalClient = client;
      authPromise = null; // Mark authentication as complete
    } catch (error) {
      authPromise = null; // Reset on error
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
 * @param env - Cloudflare Workers env object
 * @param secretName - Name of the secret in Infisical (e.g., 'NEXT_PUBLIC_SUPABASE_URL')
 * @param environment - Environment slug ('dev', 'staging', 'prod')
 * @param secretPath - Optional path to start search from (defaults to '/')
 * @returns Secret value or undefined if not found
 * @throws Error if Infisical authentication fails or API error occurs
 */
export async function getInfisicalSecret(
  env: ExtendedEnv,
  secretName: string,
  environment: 'dev' | 'staging' | 'prod',
  secretPath: string = '/'
): Promise<string | undefined> {
  try {
    const client = await getInfisicalClient(env);

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
    const secret = secrets.secrets?.find((s) => s.secretKey === secretName);

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
 * Determine environment from worker name or config
 *
 * Cloudflare Workers can determine their environment from:
 * - Worker name (heyclaude-mcp-dev vs heyclaude-mcp-production)
 * - NODE_ENV variable
 * - Explicit environment config
 *
 * @param env - Cloudflare Workers env object
 * @returns Environment slug ('dev', 'staging', or 'prod')
 */
export function getInfisicalEnvironment(env: ExtendedEnv): 'dev' | 'staging' | 'prod' {
  // Import getEnvVar helper (avoid circular dependency)
  // We'll use a simple property access since ExtendedEnv extends Env
  const getEnvVar = (key: string): string | undefined => {
    return (env as Record<string, unknown>)[key] as string | undefined;
  };

  // Check NODE_ENV first
  const nodeEnv = getEnvVar('NODE_ENV');
  if (nodeEnv === 'development') {
    return 'dev';
  }
  if (nodeEnv === 'production') {
    return 'prod';
  }

  // Check for explicit INFISICAL_ENV variable
  const infisicalEnv = getEnvVar('INFISICAL_ENV');
  if (infisicalEnv === 'dev' || infisicalEnv === 'staging' || infisicalEnv === 'prod') {
    return infisicalEnv;
  }

  // Default to 'dev' for safety (less risky than defaulting to 'prod')
  return 'dev';
}
