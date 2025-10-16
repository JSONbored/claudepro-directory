/**
 * Auth Callback Route
 * Handles OAuth redirects from GitHub, Google, etc.
 *
 * Flow:
 * 1. User clicks "Sign in with GitHub"
 * 2. Redirected to GitHub for authorization
 * 3. GitHub redirects back to this route with code
 * 4. Exchange code for session
 * 5. Redirect to homepage or intended destination
 *
 * CRITICAL: Route Handlers in Next.js 15+ require explicit cookie handling
 * Cookies set via cookies().set() in createClient() are automatically attached
 * to the response, but we need to ensure the exchange completes before redirect.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // DEBUG: Log initial request
  logger.info('Auth callback request received', {
    origin,
    hasCode: !!code,
    codeLength: code?.length ?? 0,
    forwardedHost: request.headers.get('x-forwarded-host') ?? 'none',
    referer: request.headers.get('referer') ?? 'none',
    userAgent: request.headers.get('user-agent')?.substring(0, 50) ?? 'none',
    cookieCount: request.cookies.getAll().length,
  });

  // Get and validate the redirect URL (prevent open redirect attacks)
  const nextParam = searchParams.get('next') ?? '/';

  // Validate redirect URL:
  // 1. Must start with / (relative path)
  // 2. Must NOT start with // (protocol-relative URL that could redirect to external domain)
  // 3. Must NOT contain @ (could be used for credential phishing)
  // 4. Must NOT start with /\ (Windows-style path that could bypass validation)
  const isValidRedirect =
    nextParam.startsWith('/') &&
    !nextParam.startsWith('//') &&
    !nextParam.startsWith('/\\') &&
    !nextParam.includes('@');

  // Use validated redirect or fallback to homepage
  const next = isValidRedirect ? nextParam : '/';

  logger.info('Auth callback redirect validation', {
    nextParam,
    isValidRedirect,
    finalNext: next,
  });

  if (code) {
    logger.info('Auth callback creating Supabase client');

    // Create Supabase client - this sets up cookie handlers
    const supabase = await createClient();

    logger.info('Auth callback exchanging code for session');

    // Exchange code for session - this will set auth cookies via the cookie handlers
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    logger.info('Auth callback exchange result', {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      hasAccessToken: !!data?.session?.access_token,
      hasRefreshToken: !!data?.session?.refresh_token,
      errorMessage: error?.message ?? 'none',
      errorStatus: error?.status ?? 0,
    });

    if (!error && data.session) {
      // Successful auth - build redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      let redirectUrl: string;
      if (isLocalEnv) {
        // Local development - use localhost
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        // Production - use forwarded host
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        // Fallback - use origin
        redirectUrl = `${origin}${next}`;
      }

      logger.info('Auth callback building redirect', {
        forwardedHost: forwardedHost ?? 'none',
        isLocalEnv,
        redirectUrl,
        userId: data.user?.id ?? 'none',
        userEmail: data.user?.email ?? 'none',
      });

      // Create redirect response
      // Next.js 15+ automatically attaches cookies set via cookies().set() to the response
      const response = NextResponse.redirect(redirectUrl);

      // Explicitly set a cache control header to prevent caching of auth redirects
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      logger.info('Auth callback redirect response created', {
        status: response.status,
        hasSetCookieHeader: response.headers.has('set-cookie'),
        cacheControl: response.headers.get('cache-control') ?? 'none',
      });

      return response;
    }
    logger.error('Auth callback exchange failed', error?.message ?? 'Unknown error', {
      errorStatus: error?.status?.toString() ?? 'unknown',
      errorName: error?.name ?? 'unknown',
    });
  } else {
    logger.error('Auth callback no code provided');
  }

  // Auth failed or no code - redirect to error page
  logger.info('Auth callback redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
