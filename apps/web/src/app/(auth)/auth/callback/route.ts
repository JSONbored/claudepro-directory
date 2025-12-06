/**
 * Auth Callback Route - OAuth redirect handler via Supabase Auth.
 */

import { env } from '@heyclaude/shared-runtime/schemas/env';
import { refreshProfileFromOAuthServer, validateNextParameter } from '@heyclaude/web-runtime';
import { subscribeViaOAuthAction } from '@heyclaude/web-runtime/actions';
import { SECURITY_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { createSupabaseServerClient } from '@heyclaude/web-runtime/server';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Dynamic Rendering Required
 *
 * This route uses dynamic rendering for OAuth callback handling.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */

/**
 * Handle the OAuth callback: exchange the authorization code, refresh the user profile, optionally subscribe the user to the newsletter, and redirect the user to the validated next URL.
 *
 * This handler:
 * - Reads `code`, `newsletter`, `link`, and `next` from the request's query string and computes a validated redirect target.
 * - Exchanges the `code` for a Supabase session; on success it refreshes the user's profile.
 * - When newsletter opt-in is requested and the user has an email, attempts subscription and, on success, sets a short-lived `newsletter_opt_in` cookie.
 * - Validates the forwarded host against `SECURITY_CONFIG.allowedOrigins` to prevent open redirects and chooses the final redirect URL based on environment and host validation.
 * - Returns a redirect `NextResponse` and sets cache-control headers to prevent caching.
 *
 * @param request - The incoming NextRequest containing query parameters and headers used to perform the callback flow.
 * @returns A NextResponse that redirects the client to the computed `next` URL (or to `/auth/auth-code-error` on failure). The response may include a `newsletter_opt_in` cookie and cache-control headers.
 *
 * @see createSupabaseServerClient
 * @see refreshProfileFromOAuthServer
 * @see subscribeViaOAuthAction
 * @see validateNextParameter
 * @see SECURITY_CONFIG
 */
export async function GET(request: NextRequest) {
  // Generate single requestId for this route request
  const requestId = generateRequestId();
  const operation = 'AuthCallback';
  const route = '/auth/callback';
  const modulePath = 'apps/web/src/app/(auth)/auth/callback/route';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module: modulePath,
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
      const isLocalEnvironment = env.NODE_ENV === 'development';

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
          secure: env.NODE_ENV !== 'development',
          path: '/',
        });
      }
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    const normalized = normalizeError(error, 'Auth callback exchange failed');
    reqLogger.error('Auth callback exchange failed', normalized, {
      hasCode: true,
      ...(error &&
        typeof error === 'object' &&
        'code' in error && { errorCode: String(error.code) }),
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
