import type { User } from 'jsr:@supabase/supabase-js@2';

import { supabaseServiceRole } from '../clients/supabase.ts';
import { unauthorizedResponse } from './http.ts';

const BEARER_PREFIX = 'Bearer ';
type AuthResult =
  | {
      user: User;
      token: string;
    }
  | {
      response: Response;
    };

async function getUserFromToken(token: string) {
  const { data, error } = await supabaseServiceRole.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return { user: data.user, token };
}

export async function getAuthUserFromHeader(
  authHeader: string | null | undefined
): Promise<{ user: User; token: string } | null> {
  if (!authHeader?.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authHeader.replace(BEARER_PREFIX, '').trim();
  if (!token) {
    return null;
  }

  return getUserFromToken(token);
}

type CorsHeaders = Record<
  'Access-Control-Allow-Origin' | 'Access-Control-Allow-Methods' | 'Access-Control-Allow-Headers',
  string
>;

export async function requireAuthUser(
  request: Request,
  options: { cors?: CorsHeaders; errorMessage?: string } = {}
): Promise<AuthResult> {
  const { cors, errorMessage } = options;
  const authHeader = request.headers.get('Authorization');

  const authResult = await getAuthUserFromHeader(authHeader);
  if (!authResult) {
    // Convert CorsHeaders to Record<string, string> for unauthorizedResponse
    const corsHeaders = cors
      ? {
          'Access-Control-Allow-Origin': cors['Access-Control-Allow-Origin'],
          'Access-Control-Allow-Methods': cors['Access-Control-Allow-Methods'],
          'Access-Control-Allow-Headers': cors['Access-Control-Allow-Headers'],
        }
      : undefined;
    return {
      response: unauthorizedResponse(
        errorMessage ?? 'Missing or invalid Authorization header',
        corsHeaders
      ),
    };
  }

  return authResult;
}
