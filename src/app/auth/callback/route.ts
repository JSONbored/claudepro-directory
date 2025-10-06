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
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Get the redirect URL (where to send user after auth)
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth - redirect to intended destination
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        // Local development - use localhost
        return NextResponse.redirect(`${origin}${next}`);
      }

      if (forwardedHost) {
        // Production - use forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }

      // Fallback - use origin
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed or no code - redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
