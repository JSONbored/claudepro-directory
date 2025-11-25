/**
 * Supabase Auth Middleware Utility
 * Handles automatic token refresh using getClaims() for SSR
 *
 * IMPORTANT: This follows Supabase's recommended pattern for Next.js middleware.
 * Always use getClaims() instead of getSession() in middleware for security.
 */

import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Database } from '@heyclaude/database-types';
import { getEnvVar } from '@heyclaude/shared-runtime';
import { logger } from '../logger.ts';

/**
 * Update Supabase Auth session in middleware
 * Refreshes tokens using getClaims() and syncs cookies between request/response
 *
 * IMPORTANT: Avoid writing any logic between createServerClient and getClaims().
 * A simple mistake could make it very hard to debug issues with users being randomly logged out.
 *
 * @param request - Next.js request object
 * @returns NextResponse with refreshed auth cookies, or null if no update needed
 */
export async function updateSupabaseSession(
  request: NextRequest
): Promise<NextResponse | null> {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    // Silently fail in middleware - don't block requests
    return null;
  }

  let supabaseResponse: NextResponse | null = null;

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Create or update response with refreshed cookies
          if (!supabaseResponse) {
            supabaseResponse = NextResponse.next({
              request,
            });
          }

          // Set cookies on response
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse!.cookies.set(name, value, options);
          });
        },
      },
    });

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    // IMPORTANT: Don't remove getClaims()
    const { data } = await supabase.auth.getClaims();

    // If we have claims, the token was refreshed and cookies were updated
    // Return the response with updated cookies
    if (data?.claims && supabaseResponse) {
      return supabaseResponse;
    }

    // No claims and no cookie updates - return null (no action needed)
    return null;
  } catch (error) {
    // Fail silently in middleware - don't block requests
    // Log error for debugging but don't throw
    if (error instanceof Error) {
      logger.warn('Supabase session update failed in middleware', {
        error: error.message,
        pathname: request.nextUrl.pathname,
      });
    }
    return null;
  }
}
