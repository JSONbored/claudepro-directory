/**
 * Auth Callback Route - OAuth redirect handler via Supabase Auth.
 */

import { refreshProfileFromOAuthServer, validateNextParameter  } from '@heyclaude/web-runtime';
import { subscribeViaOAuthAction } from '@heyclaude/web-runtime/actions';
import { SECURITY_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
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
  const operation = 'AuthCallback';
  const route = '/auth/callback';
  const module = 'apps/web/src/app/(auth)/auth/callback/route';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

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
      const { user } = data.session;
      let shouldSetNewsletterCookie = false;

      // Create new child logger with user context
      // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
      const userLogger = reqLogger.child({
        userId: user.id, // Redaction will automatically hash this
      });

      try {
        await refreshProfileFromOAuthServer(user.id);
        userLogger.info('Auth callback refreshed profile from OAuth', {
          isLinkingFlow,
        });
      } catch (refreshError) {
        const normalized = normalizeError(refreshError, 'Failed to refresh profile from OAuth');
        userLogger.warn('Auth callback failed to refresh profile', {
          err: normalized,
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
              const normalized = normalizeError(
                newsletterResult.serverError,
                'Newsletter opt-in via auth callback failed'
              );
              userLogger.warn('Newsletter opt-in via auth callback failed', {
                err: normalized,
              });
            } else if (newsletterResult.data?.success) {
              shouldSetNewsletterCookie = true;
            } else {
              const normalized = normalizeError(
                new Error('Unknown error'),
                'Newsletter opt-in via auth callback failed'
              );
              userLogger.warn('Newsletter opt-in via auth callback failed', {
                err: normalized,
              });
            }
          } catch (subscribeError) {
            const normalizedSubscribeError = normalizeError(
              subscribeError,
              'Newsletter opt-in via auth callback threw'
            );
            userLogger.error('Newsletter opt-in via auth callback threw', normalizedSubscribeError);
          }
        } else {
          userLogger.warn('Newsletter opt-in skipped - user email missing');
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
            userLogger.warn('Skipping invalid origin URL in SECURITY_CONFIG', {
              err: normalized,
              url,
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

    const normalized = normalizeError(
      error,
      error instanceof Error ? error.message : 'Auth callback exchange failed'
    );
    reqLogger.error('Auth callback exchange failed', normalized, {
      hasCode: true,
      ...(error && typeof error === 'object' && 'code' in error && { errorCode: String(error.code) }),
    });
  } else {
    const normalized = normalizeError(
      new Error('No authorization code provided'),
      'Auth callback missing code'
    );
    reqLogger.error('Auth callback no code provided', normalized, {
      hasCode: false,
      origin,
    });
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
