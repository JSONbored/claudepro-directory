/**
 * createAccount Tool Handler
 *
 * Provides OAuth URLs and instructions for creating an account.
 * Supports newsletter opt-in during account creation.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';
import { getEnvVar } from '@heyclaude/shared-runtime/env.ts';
import { McpErrorCode, createErrorResponse } from '../lib/errors.ts';
import { sanitizeString, isValidUrl } from '../lib/utils.ts';
import type { CreateAccountInput } from '../lib/types.ts';

const SUPABASE_URL = edgeEnv.supabase.url;
const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const APP_URL = getEnvVar('APP_URL') || 'https://claudepro.directory';
const MCP_SERVER_URL = getEnvVar('MCP_SERVER_URL') ?? 'https://mcp.claudepro.directory';

/**
 * Generates OAuth authorization URL for account creation
 *
 * For social OAuth providers (GitHub, Google, Discord), Supabase uses a provider-specific endpoint.
 * The URL format is: /auth/v1/authorize?provider={provider}&redirect_to={callback}
 *
 * @param provider - OAuth provider ('github', 'google', 'discord')
 * @param newsletterOptIn - Whether to opt in to newsletter
 * @param redirectTo - Optional redirect path after authentication
 * @returns OAuth authorization URL
 */
function generateOAuthUrl(
  provider: 'github' | 'google' | 'discord',
  newsletterOptIn: boolean,
  redirectTo?: string
): string {
  // Build callback URL with newsletter and redirect parameters
  const callbackUrl = new URL(`${APP_URL}/auth/callback`);
  callbackUrl.searchParams.set('newsletter', newsletterOptIn ? 'true' : 'false');
  if (redirectTo) {
    callbackUrl.searchParams.set('next', redirectTo);
  }

  // Build Supabase OAuth authorization URL for social providers
  // Format: /auth/v1/authorize?provider={provider}&redirect_to={callback}
  const authUrl = new URL(`${SUPABASE_AUTH_URL}/authorize`);
  authUrl.searchParams.set('provider', provider);
  authUrl.searchParams.set('redirect_to', callbackUrl.toString());

  return authUrl.toString();
}

/**
 * Creates account creation instructions and OAuth URLs
 *
 * @param supabase - Authenticated Supabase client (not used but kept for consistency)
 * @param input - Tool input with provider, newsletter opt-in, and optional redirect
 * @returns Account creation instructions with OAuth URLs
 * @throws If provider is invalid
 */
export async function handleCreateAccount(
  supabase: SupabaseClient<Database>,
  input: CreateAccountInput
) {
  const { provider = 'github', newsletterOptIn = false, redirectTo } = input;

  // Sanitize inputs
  const sanitizedProvider = sanitizeString(provider);
  const sanitizedRedirectTo = redirectTo ? sanitizeString(redirectTo) : undefined;
  
  // Validate provider
  const validProviders = ['github', 'google', 'discord'];
  if (!validProviders.includes(sanitizedProvider)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_PROVIDER,
      `Invalid provider: ${sanitizedProvider}. Supported providers: ${validProviders.join(', ')}`
    );
    throw new Error(error.message);
  }
  
  // Validate redirectTo if provided
  if (sanitizedRedirectTo && !isValidUrl(sanitizedRedirectTo)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_INPUT,
      `Invalid redirectTo URL: ${sanitizedRedirectTo}`
    );
    throw new Error(error.message);
  }

  // Generate OAuth URL
  const oauthUrl = generateOAuthUrl(sanitizedProvider as 'github' | 'google' | 'discord', newsletterOptIn, sanitizedRedirectTo);

  // Build instructions text
  const instructions: string[] = [];

  instructions.push(`## Create Account with ${sanitizedProvider.charAt(0).toUpperCase() + sanitizedProvider.slice(1)}\n`);

  instructions.push(
    `To create an account on Claude Pro Directory, you can sign up using your ${sanitizedProvider.charAt(0).toUpperCase() + sanitizedProvider.slice(1)} account.\n`
  );

  instructions.push('### Option 1: Use the OAuth URL (Recommended)\n');
  instructions.push(`Click or visit this URL to start the account creation process:\n`);
  instructions.push(`\`${oauthUrl}\`\n`);

  instructions.push('### Option 2: Manual Steps\n');
  instructions.push('1. Visit the Claude Pro Directory website');
  instructions.push(`2. Click "Sign in" or "Get Started"`);
  instructions.push(`3. Select "${sanitizedProvider.charAt(0).toUpperCase() + sanitizedProvider.slice(1)}" as your provider`);
  if (newsletterOptIn) {
    instructions.push('4. You will be automatically subscribed to the newsletter');
  }
  instructions.push('5. Complete the OAuth flow in your browser');
  instructions.push('6. Your account will be created automatically\n');

  if (newsletterOptIn) {
    instructions.push('### Newsletter Subscription\n');
    instructions.push(
      'You will be automatically subscribed to the Claude Pro Directory newsletter when you create your account.\n'
    );
  }

  instructions.push('### What You Get\n');
  instructions.push('- Access to personalized content recommendations');
  instructions.push('- Ability to bookmark and save favorite configurations');
  instructions.push('- Submit your own content to the directory');
  instructions.push('- Track your submissions and engagement');
  if (newsletterOptIn) {
    instructions.push('- Weekly newsletter with new content and updates');
  }

  instructions.push('\n### After Account Creation\n');
  instructions.push('Once your account is created, you can:');
  instructions.push('- Use the MCP server with your authenticated account');
  instructions.push('- Access protected resources and tools');
  instructions.push('- Submit content for review');
  instructions.push('- Manage your profile and preferences');

  const instructionsText = instructions.join('\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: instructionsText,
      },
    ],
    _meta: {
      provider: sanitizedProvider,
      oauthUrl,
      newsletterOptIn,
      redirectTo: sanitizedRedirectTo || null,
      appUrl: APP_URL,
      callbackUrl: `${APP_URL}/auth/callback`,
      instructions: [
        'Visit the OAuth URL to start account creation',
        'Complete authentication with your provider',
        'Account will be created automatically',
        newsletterOptIn ? 'Newsletter subscription will be enabled' : 'Newsletter subscription is optional',
      ],
    },
  };
}
