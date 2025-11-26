/**
 * Flux Station - Unified notification and queue processing edge function
 * ... (comments preserved) ...
 */

import {
  buildStandardContext,
  chain,
  errorResponse,
  handleChangelogSyncRequest,
  jsonResponse,
  type Middleware,
  publicCorsHeaders,
  rateLimit,
  type StandardContext,
  serveEdgeApp,
} from '@heyclaude/edge-runtime';
import { createUtilityContext, logError, timingSafeEqual } from '@heyclaude/shared-runtime';
import { handleChangelogNotify } from './routes/changelog/notify.ts';
import { handleChangelogProcess } from './routes/changelog/process.ts';
import { handleDiscordDirect } from './routes/discord/direct.ts';
import { handleDiscordJobs } from './routes/discord/jobs.ts';
import { handleDiscordSubmissions } from './routes/discord/submissions.ts';
import {
  handleContactSubmission,
  handleDigest,
  handleGetNewsletterCount,
  handleJobLifecycleEmail,
  handleSequence,
  handleSubscribe,
  handleTransactional,
  handleWelcome,
} from './routes/email/index.ts';
import {
  handleEmbeddingGenerationQueue,
  handleEmbeddingWebhook,
} from './routes/embedding/index.ts';
import { handleActiveNotifications } from './routes/notifications/active.ts';
import { handleCreateNotification } from './routes/notifications/create.ts';
import { handleDismissNotifications } from './routes/notifications/dismiss.ts';
import { handlePulse } from './routes/pulse.ts';
import { processAllQueues } from './routes/queue-processor.ts';
import { handleRevalidation } from './routes/revalidation.ts';
import { handleExternalWebhook } from './routes/webhook/external.ts';

// Use StandardContext directly
type FluxStationContext = StandardContext;


const requireInternalSecret: Middleware<FluxStationContext> = async (
  ctx: FluxStationContext,
  next: () => Promise<Response>
) => {
  // Allow OPTIONS requests to pass through for CORS
  if (ctx.request.method === 'OPTIONS') {
    return next();
  }

  const authHeader = ctx.request.headers.get('X-Internal-Secret');
  const secret = Deno.env.get('CRON_WORKER_SECRET') || Deno.env.get('INTERNAL_API_KEY');

  if (!secret) {
    const logContext = createUtilityContext('flux-station', 'auth-config-check');
    logError('Missing CRON_WORKER_SECRET or INTERNAL_API_KEY environment variable', logContext);
    return jsonResponse(
      { error: 'Server configuration error', code: 'auth:config_error' },
      500,
      publicCorsHeaders
    );
  }

  if (!(authHeader && timingSafeEqual(authHeader, secret))) {
    return jsonResponse(
      { error: 'Unauthorized', code: 'auth:unauthorized' },
      401,
      publicCorsHeaders
    );
  }

  return next();
};

serveEdgeApp<FluxStationContext>({
  buildContext: (request) => buildStandardContext(request, ['/flux-station']),
  defaultCors: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  },
  onNoMatch: (ctx) => {
    // Default route for unmatched POST requests (external webhooks)
    if (ctx.method === 'POST' || ctx.method === 'OPTIONS') {
      return chain<FluxStationContext>(rateLimit('public'))((c) =>
        handleExternalWebhook(c.request)
      )(ctx);
    }
    const logContext = createUtilityContext('flux-station', 'not-found', {
      pathname: ctx.pathname,
    });
    return Promise.resolve(
      errorResponse(
        new Error(`Not Found: ${ctx.pathname}`),
        'flux-station:not-found',
        publicCorsHeaders,
        logContext
      )
    );
  },
  routes: [
    // Email Routes (Sub-router handling handled within handlers via X-Email-Action check or direct route)
    // Mapping specific paths for cleanliness, though handlers use X-Email-Action mostly
    // Let's route /email/* to specific handlers or action-based dispatcher
    {
      name: 'email-subscribe',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/email/subscribe',
      handler: chain<FluxStationContext>(rateLimit('email'))((ctx) => handleSubscribe(ctx.request)),
    },
    {
      name: 'email-welcome',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/email/welcome',
      handler: chain<FluxStationContext>(rateLimit('email'))((ctx) => handleWelcome(ctx.request)),
    },
    {
      name: 'email-transactional',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/email/transactional',
      handler: chain<FluxStationContext>(rateLimit('email'))((ctx) =>
        handleTransactional(ctx.request)
      ),
    },
    {
      name: 'email-digest',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/email/digest',
      handler: chain<FluxStationContext>(rateLimit('email'))(() => handleDigest()),
    },
    {
      name: 'email-sequence',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/email/sequence',
      handler: chain<FluxStationContext>(rateLimit('email'))(() => handleSequence()),
    },
    {
      name: 'email-count',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/email/count',
      handler: chain<FluxStationContext>(rateLimit('public'))(() => handleGetNewsletterCount()),
    },
    {
      name: 'email-contact',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/email/contact',
      handler: chain<FluxStationContext>(rateLimit('email'))((ctx) =>
        handleContactSubmission(ctx.request)
      ),
    },
    {
      name: 'email-job-lifecycle',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/email/job-lifecycle',
      handler: chain<FluxStationContext>(rateLimit('email'))(async (ctx) => {
        const action = (ctx.request.headers.get('X-Email-Action') || '').trim();

        if (!action) {
          return jsonResponse(
            { error: 'Missing X-Email-Action header', code: 'email:missing_action' },
            400,
            publicCorsHeaders
          );
        }

        return handleJobLifecycleEmail(ctx.request, action);
      }),
    },

    // Embedding Routes
    {
      name: 'embedding-process',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/embedding/process',
      handler: chain<FluxStationContext>(rateLimit('queueWorker'))((ctx) =>
        handleEmbeddingGenerationQueue(ctx.request)
      ),
    },
    {
      name: 'embedding-webhook',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/embedding/webhook',
      // Note: Signature verification is handled inside handleEmbeddingWebhook
      // using verifySupabaseDatabaseWebhook with INTERNAL_API_SECRET
      handler: chain<FluxStationContext>(rateLimit('public'))((ctx) =>
        handleEmbeddingWebhook(ctx.request)
      ),
    },

    // Existing Routes
    {
      name: 'changelog-webhook',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/changelog-webhook' || ctx.pathname === '/changelog-webhook/',
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )((ctx) => handleChangelogSyncRequest(ctx.request)),
    },
    {
      name: 'pulse',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/pulse' || ctx.pathname === '/pulse/',
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )((ctx) => handlePulse(ctx.request)),
    },
    {
      name: 'changelog-process',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/changelog/process' || ctx.pathname === '/changelog/process/',
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )((ctx) => handleChangelogProcess(ctx.request)),
    },
    {
      name: 'changelog-notify',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/changelog/notify' || ctx.pathname === '/changelog/notify/',
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )((ctx) => handleChangelogNotify(ctx.request)),
    },
    {
      name: 'discord-jobs',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/discord/jobs' || ctx.pathname === '/discord/jobs/',
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )((ctx) => handleDiscordJobs(ctx.request)),
    },
    {
      name: 'discord-submissions',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/discord/submissions' || ctx.pathname === '/discord/submissions/',
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )((ctx) => handleDiscordSubmissions(ctx.request)),
    },
    {
      name: 'revalidation',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/revalidation' || ctx.pathname === '/revalidation/',
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )((ctx) => handleRevalidation(ctx.request)),
    },
    {
      name: 'active-notifications',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      match: (ctx) => ctx.pathname.startsWith('/active-notifications'),
      handler: chain<FluxStationContext>(rateLimit('public'))((ctx) =>
        handleActiveNotifications(ctx.request)
      ),
    },
    {
      name: 'dismiss-notifications',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname.startsWith('/dismiss'),
      handler: chain<FluxStationContext>(rateLimit('public'))((ctx) =>
        handleDismissNotifications(ctx.request)
      ),
    },
    {
      name: 'create-notification',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname.startsWith('/notifications/create'),
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )((ctx) => handleCreateNotification(ctx.request)),
    },
    {
      name: 'discord-direct',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => {
        // Match only on /discord/direct path to prevent unintended routing
        if (ctx.pathname !== '/discord/direct' && ctx.pathname !== '/discord/direct/') {
          return false;
        }
        const notificationType = ctx.request.headers.get('X-Discord-Notification-Type');
        return Boolean(notificationType);
      },
      handler: chain<FluxStationContext>(rateLimit('public'))((ctx) =>
        handleDiscordDirect(ctx.request)
      ),
    },
    {
      name: 'process-queues',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/process-queues' || ctx.pathname === '/process-queues/',
      handler: chain<FluxStationContext>(
        rateLimit('queueWorker'),
        requireInternalSecret
      )(async () => {
        const summary = await processAllQueues();
        return new Response(
          JSON.stringify({
            success: true,
            summary: {
              totalQueues: summary.totalQueues,
              queuesWithMessages: summary.queuesWithMessages,
              queuesProcessed: summary.queuesProcessed,
              totalMessagesProcessed: summary.results.reduce(
                (sum, r) => sum + (r.processed ?? 0),
                0
              ),
              results: summary.results,
            },
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...publicCorsHeaders,
            },
          }
        );
      }),
    },
  ],
});
