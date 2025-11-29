import { checkRateLimit, RATE_LIMIT_PRESETS } from '@heyclaude/shared-runtime/rate-limit.ts';
import type { Middleware } from '@heyclaude/edge-runtime/middleware/types.ts';
import type { RouterContext } from '@heyclaude/edge-runtime/utils/router.ts';
import { jsonResponse } from '@heyclaude/edge-runtime/utils/http.ts';

type RateLimitPresetKey = keyof typeof RATE_LIMIT_PRESETS;
type RateLimitSelector = (ctx: RouterContext) => RateLimitPresetKey;

export function rateLimit(presetOrSelector: RateLimitPresetKey | RateLimitSelector): Middleware {
  return async (ctx, next) => {
    const presetKey = typeof presetOrSelector === 'function' 
      ? presetOrSelector(ctx) 
      : presetOrSelector;
      
    const preset = RATE_LIMIT_PRESETS[presetKey];
    const result = checkRateLimit(ctx.request, preset);

    if (!result.allowed) {
      return jsonResponse(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        },
        429,
        ctx.defaultCors || {},
        {
          'Retry-After': String(result.retryAfter ?? 60),
          'X-RateLimit-Limit': String(preset.maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.resetAt),
        }
      );
    }

    const response = await next();

    // Add headers to successful response
    response.headers.set('X-RateLimit-Limit', String(preset.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));

    return response;
  };
}
