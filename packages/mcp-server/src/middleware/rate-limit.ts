/**
 * Rate Limiting Middleware for Cloudflare Workers
 *
 * Uses Cloudflare Rate Limiting binding to check limits and add headers.
 * Rate limiting is configured in wrangler.jsonc per environment.
 *
 * Based on Cloudflare Workers Rate Limiting binding API:
 * https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 */

// Cloudflare runtime types (type-only import)
// Added as devDependency for type-checking in standalone package
import type { ExtendedEnv } from '@heyclaude/cloudflare-runtime/config/env';

/**
 * Rate limit result from Cloudflare Rate Limiting binding
 * 
 * The binding returns: { success: boolean, limit: number, remaining: number, reset: number }
 * - success: true if request allowed, false if rate limited
 * - limit: Maximum number of requests allowed
 * - remaining: Number of requests remaining in current window
 * - reset: Unix timestamp (seconds) when the rate limit window resets
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

/**
 * Rate limit configuration from wrangler.jsonc
 */
export interface RateLimitConfig {
  limit: number; // Max requests
  period: number; // Period in seconds
}

/**
 * Cloudflare Rate Limiting binding type
 * 
 * Based on Cloudflare docs: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 * 
 * The binding has a `limit()` method that takes:
 * - options: { key: string } - Object with key property (unique identifier)
 * 
 * Returns Promise<{ success: boolean, limit: number, remaining: number, reset: number }>
 */
type RateLimitBinding = {
  limit(options: { key: string }): Promise<RateLimitResult>;
};

/**
 * Check rate limit using Cloudflare Rate Limiting binding
 *
 * @param env - Cloudflare Workers env with rate limit binding
 * @param rateLimitName - Name of the rate limit binding (from wrangler.jsonc)
 * @param identifier - Unique identifier for rate limiting (e.g., user ID, IP)
 * @returns Rate limit result with success, limit, remaining, and reset time
 */
export async function checkRateLimit(
  env: ExtendedEnv,
  rateLimitName: string,
  identifier: string
): Promise<RateLimitResult> {
  // Get rate limit binding from env
  // The binding name matches the "name" in wrangler.jsonc ratelimits config
  const rateLimit = env[rateLimitName] as RateLimitBinding | undefined;

  if (!rateLimit) {
    // Rate limiting not configured - allow request
    // Return a permissive result so headers still work
    return {
      success: true,
      limit: 0,
      remaining: 999999,
      reset: Math.floor(Date.now() / 1000) + 60,
    };
  }

  // Check rate limit using the binding
  // API: limit({ key: string }) - key is the identifier (user ID, IP, etc.)
  const result = await rateLimit.limit({ key: identifier });

  return result;
}

/**
 * Add rate limit headers to response
 *
 * @param response - Response to add headers to
 * @param rateLimitResult - Rate limit check result
 * @param config - Rate limit configuration (for limit header)
 */
export function addRateLimitHeaders(
  response: Response,
  rateLimitResult: RateLimitResult,
  config: RateLimitConfig
): void {
  // Add standard rate limit headers
  response.headers.set('X-RateLimit-Limit', String(config.limit));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, rateLimitResult.remaining)));
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.reset));

  // Add Retry-After header if rate limit exceeded
  if (!rateLimitResult.success) {
    const retryAfter = Math.max(1, rateLimitResult.reset - Math.floor(Date.now() / 1000));
    response.headers.set('Retry-After', String(retryAfter));
  }
}

/**
 * Create rate limit error response (429)
 *
 * @param rateLimitResult - Rate limit check result
 * @param config - Rate limit configuration
 * @param corsHeaders - CORS headers to include
 * @returns 429 response with rate limit headers
 */
export function createRateLimitErrorResponse(
  rateLimitResult: RateLimitResult,
  config: RateLimitConfig,
  corsHeaders: Record<string, string> = {}
): Response {
  const retryAfter = Math.max(1, rateLimitResult.reset - Math.floor(Date.now() / 1000));

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(config.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rateLimitResult.reset),
        ...corsHeaders,
      },
    }
  );
}
