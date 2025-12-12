/**
 * Rate Limiting
 *
 * Simple in-memory rate limiting for MCP edge function.
 * Tracks requests per user per time window.
 *
 * Note: This is a basic implementation. For production at scale,
 * consider using Redis or Supabase Edge Function rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limit store
 * Key: userId:toolName or userId:global
 * Value: { count, resetAt }
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Whether to apply per-tool or global */
  perTool?: boolean;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Global rate limit (all tools combined)
  global: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    perTool: false,
  },
  // Per-tool rate limits (in addition to global)
  'searchContent': {
    maxRequests: 30,
    windowMs: 60 * 1000,
    perTool: true,
  },
  'getContentDetail': {
    maxRequests: 50,
    windowMs: 60 * 1000,
    perTool: true,
  },
  'downloadContentForPlatform': {
    maxRequests: 20,
    windowMs: 60 * 1000,
    perTool: true,
  },
  'subscribeNewsletter': {
    maxRequests: 5,
    windowMs: 60 * 1000,
    perTool: true,
  },
  'createAccount': {
    maxRequests: 10,
    windowMs: 60 * 1000,
    perTool: true,
  },
  'submitContent': {
    maxRequests: 10,
    windowMs: 60 * 1000,
    perTool: true,
  },
};

/**
 * Check if request should be rate limited
 *
 * @param userId - User ID from JWT token
 * @param toolName - Tool name being called (optional, for per-tool limits)
 * @returns Object with `allowed` boolean and `retryAfter` seconds if limited
 */
export function checkRateLimit(
  userId: string,
  toolName?: string
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const now = Date.now();

  // Check global rate limit
  const globalKey = `${userId}:global`;
  const globalEntry = rateLimitStore.get(globalKey);
  const globalConfig = RATE_LIMITS.global;

  if (!globalEntry || now >= globalEntry.resetAt) {
    // Reset or initialize global counter
    rateLimitStore.set(globalKey, {
      count: 1,
      resetAt: now + globalConfig.windowMs,
    });
  } else {
    globalEntry.count++;
    if (globalEntry.count > globalConfig.maxRequests) {
      const retryAfter = Math.ceil((globalEntry.resetAt - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
      };
    }
  }

  // Check per-tool rate limit if tool name provided
  if (toolName && RATE_LIMITS[toolName]) {
    const toolConfig = RATE_LIMITS[toolName];
    const toolKey = `${userId}:${toolName}`;
    const toolEntry = rateLimitStore.get(toolKey);

    if (!toolEntry || now >= toolEntry.resetAt) {
      // Reset or initialize tool counter
      rateLimitStore.set(toolKey, {
        count: 1,
        resetAt: now + toolConfig.windowMs,
      });
    } else {
      toolEntry.count++;
      if (toolEntry.count > toolConfig.maxRequests) {
        const retryAfter = Math.ceil((toolEntry.resetAt - now) / 1000);
        return {
          allowed: false,
          retryAfter,
          remaining: 0,
        };
      }
    }
  }

  // Calculate remaining requests
  const globalRemaining = globalEntry
    ? Math.max(0, globalConfig.maxRequests - globalEntry.count)
    : globalConfig.maxRequests - 1;

  return {
    allowed: true,
    remaining: globalRemaining,
  };
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Initialize periodic cleanup (every 5 minutes)
 */
if (typeof globalThis !== 'undefined') {
  // Run cleanup every 5 minutes
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
