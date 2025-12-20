/**
 * Supabase Authentication Utilities for Cloudflare Workers
 *
 * Provides authentication utilities for validating Supabase JWT tokens
 * in Cloudflare Workers environment.
 */

import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { ExtendedEnv } from '../config/env.js';
import { parseEnv } from '../config/env.js';

const BEARER_PREFIX = 'Bearer ';

/**
 * Create Supabase service role client for JWT validation
 *
 * IMPORTANT: This function is async because it retrieves secrets from Secrets Store.
 *
 * @param env - Cloudflare Workers env object
 * @returns Supabase client with service role key
 */
export async function createSupabaseServiceRoleClient(env: ExtendedEnv) {
  const config = await parseEnv(env);
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get user from JWT token
 *
 * @param supabaseClient - Supabase service role client
 * @param token - JWT token string
 * @returns User and token if valid, null otherwise
 */
async function getUserFromToken(
  supabaseClient: Awaited<ReturnType<typeof createSupabaseServiceRoleClient>>,
  token: string
): Promise<{ user: User; token: string } | null> {
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return { user: data.user, token };
}

/**
 * Extract and validate user from Authorization header
 *
 * @param supabaseClient - Supabase service role client
 * @param authHeader - Authorization header value
 * @returns User and token if valid, null otherwise
 */
export async function getAuthUserFromHeader(
  supabaseClient: Awaited<ReturnType<typeof createSupabaseServiceRoleClient>>,
  authHeader: string | null | undefined
): Promise<{ user: User; token: string } | null> {
  if (!authHeader?.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authHeader.replace(BEARER_PREFIX, '').trim();
  if (!token) {
    return null;
  }

  return getUserFromToken(supabaseClient, token);
}

/**
 * CORS headers type
 */
type CorsHeaders = Record<
  'Access-Control-Allow-Origin' | 'Access-Control-Allow-Methods' | 'Access-Control-Allow-Headers',
  string
>;

/**
 * Authentication result type
 */
type AuthResult =
  | {
      user: User;
      token: string;
    }
  | {
      response: Response;
    };

/**
 * Require authenticated user from request
 *
 * Validates Authorization header and returns user or error response.
 *
 * @param supabaseClient - Supabase service role client
 * @param request - Request object
 * @param options - Options for error handling
 * @returns User and token, or error response
 */
export async function requireAuthUser(
  supabaseClient: Awaited<ReturnType<typeof createSupabaseServiceRoleClient>>,
  request: Request,
  options: { cors?: CorsHeaders; errorMessage?: string } = {}
): Promise<AuthResult> {
  const { cors, errorMessage } = options;
  const authHeader = request.headers.get('Authorization');

  const authResult = await getAuthUserFromHeader(supabaseClient, authHeader);
  if (!authResult) {
    // Build error response with CORS headers if provided
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(cors
        ? {
            'Access-Control-Allow-Origin': cors['Access-Control-Allow-Origin'],
            'Access-Control-Allow-Methods': cors['Access-Control-Allow-Methods'],
            'Access-Control-Allow-Headers': cors['Access-Control-Allow-Headers'],
          }
        : {}),
      // MCP spec requires WWW-Authenticate header for 401 responses
      'WWW-Authenticate': 'Bearer',
    };

    return {
      response: new Response(
        JSON.stringify({
          error: errorMessage ?? 'Missing or invalid Authorization header',
        }),
        {
          status: 401,
          headers,
        }
      ),
    };
  }

  return authResult;
}
