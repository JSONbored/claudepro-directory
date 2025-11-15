/**
 * Auth Callback Route - OAuth redirect handler via Supabase Auth.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { subscribeViaOAuth } from '@/src/lib/actions/newsletter.actions';
import { refreshProfileFromOAuthServer } from '@/src/lib/actions/user.actions';
import { SECURITY_CONFIG } from '@/src/lib/data/config/constants';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

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
    // biome-ignore lint/correctness/noSuspiciousAwait: OAuth callback must instantiate a server Supabase client directly for session exchange.
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { user } = data;
      let shouldSetNewsletterCookie = false;

      try {
        await refreshProfileFromOAuthServer(user.id);
        logger.info('Auth callback refreshed profile from OAuth', { userId: user.id });
      } catch (refreshError) {
        logger.warn('Auth callback failed to refresh profile', {
          userId: user.id,
          error: refreshError instanceof Error ? refreshError.message : 'Unknown error',
        });
      }

      if (shouldSubscribeToNewsletter) {
        if (user.email) {
          const newsletterResult = await subscribeViaOAuth({
            email: user.email,
            metadata: {
              referrer: `${origin}${next}`,
              trigger_source: 'auth_callback',
            },
          });

          if (newsletterResult.success) {
            shouldSetNewsletterCookie = true;
          } else {
            logger.warn('Newsletter opt-in via auth callback failed', {
              userId: user.id,
              error: newsletterResult.error ?? 'unknown_error',
              ...(newsletterResult.traceId ? { traceId: newsletterResult.traceId } : {}),
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

    logger.error('Auth callback exchange failed', error?.message ?? 'Unknown error');
  } else {
    logger.error('Auth callback no code provided');
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
