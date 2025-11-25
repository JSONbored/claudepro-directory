/**
 * Auth Callback Route - OAuth redirect handler via Supabase Auth.
 */

import { refreshProfileFromOAuthServer } from '@heyclaude/web-runtime';
import { subscribeViaOAuthAction } from '@heyclaude/web-runtime/actions';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { SECURITY_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { createSupabaseServerClient } from '@heyclaude/web-runtime/server';
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

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const newsletterParam = searchParams.get('newsletter');
  const shouldSubscribeToNewsletter = newsletterParam === 'true';
  const nextParam = searchParams.get('next') ?? '/';
  const isValidRedirect =
    nextParam.startsWith('/') &&
    !nextParam.startsWith('//') &&
    !nextParam.startsWith('/\\') &&
    !nextParam.includes('@');
  const next = isValidRedirect ? nextParam : '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { user } = data;
      let shouldSetNewsletterCookie = false;

      try {
        await refreshProfileFromOAuthServer(user.id);
        logger.info('Auth callback refreshed profile from OAuth', {
          requestId: generateRequestId(),
          operation: 'AuthCallback',
          route: '/auth/callback',
          userId: user.id,
        });
      } catch (refreshError) {
        const normalized = normalizeError(refreshError, 'Failed to refresh profile from OAuth');
        logger.warn('Auth callback failed to refresh profile', undefined, {
          requestId: generateRequestId(),
          operation: 'AuthCallback',
          route: '/auth/callback',
          userId: user.id,
          errorMessage: normalized.message,
        });
      }

      if (shouldSubscribeToNewsletter) {
        if (user.email) {
          try {
            const newsletterResult = await subscribeViaOAuthAction({
              email: user.email,
              metadata: {
                referrer: `${origin}${next}`,
                trigger_source: 'auth_callback',
              },
            });

            if (newsletterResult?.serverError) {
              logger.warn('Newsletter opt-in via auth callback failed', undefined, {
                requestId: generateRequestId(),
                operation: 'AuthCallback',
                route: '/auth/callback',
                userId: user.id,
                error: newsletterResult.serverError,
              });
            } else if (newsletterResult?.data?.success) {
              shouldSetNewsletterCookie = true;
            } else {
              logger.warn('Newsletter opt-in via auth callback failed', undefined, {
                requestId: generateRequestId(),
                operation: 'AuthCallback',
                route: '/auth/callback',
                userId: user.id,
                error: 'Unknown error',
              });
            }
          } catch (subscribeError) {
            const normalizedSubscribeError = normalizeError(
              subscribeError,
              'Newsletter opt-in via auth callback threw'
            );
            logger.error('Newsletter opt-in via auth callback threw', normalizedSubscribeError, {
              requestId: generateRequestId(),
              operation: 'AuthCallback',
              route: '/auth/callback',
              userId: user.id,
            });
          }
        } else {
          logger.warn('Newsletter opt-in skipped - user email missing', undefined, {
            requestId: generateRequestId(),
            operation: 'AuthCallback',
            route: '/auth/callback',
            userId: user.id,
          });
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      // Validate forwarded host against allowed origins to prevent open redirect attacks
      const allowedHosts = SECURITY_CONFIG.allowedOrigins
        .map((url) => {
          try {
            return new URL(url).hostname;
          } catch {
            logger.warn('Skipping invalid origin URL in SECURITY_CONFIG', undefined, {
              requestId: generateRequestId(),
              operation: 'AuthCallback',
              route: '/auth/callback',
              url,
            });
            return null;
          }
        })
        .filter((host): host is string => Boolean(host));
      const isValidHost = forwardedHost ? allowedHosts.includes(forwardedHost) : false;

      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost && isValidHost
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`;

      const response = NextResponse.redirect(redirectUrl);
      if (shouldSetNewsletterCookie) {
        response.cookies.set({
          name: 'newsletter_opt_in',
          value: 'success',
          maxAge: 600, // 10 minutes
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV !== 'development',
          path: '/',
        });
      }
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    const normalized = normalizeError(error, error?.message ?? 'Auth callback exchange failed');
    logger.error('Auth callback exchange failed', normalized, {
      requestId: generateRequestId(),
      operation: 'AuthCallback',
      route: '/auth/callback',
      hasCode: true,
      ...(error?.code && { errorCode: String(error.code) }),
      ...(error?.message && { errorMessage: error.message }),
    });
  } else {
    const normalized = normalizeError(
      new Error('No authorization code provided'),
      'Auth callback missing code'
    );
    logger.error('Auth callback no code provided', normalized, {
      requestId: generateRequestId(),
      operation: 'AuthCallback',
      route: '/auth/callback',
      hasCode: false,
      origin,
    });
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
