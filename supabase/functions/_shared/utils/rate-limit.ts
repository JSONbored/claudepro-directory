/**
 * Rate limiting utility for edge functions
 * Simple in-memory rate limiter with per-IP tracking
 * For production scale, consider using Redis or Supabase Edge Config
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string; // Optional custom identifier (defaults to IP)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// In-memory store (clears on function restart)
// For production, consider using Supabase Edge Config or external cache
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Maximum entries to prevent unbounded memory growth
const MAX_RATE_LIMITER_ENTRIES = 10000;

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries(): void {
  const now = Date.now();

  // If we're at capacity, do aggressive cleanup
  if (requestCounts.size >= MAX_RATE_LIMITER_ENTRIES) {
    // Remove all expired entries immediately
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetAt < now) {
        requestCounts.delete(key);
      }
    }
    // If still at capacity, remove oldest 10% of entries
    if (requestCounts.size >= MAX_RATE_LIMITER_ENTRIES) {
      const entries = Array.from(requestCounts.entries()).sort(
        (a, b) => a[1].resetAt - b[1].resetAt
      );
      const toRemove = Math.floor(entries.length * 0.1);
      for (let i = 0; i < toRemove; i++) {
        const entry = entries[i];
        if (entry) {
          requestCounts.delete(entry[0]);
        }
      }
    }
    lastCleanup = now;
    return;
  }

  // Normal cleanup (every 5 minutes)
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, value] of requestCounts.entries()) {
    if (value.resetAt < now) {
      requestCounts.delete(key);
    }
  }
  lastCleanup = now;
}

function getIdentifier(request: Request, customIdentifier?: string): string {
  if (customIdentifier) {
    return customIdentifier;
  }

  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier if no IP available
  return 'unknown';
}

export function checkRateLimit(request: Request, config: RateLimitConfig): RateLimitResult {
  cleanupOldEntries();

  const identifier = getIdentifier(request, config.identifier);
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}`;

  const existing = requestCounts.get(key);

  if (!existing || existing.resetAt < now) {
    // New window or expired window
    requestCounts.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Existing window
  if (existing.count >= config.maxRequests) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Rate limit presets for different endpoint types
 */
export const RATE_LIMIT_PRESETS = {
  // Public read endpoints - more lenient
  public: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 req/min
  // Heavy endpoints (sitemap, feeds) - more restrictive
  heavy: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 req/min
  // IndexNow endpoint - very restrictive
  indexnow: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req/min
  // Status endpoint - very lenient
  status: { maxRequests: 200, windowMs: 60 * 1000 }, // 200 req/min
  // Email endpoints - moderate (POST operations)
  email: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 req/min
  // Transform endpoints - moderate (POST operations with processing)
  transform: { maxRequests: 50, windowMs: 60 * 1000 }, // 50 req/min
  // Search endpoints - lenient (GET operations)
  search: { maxRequests: 120, windowMs: 60 * 1000 }, // 120 req/min
} as const;
