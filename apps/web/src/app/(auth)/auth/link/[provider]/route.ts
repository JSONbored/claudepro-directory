/**
 * OAuth Account Linking Route Handler
 * Initiates OAuth flow to link a provider to an existing authenticated account
 */

import { isValidProvider, validateNextParameter } from '@heyclaude/web-runtime';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Dynamic Rendering Required
 *
 * This route uses dynamic rendering for OAuth authentication flows.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

/**
 * Initiates provider linking by redirecting the client to the appropriate next step.
 *
 * Validates the `provider` route parameter, preserves an optional `next` return path, and:
 * - redirects to the connected accounts page with `error=invalid_provider` if the provider is invalid;
 * - redirects unauthenticated users to the login page with a `redirect` back to the link route (including `next`);
 * - redirects authenticated users to the client-side callback route that starts the provider link flow (including `next`).
 *
 * @param request - The incoming NextRequest for this route.
 * @param params - A Promise resolving to an object with the route `{ provider: string }`.
 * @returns A NextResponse performing a redirect to one of:
 *          - `${origin}/account/connected-accounts?error=invalid_provider` when the provider is invalid,
 *          - `${origin}/login?redirect=/auth/link/{provider}[?next=...]` when the user is not authenticated,
 *          - `${origin}/auth/link/{provider}/callback?next=...` when the user is authenticated.
 *
 * @see generateRequestId
 * @see isValidProvider
 * @see validateNextParameter
 * @see getAuthenticatedUser
 * @see NextResponse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  // Generate single requestId for this route request
  const requestId = generateRequestId();

  const { provider: rawProvider } = await params;
  const { searchParams, origin } = new URL(request.url);
  const next = validateNextParameter(searchParams.get('next'), '/account/connected-accounts');

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'OAuthLink',
    route: `/auth/link/${rawProvider}`,
    module: 'app/(auth)/auth/link/[provider]',
  });

  // Validate provider
  if (!isValidProvider(rawProvider)) {
    reqLogger.warn('OAuth link: invalid provider', {
      provider: rawProvider,
    });
    return NextResponse.redirect(`${origin}/account/connected-accounts?error=invalid_provider`);
  }

  // Check if user is authenticated
  const authResult = await getAuthenticatedUser({
    requireUser: false,
    context: 'OAuthLink',
  });

  if (!(authResult.isAuthenticated && authResult.user)) {
    reqLogger.warn('OAuth link: user not authenticated', {
      provider: rawProvider,
    });
    // Redirect to login with return URL, preserving the 'next' parameter
    const loginUrl = new URL(`${origin}/login`);
    const linkUrl = new URL(`${origin}/auth/link/${rawProvider}`);
    linkUrl.searchParams.set('next', next);
    loginUrl.searchParams.set('redirect', linkUrl.pathname + linkUrl.search);
    return NextResponse.redirect(loginUrl.toString());
  }

  // Redirect to client component that will handle linkIdentity()
  // The client component will initiate the OAuth flow
  const linkUrl = new URL(`${origin}/auth/link/${rawProvider}/callback`);
  linkUrl.searchParams.set('next', next);
  return NextResponse.redirect(linkUrl.toString());
}