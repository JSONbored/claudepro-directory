/**
 * Auth Callback Route - OAuth redirect handler via Supabase Auth.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { subscribeViaOAuthAction } from '@/src/lib/actions/newsletter.actions';
import { refreshProfileFromOAuthServer } from '@/src/lib/actions/user.actions';
import { SECURITY_CONFIG } from '@/src/lib/data/config/constants';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import { normalizeError } from '@/src/lib/utils/error.utils';

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
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { user } = data;
      let shouldSetNewsletterCookie = false;

      try {
        await refreshProfileFromOAuthServer(user.id);
        logger.info('Auth callback refreshed profile from OAuth', { userId: user.id });
      } catch (refreshError) {
        const normalized = normalizeError(refreshError, 'Failed to refresh profile from OAuth');
        logger.warn('Auth callback failed to refresh profile', {
          userId: user.id,
          route: 'auth/callback',
          errorMessage: normalized.message,
        });
      }

      if (shouldSubscribeToNewsletter) {
        if (user.email) {
          const newsletterResult = await subscribeViaOAuthAction({
            email: user.email,
            metadata: {
              referrer: `${origin}${next}`,
              trigger_source: 'auth_callback',
            },
          });

          if (newsletterResult?.serverError) {
            logger.warn('Newsletter opt-in via auth callback failed', {
              userId: user.id,
              error: newsletterResult.serverError,
            });
          } else if (newsletterResult?.data?.success) {
            shouldSetNewsletterCookie = true;
          } else {
            logger.warn('Newsletter opt-in via auth callback failed', {
              userId: user.id,
              error: 'Unknown error',
            });
          }
        } else {
          logger.warn('Newsletter opt-in skipped - user email missing', { userId: user.id });
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      // Validate forwarded host against allowed origins to prevent open redirect attacks
      const allowedHosts = SECURITY_CONFIG.allowedOrigins.map((url) => new URL(url).hostname);
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
      route: 'auth/callback',
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
      route: 'auth/callback',
      hasCode: false,
      origin,
    });
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
