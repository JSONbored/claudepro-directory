/**
 * OAuth Account Linking Route Handler
 * Initiates OAuth flow to link a provider to an existing authenticated account
 */

import { logger } from '@heyclaude/web-runtime/core';
import { getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import { generateRequestId } from '@heyclaude/web-runtime/utils/request-context';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Dynamic Rendering Required
 *
 * This route must use dynamic rendering because it imports from @heyclaude/web-runtime
 * which transitively imports feature-flags/flags.ts. The Vercel Flags SDK's flags/next
 * module contains module-level code that calls server functions, which cannot be
 * executed during static site generation.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

const VALID_PROVIDERS = ['github', 'google', 'discord'] as const;
type ValidProvider = (typeof VALID_PROVIDERS)[number];

function isValidProvider(provider: string): provider is ValidProvider {
  return VALID_PROVIDERS.includes(provider as ValidProvider);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params;
  const { searchParams, origin } = new URL(request.url);
  const nextParam = searchParams.get('next') ?? '/account/connected-accounts';
  const isValidRedirect =
    nextParam.startsWith('/') &&
    !nextParam.startsWith('//') &&
    !nextParam.startsWith('/\\') &&
    !nextParam.includes('@');
  const next = isValidRedirect ? nextParam : '/account/connected-accounts';

  // Validate provider
  if (!isValidProvider(rawProvider)) {
    logger.warn('OAuth link: invalid provider', undefined, {
      requestId: generateRequestId(),
      operation: 'OAuthLink',
      route: `/auth/link/${rawProvider}`,
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
    logger.warn('OAuth link: user not authenticated', undefined, {
      requestId: generateRequestId(),
      operation: 'OAuthLink',
      route: `/auth/link/${rawProvider}`,
      provider: rawProvider,
    });
    // Redirect to login with return URL
    const loginUrl = new URL(`${origin}/login`);
    loginUrl.searchParams.set('redirect', `/auth/link/${rawProvider}`);
    return NextResponse.redirect(loginUrl.toString());
  }

  // Redirect to client component that will handle linkIdentity()
  // The client component will initiate the OAuth flow
  const linkUrl = new URL(`${origin}/auth/link/${rawProvider}/callback`);
  linkUrl.searchParams.set('next', next);
  return NextResponse.redirect(linkUrl.toString());
}
