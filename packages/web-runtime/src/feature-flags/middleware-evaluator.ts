import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { getEnvVar } from '@heyclaude/shared-runtime';
import { logger } from '../logger.ts';

// We use direct fetch to avoid heavy SDKs in middleware
// and to ensure we can control timeouts precisely.
const STATSIG_API_URL = 'https://api.statsig.com/v1/get_client_initialize_response';
const TIMEOUT_MS = 500; // Aggressive timeout for middleware

let missingEnvWarningEmitted = false;

export async function evaluateFlags(request: NextRequest) {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const statsigClientKey = getEnvVar('NEXT_PUBLIC_STATSIG_CLIENT_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !statsigClientKey) {
    if (!missingEnvWarningEmitted) {
      const missing = [
        !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
        !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
        !statsigClientKey ? 'NEXT_PUBLIC_STATSIG_CLIENT_KEY' : null,
      ].filter(Boolean);
      logger.warn('Missing env vars for flag evaluation', { missing });
      missingEnvWarningEmitted = true;
    }
    return null;
  }

  try {
    // 1. Identify User
    let userId = 'anonymous';
    let email: string | undefined;
    let userSlug: string | undefined;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Read-only in middleware for this purpose
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      userId = user.id;
      email = user.email;
      userSlug = user.user_metadata?.['slug'];
    }

    // 2. Construct Statsig User
    const statsigUser = {
      userID: userId,
      email: email,
      customIDs: userSlug ? { userSlug } : undefined,
    };

    // 3. Fetch Flags from Statsig
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(STATSIG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'statsig-api-key': statsigClientKey,
      },
      body: JSON.stringify({
        user: statsigUser,
        hash: 'none', // Return readable names for easier server-side consumption
        // But the Client SDK expects specific format. 
        // We will forward the entire response or a subset?
        // To be safe, let's just use the Client SDK logic on the client?
        // NO, the goal is to have flags available for Server Components via cookie.
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`Statsig API error: ${response.status}`);
    }

    const data = await response.json();
    
    // We serialize the core parts of the response
    // feature_gates, dynamic_configs, layer_configs
    const flagsPayload = {
        feature_gates: data.feature_gates,
        dynamic_configs: data.dynamic_configs,
        layer_configs: data.layer_configs,
        time: Date.now(),
    };

    // Serialize to Base64
    const serialized = btoa(JSON.stringify(flagsPayload));
    return serialized;

  } catch (error) {
    // Fail open/silently in middleware to avoid blocking requests
    if (error instanceof Error && error.name !== 'AbortError') {
       logger.error('Flag evaluation failed', error);
    }
    return null;
  }
}
