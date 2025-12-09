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
 */

import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AuthBrandPanel } from '@/src/components/core/auth/auth-brand-panel';
import { SplitAuthLayout } from '@/src/components/core/auth/auth-layout';
import { AuthMobileHeader } from '@/src/components/core/auth/auth-mobile-header';

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
  await connection();
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
    operation,
    route,
    module: modulePath,
  });

  try {
    const authorizationId = params.authorization_id;

    if (!authorizationId) {
      reqLogger.warn('OAuth consent page accessed without authorization_id');
      return (
        <SplitAuthLayout
          brandPanel={<AuthBrandPanel />}
          mobileHeader={<AuthMobileHeader />}
          authPanel={
            <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
              <h1 className="mb-4 text-2xl font-semibold">Invalid Authorization Request</h1>
              <p className="text-muted-foreground text-center">
                Missing authorization ID. Please try again from the application requesting access.
              </p>
            </div>
          }
        />
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
      reqLogger.info('User not authenticated, redirecting to login', {
        authorizationId,
        redirectTo: loginUrl,
        error: authResult.error?.message,
      });
      redirect(loginUrl);
    }

    const user = authResult.user;
    const supabase = await createSupabaseServerClient();

    // Get authorization details using the authorization_id
    const { data: authDetails, error: authError } =
      await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

    if (authError !== null) {
      reqLogger.error('Failed to get authorization details', normalizeError(authError), {
        authorizationId,
        userId: user.id,
      });

      return (
        <SplitAuthLayout
          brandPanel={<AuthBrandPanel />}
          mobileHeader={<AuthMobileHeader />}
          authPanel={
            <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
              <h1 className="mb-4 text-2xl font-semibold">Authorization Error</h1>
              <p className="text-muted-foreground text-center">
                {authError instanceof Error
                  ? authError.message
                  : 'Invalid authorization request. Please try again.'}
              </p>
            </div>
          }
        />
      );
    }

    if (!authDetails) {
      reqLogger.error(
        'Failed to get authorization details',
        normalizeError(new Error('No auth details')),
        {
          authorizationId,
          userId: user.id,
        }
      );

      return (
        <SplitAuthLayout
          brandPanel={<AuthBrandPanel />}
          mobileHeader={<AuthMobileHeader />}
          authPanel={
            <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
              <h1 className="mb-4 text-2xl font-semibold">Authorization Error</h1>
              <p className="text-muted-foreground text-center">
                Invalid authorization request. Please try again.
              </p>
            </div>
          }
        />
      );
    }

    reqLogger.info('OAuth consent page loaded', {
      authorizationId,
      userId: user.id,
      clientId: authDetails.client.id,
      clientName: authDetails.client.name,
      scopes: authDetails.scope,
    });

    // Map authDetails to expected format for client component
    const clientAuthDetails = {
      client: {
        client_id: authDetails.client.id,
        name: authDetails.client.name,
      },
      redirect_uri: authDetails.redirect_url ?? '',
      scopes: authDetails.scope ? [authDetails.scope] : null,
    };

    return (
      <SplitAuthLayout
        brandPanel={<AuthBrandPanel />}
        mobileHeader={<AuthMobileHeader />}
        authPanel={
          <Suspense
            fallback={
              <div className="flex min-h-[400px] items-center justify-center">Loading...</div>
            }
          >
            <OAuthConsentClient authorizationId={authorizationId} authDetails={clientAuthDetails} />
          </Suspense>
        }
      />
    );
  } catch (error) {
    const normalized = normalizeError(error, 'OAuth consent page error');
    reqLogger.error('OAuth consent page error', normalized, {
      duration: Date.now() - startTime,
    });

    return (
      <SplitAuthLayout
        brandPanel={<AuthBrandPanel />}
        mobileHeader={<AuthMobileHeader />}
        authPanel={
          <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
            <h1 className="mb-4 text-2xl font-semibold">Error</h1>
            <p className="text-muted-foreground text-center">
              An error occurred while processing your authorization request. Please try again.
            </p>
          </div>
        }
      />
    );
  }
}
