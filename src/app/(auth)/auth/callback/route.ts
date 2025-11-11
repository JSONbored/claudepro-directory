/**
 * Auth Callback Route - OAuth redirect handler via Supabase Auth.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
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
      try {
        await supabase.rpc('refresh_profile_from_oauth', { user_id: data.user.id });
        logger.info('Auth callback refreshed profile from OAuth', { userId: data.user.id });
      } catch (refreshError) {
        logger.warn('Auth callback failed to refresh profile', {
          userId: data.user.id,
          error: refreshError instanceof Error ? refreshError.message : 'Unknown error',
        });
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
