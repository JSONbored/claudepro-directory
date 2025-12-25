/**
 * OAuth Consent Page
 *
 * Authorization UI for OAuth 2.1 Server flows.
 * Users are redirected here by Supabase Auth when third-party apps (like MCP clients)
 * request access to their account.
 *
 * Flow:
 * 1. MCP client initiates OAuth with resource parameter
 * 2. Supabase Auth validates and redirects here with authorization_id
 * 3. User authenticates (if not already logged in)
 * 4. User sees consent screen with client info and scopes
 * 5. User approves/denies access
 * 6. Redirect back to client with authorization code or error
 *
 * Error Handling:
 * - Failed signin: User redirected to /login with redirect parameter to return here after auth
 * - Cancel/Deny: User clicks Cancel/Deny → denyAuthorization called → redirects to client with error=access_denied
 * - Timeout/Expired: If authorization_id expires, getAuthorizationDetails returns error → shows error message
 * - User closes tab: Authorization expires, client will receive error when trying to exchange code
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { createSupabaseServerClient } from '@heyclaude/web-runtime/supabase/server';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { OAuthLayout } from '@/src/components/core/auth/oauth-layout';

import { OAuthConsentClient } from './oauth-consent-client';

/**
 * Dynamic Rendering Required
 *
 * This page is dynamic because searchParams is async (Next.js 15+) and requires runtime resolution.
 */

/**
 * Provide the page metadata for the OAuth consent route.
 *
 * @returns The Next.js page `Metadata` object for the "/oauth/consent" route.
 */
export async function generateMetadata(): Promise<Metadata> {
  'use cache';
  return await generatePageMetadata('/oauth/consent');
}

/**
 * Render the OAuth consent page.
 *
 * Extracts authorization_id from query params, checks user authentication,
 * retrieves authorization details, and displays consent screen.
 *
 * @param searchParams - Promise resolving to an object containing `authorization_id` string
 * @param searchParams.searchParams
 * @returns The React element for the OAuth consent page
 */
export default async function OAuthConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string }>;
}) {
  // Await searchParams first to establish request context (required before Date.now())
  const params = await searchParams;
  await connection();

  const startTime = Date.now();
  const operation = 'OAuthConsent';
  const route = '/oauth/consent';
  const modulePath = 'apps/web/src/app/oauth/consent/page';

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: modulePath,
    operation,
    route,
  });

  try {
    const authorizationId = params.authorization_id;

    if (!authorizationId) {
      reqLogger.warn(
        { section: 'data-fetch' },
        'OAuth consent page accessed without authorization_id'
      );
      return (
        <OAuthLayout>
          <div className="flex min-h-screen flex-col items-center justify-center p-6">
            <h1 className="mb-4 text-2xl font-semibold text-black">
              Invalid Authorization Request
            </h1>
            <p className="text-center text-gray-600">
              Missing authorization ID. Please try again from the application requesting access.
            </p>
          </div>
        </OAuthLayout>
      );
    }

    // Check if user is authenticated
    const authResult = await getAuthenticatedUser({
      context: 'OAuthConsent',
      requireUser: true,
    });

    if (!authResult.isAuthenticated || !authResult.user) {
      // Redirect to login, preserving authorization_id
      const loginUrl = `/login?redirect=/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
      reqLogger.info(
        {
          authorizationId,
          error: authResult.error?.message,
          redirectTo: loginUrl,
          section: 'data-fetch',
        },
        'User not authenticated, redirecting to login'
      );
      redirect(loginUrl);
    }

    const user = authResult.user;
    const supabase = await createSupabaseServerClient();

    // Get authorization details using the authorization_id
    const { data: authDetails, error: authError } =
      await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

    if (authError !== null) {
      reqLogger.error(
        {
          authorizationId,
          err: normalizeError(authError),
          section: 'data-fetch',
          userId: user.id,
        },
        'Failed to get authorization details'
      );

      // Check if authorization expired or is invalid
      const errorMessage = authError instanceof Error ? authError.message : String(authError);
      const isExpired =
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('not found');

      return (
        <OAuthLayout>
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
            <h1 className="text-2xl font-semibold text-black">Authorization Error</h1>
            <p className="text-center text-gray-600">
              {isExpired
                ? 'This authorization request has expired or is no longer valid. Please try again from the application requesting access.'
                : 'Invalid authorization request. Please try again from the application requesting access.'}
            </p>
          </div>
        </OAuthLayout>
      );
    }

    if (!authDetails) {
      reqLogger.error(
        {
          authorizationId,
          err: normalizeError(new Error('No auth details')),
          section: 'data-fetch',
          userId: user.id,
        },
        'Failed to get authorization details'
      );

      return (
        <OAuthLayout>
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
            <h1 className="text-2xl font-semibold text-black">Authorization Error</h1>
            <p className="text-center text-gray-600">
              This authorization request is no longer valid. Please try again from the application
              requesting access.
            </p>
          </div>
        </OAuthLayout>
      );
    }

    reqLogger.info(
      {
        authorizationId,
        clientId: authDetails.client.id,
        clientName: authDetails.client.name,
        scopes: authDetails.scope,
        section: 'data-fetch',
        userId: user.id,
      },
      'OAuth consent page loaded'
    );

    // Extract user metadata for avatar and display name
    const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const avatarUrl =
      typeof userMetadata['avatar_url'] === 'string'
        ? userMetadata['avatar_url']
        : typeof userMetadata['picture'] === 'string'
          ? userMetadata['picture']
          : null;
    const displayName =
      typeof userMetadata['full_name'] === 'string'
        ? userMetadata['full_name']
        : typeof userMetadata['name'] === 'string'
          ? userMetadata['name']
          : (user.email?.split('@')[0] ?? 'User');

    // Map authDetails to expected format for client component
    // Include all available fields from getAuthorizationDetails response
    const clientAuthDetails = {
      client: {
        client_id: authDetails.client.id,
        description: authDetails.client.description ?? null, // May be available for MCP clients
        name: authDetails.client.name,
      },
      redirect_uri: authDetails.redirect_url ?? '',
      resource: authDetails.resource ?? null, // RFC 8707 resource parameter (MCP server URL)
      scopes: authDetails.scope ? authDetails.scope.split(' ').filter(Boolean) : null, // Split space-separated scopes
    };

    return (
      <OAuthLayout>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center text-black">
              Loading...
            </div>
          }
        >
          <OAuthConsentClient
            authDetails={clientAuthDetails}
            authorizationId={authorizationId}
            user={{
              email: user.email ?? '',
              name: displayName,
              avatarUrl,
            }}
          />
        </Suspense>
      </OAuthLayout>
    );
  } catch (error) {
    const normalized = normalizeError(error, 'OAuth consent page error');
    reqLogger.error(
      {
        duration: Date.now() - startTime,
        err: normalized,
        section: 'data-fetch',
      },
      'OAuth consent page error'
    );

    return (
      <OAuthLayout>
        <div className="flex min-h-screen flex-col items-center justify-center p-6">
          <h1 className="mb-4 text-2xl font-semibold text-black">Error</h1>
          <p className="text-center text-gray-600">
            An error occurred while processing your authorization request. Please try again.
          </p>
        </div>
      </OAuthLayout>
    );
  }
}
