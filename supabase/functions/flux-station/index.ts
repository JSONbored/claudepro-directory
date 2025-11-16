/**
 * Flux Station - Unified notification and queue processing edge function
 * Handles all notification APIs, webhooks, and queue processing routes
 *
 * @route POST /changelog-webhook
 * @description Receive Vercel deployment webhooks (ingests and enqueues to changelog_process)
 * @env VERCEL_WEBHOOK_SECRET - Webhook signature verification
 *
 * @route POST /pulse
 * @description Process pulse events (pulse queue)
 * @env RESEND_API_KEY - Optional: Email engagement tracking
 *
 * @route POST /changelog/process
 * @description Process changelog webhooks (changelog_process queue)
 * @env GITHUB_TOKEN - GitHub API authentication
 * @env GITHUB_REPO_OWNER - Repository owner
 * @env GITHUB_REPO_NAME - Repository name
 *
 * @route POST /changelog/notify
 * @description Send changelog notifications (changelog_notify queue)
 * @env DISCORD_CHANGELOG_WEBHOOK_URL - Discord webhook for changelog channel
 * @env REVALIDATE_SECRET - Cache invalidation authentication
 *
 * @route POST /discord/jobs
 * @description Process job Discord notifications (discord_jobs queue)
 * @env DISCORD_WEBHOOK_JOBS - Discord webhook for jobs channel
 *
 * @route POST /discord/submissions
 * @description Process submission Discord notifications (discord_submissions queue)
 * @env DISCORD_WEBHOOK_URL - Default Discord webhook for submissions
 *
 * @route POST /discord
 * @description Direct Discord notification handler (not queue-based)
 * @env DISCORD_WEBHOOK_JOBS - If X-Discord-Notification-Type: job
 * @env DISCORD_WEBHOOK_URL - If X-Discord-Notification-Type: submission
 * @env DISCORD_ANNOUNCEMENTS_WEBHOOK_URL - If X-Discord-Notification-Type: content
 * @env DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK - If X-Discord-Notification-Type: error
 * @env DISCORD_CHANGELOG_WEBHOOK_URL - If X-Discord-Notification-Type: changelog
 *
 * @route POST /revalidation
 * @description Process content revalidation (revalidation queue)
 * @env REVALIDATE_SECRET - Cache invalidation authentication
 *
 * @route GET /active-notifications
 * @description Fetch active notifications for authenticated user
 * @env None - Uses database RPC only
 *
 * @route POST /dismiss
 * @description Dismiss notifications for authenticated user
 * @env None - Uses database operations only
 *
 * @route POST /webhook
 * @description Default route for external webhooks (catches all unmatched POST requests)
 * @env VERCEL_WEBHOOK_SECRET - If source is Vercel
 * @env RESEND_WEBHOOK_SECRET - If source is Resend
 * @env POLAR_WEBHOOK_SECRET - If source is Polar.sh
 *
 * @note All routes use SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
 */

import { handleChangelogSyncRequest } from '../_shared/handlers/changelog/handler.ts';
import { errorResponse } from '../_shared/utils/http.ts';
import { validatePathSegments, validateQueryString } from '../_shared/utils/input-validation.ts';
import { checkRateLimit } from '../_shared/utils/rate-limit.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import { handleChangelogNotify } from './routes/changelog/notify.ts';
import { handleChangelogProcess } from './routes/changelog/process.ts';
import { handleDiscordDirect } from './routes/discord/direct.ts';
import { handleDiscordJobs } from './routes/discord/jobs.ts';
import { handleDiscordSubmissions } from './routes/discord/submissions.ts';
import { handleActiveNotifications } from './routes/notifications/active.ts';
import { handleDismissNotifications } from './routes/notifications/dismiss.ts';
import { handlePulse } from './routes/pulse.ts';
import { handleRevalidation } from './routes/revalidation.ts';
import { handleExternalWebhook } from './routes/webhook/external.ts';

interface FluxStationContext extends RouterContext {
  pathname: string;
  segments: string[];
}

// Rate limit config for queue workers (more restrictive than public endpoints)
const QUEUE_WORKER_RATE_LIMIT = {
  maxRequests: 60,
  windowMs: 60 * 1000, // 60 requests per minute
} as const;

// Rate limit config for user-facing routes (more lenient, but still protected)
const USER_ROUTE_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 100 requests per minute
} as const;

const router = createRouter<FluxStationContext>({
  buildContext: (request) => {
    const url = new URL(request.url);
    const originalMethod = request.method.toUpperCase() as HttpMethod;
    const normalizedMethod = (originalMethod === 'HEAD' ? 'GET' : originalMethod) as HttpMethod;
    const pathname = url.pathname.replace(/^\/flux-station/, '') || '/';
    const segments =
      pathname === '/' ? [] : pathname.replace(/^\/+/, '').split('/').filter(Boolean);

    // Input validation
    const queryValidation = validateQueryString(url);
    if (!queryValidation.valid) {
      throw new Error(queryValidation.error);
    }

    const pathValidation = validatePathSegments(segments);
    if (!pathValidation.valid) {
      throw new Error(pathValidation.error);
    }

    return {
      request,
      url,
      pathname,
      segments,
      searchParams: url.searchParams,
      method: normalizedMethod,
      originalMethod,
    };
  },
  defaultCors: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  },
  onNoMatch: (ctx) => {
    // Default route for unmatched POST requests (external webhooks)
    if (ctx.method === 'POST' || ctx.method === 'OPTIONS') {
      return handleExternalWebhook(ctx.request);
    }
    return errorResponse(new Error(`Not Found: ${ctx.pathname}`), 'flux-station:not-found');
  },
  routes: [
    {
      name: 'changelog-webhook',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/changelog-webhook' || ctx.pathname === '/changelog-webhook/',
      handler: async (ctx) => {
        // Rate limiting
        const rateLimit = checkRateLimit(ctx.request, QUEUE_WORKER_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(QUEUE_WORKER_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleChangelogSyncRequest(ctx.request);
      },
    },
    {
      name: 'pulse',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/pulse' || ctx.pathname === '/pulse/',
      handler: async (ctx) => {
        // Rate limiting
        const rateLimit = checkRateLimit(ctx.request, QUEUE_WORKER_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(QUEUE_WORKER_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handlePulse(ctx.request);
      },
    },
    {
      name: 'changelog-process',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/changelog/process' || ctx.pathname === '/changelog/process/',
      handler: async (ctx) => {
        // Rate limiting
        const rateLimit = checkRateLimit(ctx.request, QUEUE_WORKER_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(QUEUE_WORKER_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleChangelogProcess(ctx.request);
      },
    },
    {
      name: 'changelog-notify',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/changelog/notify' || ctx.pathname === '/changelog/notify/',
      handler: async (ctx) => {
        // Rate limiting
        const rateLimit = checkRateLimit(ctx.request, QUEUE_WORKER_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(QUEUE_WORKER_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleChangelogNotify(ctx.request);
      },
    },
    {
      name: 'discord-jobs',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/discord/jobs' || ctx.pathname === '/discord/jobs/',
      handler: async (ctx) => {
        // Rate limiting
        const rateLimit = checkRateLimit(ctx.request, QUEUE_WORKER_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(QUEUE_WORKER_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleDiscordJobs(ctx.request);
      },
    },
    {
      name: 'discord-submissions',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/discord/submissions' || ctx.pathname === '/discord/submissions/',
      handler: async (ctx) => {
        // Rate limiting
        const rateLimit = checkRateLimit(ctx.request, QUEUE_WORKER_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(QUEUE_WORKER_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleDiscordSubmissions(ctx.request);
      },
    },
    {
      name: 'revalidation',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/revalidation' || ctx.pathname === '/revalidation/',
      handler: async (ctx) => {
        // Rate limiting
        const rateLimit = checkRateLimit(ctx.request, QUEUE_WORKER_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(QUEUE_WORKER_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleRevalidation(ctx.request);
      },
    },
    {
      name: 'active-notifications',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      match: (ctx) => ctx.pathname.startsWith('/active-notifications'),
      handler: async (ctx) => {
        // Rate limiting for user routes
        const rateLimit = checkRateLimit(ctx.request, USER_ROUTE_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(USER_ROUTE_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleActiveNotifications(ctx.request);
      },
    },
    {
      name: 'dismiss-notifications',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname.startsWith('/dismiss'),
      handler: async (ctx) => {
        // Rate limiting for user routes
        const rateLimit = checkRateLimit(ctx.request, USER_ROUTE_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(USER_ROUTE_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleDismissNotifications(ctx.request);
      },
    },
    {
      name: 'discord-direct',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => {
        const notificationType = ctx.request.headers.get('X-Discord-Notification-Type');
        return Boolean(notificationType);
      },
      handler: async (ctx) => {
        // Rate limiting for direct Discord notifications
        const rateLimit = checkRateLimit(ctx.request, USER_ROUTE_RATE_LIMIT);
        if (!rateLimit.allowed) {
          return errorResponse(new Error('Rate limit exceeded'), 'flux-station:rate-limit', {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(USER_ROUTE_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          });
        }
        return handleDiscordDirect(ctx.request);
      },
    },
  ],
});

Deno.serve(async (req: Request) => {
  try {
    return await router(req);
  } catch (error) {
    // Handle validation errors from buildContext
    if (
      error instanceof Error &&
      (error.message.includes('too long') || error.message.includes('invalid'))
    ) {
      return errorResponse(error, 'flux-station:validation-error');
    }
    // Re-throw to let router handle it
    throw error;
  }
});
