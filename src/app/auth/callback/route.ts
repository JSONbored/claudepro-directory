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
