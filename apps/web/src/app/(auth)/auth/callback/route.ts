/**
 * Auth Callback Route - OAuth redirect handler via Supabase Auth.
 */

import { refreshProfileFromOAuthServer, validateNextParameter  } from '@heyclaude/web-runtime';
import { subscribeViaOAuthAction } from '@heyclaude/web-runtime/actions';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { SECURITY_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { createSupabaseServerClient } from '@heyclaude/web-runtime/server';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Dynamic Rendering Required
 *
 * This route uses dynamic rendering for OAuth callback handling.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Generate single requestId for this route request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(requestId, '/auth/callback', 'AuthCallback');

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const newsletterParameter = searchParams.get('newsletter');
  const shouldSubscribeToNewsletter = newsletterParameter === 'true';
  const isLinkingFlow = searchParams.get('link') === 'true';
  const defaultPath = isLinkingFlow ? '/account/connected-accounts' : '/';
  const next = validateNextParameter(searchParams.get('next'), defaultPath);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (data.session) {
      const { user } = data;
      let shouldSetNewsletterCookie = false;

      try {
        await refreshProfileFromOAuthServer(user.id);
        logger.info('Auth callback refreshed profile from OAuth', {
          ...baseLogContext,
          userId: user.id,
          isLinkingFlow,
        });
      } catch (refreshError) {
        const normalized = normalizeError(refreshError, 'Failed to refresh profile from OAuth');
        logger.warn('Auth callback failed to refresh profile', undefined, {
          ...baseLogContext,
          userId: user.id,
          errorMessage: normalized.message,
          isLinkingFlow,
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

            if (newsletterResult.serverError) {
              logger.warn('Newsletter opt-in via auth callback failed', undefined, {
                ...baseLogContext,
                userId: user.id,
                error: newsletterResult.serverError,
              });
            } else if (newsletterResult.data?.success) {
              shouldSetNewsletterCookie = true;
            } else {
              logger.warn('Newsletter opt-in via auth callback failed', undefined, {
                ...baseLogContext,
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
              ...baseLogContext,
              userId: user.id,
            });
          }
        } else {
          logger.warn('Newsletter opt-in skipped - user email missing', undefined, {
            ...baseLogContext,
            userId: user.id,
          });
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnvironment = process.env.NODE_ENV === 'development';

      // Validate forwarded host against allowed origins to prevent open redirect attacks
      const allowedHosts = SECURITY_CONFIG.allowedOrigins
        .map((url) => {
          try {
            return new URL(url).hostname;
          } catch (urlError) {
            const normalized = normalizeError(urlError, 'Invalid origin URL in SECURITY_CONFIG');
            logger.warn('Skipping invalid origin URL in SECURITY_CONFIG', undefined, {
              ...baseLogContext,
              url,
              errorMessage: normalized.message,
            });
            return null;
          }
        })
        .filter(Boolean);
      const isValidHost = forwardedHost ? allowedHosts.includes(forwardedHost) : false;

      const redirectUrl = isLocalEnvironment
        ? `${origin}${next}`
        : (forwardedHost && isValidHost
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`);

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
      ...baseLogContext,
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
      ...baseLogContext,
      hasCode: false,
      origin,
    });
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
