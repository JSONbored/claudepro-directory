/**
 * Auth Callback Route - OAuth redirect handler via Supabase Auth.
 */

import { type NextRequest, NextResponse } from 'next/server';
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
      await supabase.rpc('refresh_profile_from_oauth', { user_id: data.user.id });

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost
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
