/**
 * Flux Station - Unified notification and queue processing edge function
 * ... (comments preserved) ...
 */

import { buildStandardContext, type StandardContext } from '@heyclaude/edge-runtime/utils/context.ts';
import { chain } from '@heyclaude/edge-runtime/middleware/chain.ts';
import type { Middleware } from '@heyclaude/edge-runtime/middleware/types.ts';
import { rateLimit } from '@heyclaude/edge-runtime/middleware/rate-limit.ts';
import { serveEdgeApp } from '@heyclaude/edge-runtime/app.ts';
import { handleChangelogSyncRequest } from '@heyclaude/edge-runtime/handlers/changelog/handler.ts';
import {
  errorResponse,
  jsonResponse,
  publicCorsHeaders,
  badRequestResponse,
  unauthorizedResponse,
  discordCorsHeaders,
} from '@heyclaude/edge-runtime/utils/http.ts';
import { createUtilityContext, logError, logWarn } from '@heyclaude/shared-runtime/logging.ts';
import { timingSafeEqual } from '@heyclaude/shared-runtime/crypto-utils.ts';
import { verifyDiscordWebhookSignature } from '@heyclaude/shared-runtime/webhook/crypto.ts';
import { MAX_BODY_SIZE, validateBodySize } from '@heyclaude/shared-runtime/input-validation.ts';
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
import { handleImageGenerationQueue } from './routes/image-generation/index.ts';
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
    await logError('Missing CRON_WORKER_SECRET or INTERNAL_API_KEY environment variable', logContext);
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

/**
 * Middleware to verify Discord webhook signatures using Ed25519
 * Verifies X-Signature-Ed25519 and X-Signature-Timestamp headers
 * Reconstructs the request with the body so handlers can read it
 */
const verifyDiscordWebhookSignatureMiddleware: Middleware<FluxStationContext> = async (
  ctx: FluxStationContext,
  next: () => Promise<Response>
) => {
  // Allow OPTIONS requests to pass through for CORS
  if (ctx.request.method === 'OPTIONS') {
    return next();
  }

  const logContext = createUtilityContext('flux-station', 'discord-webhook-verification');

  // Get Discord public key from environment
  const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
  if (!publicKey) {
    await logError('Missing DISCORD_PUBLIC_KEY environment variable', logContext);
    return jsonResponse(
      { error: 'Server configuration error', code: 'discord:config_error' },
      500,
      discordCorsHeaders
    );
  }

  // Extract signature headers
  const signature = ctx.request.headers.get('X-Signature-Ed25519');
  const timestamp = ctx.request.headers.get('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    logWarn('Missing Discord webhook signature headers', {
      ...logContext,
      has_signature: !!signature,
      has_timestamp: !!timestamp,
    });
    return unauthorizedResponse(
      'Missing X-Signature-Ed25519 or X-Signature-Timestamp header',
      discordCorsHeaders
    );
  }

  // Validate body size before reading
  const contentLength = ctx.request.headers.get('content-length');
  const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.discord);
  if (!bodySizeValidation.valid) {
    logWarn('Discord webhook body size validation failed', {
      ...logContext,
      content_length: contentLength,
      error: bodySizeValidation.error,
    });
    return badRequestResponse(
      bodySizeValidation.error ?? 'Request body too large',
      discordCorsHeaders
    );
  }

  // Clone request to read body without consuming the original
  let rawBody: string;
  try {
    const clonedRequest = ctx.request.clone();
    rawBody = await clonedRequest.text();
  } catch (error) {
    await logError('Failed to read Discord webhook request body', logContext, error);
    return badRequestResponse('Failed to read request body', discordCorsHeaders);
  }

  // Double-check size after reading (use byte length, not UTF-16 code units)
  const bodySizeBytes = new TextEncoder().encode(rawBody).length;
  if (bodySizeBytes > MAX_BODY_SIZE.discord) {
    logWarn('Discord webhook body size exceeded after reading', {
      ...logContext,
      body_size_bytes: bodySizeBytes,
      max_size: MAX_BODY_SIZE.discord,
    });
    return badRequestResponse(
      `Request body too large (max ${MAX_BODY_SIZE.discord} bytes)`,
      discordCorsHeaders
    );
  }

  // Replay resistance: Validate timestamp is recent (within 5 minutes)
  // Discord sends timestamp in seconds, convert to milliseconds for comparison with Date.now()
  const timestampSeconds = Number.parseInt(timestamp, 10);
  if (Number.isNaN(timestampSeconds)) {
    logWarn('Invalid Discord webhook timestamp format', {
      ...logContext,
      timestamp,
    });
    return badRequestResponse('Invalid X-Signature-Timestamp format', discordCorsHeaders);
  }
  const timestampMs = timestampSeconds * 1000; // Convert seconds to milliseconds
  const currentTimeMs = Date.now();
  const timestampAgeMs = currentTimeMs - timestampMs;
  const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000; // 5 minutes
  if (timestampAgeMs > MAX_TIMESTAMP_AGE_MS || timestampAgeMs < -MAX_TIMESTAMP_AGE_MS) {
    logWarn('Discord webhook timestamp too old or too far in future (possible replay attack)', {
      ...logContext,
      timestamp_age_ms: timestampAgeMs,
      max_age_ms: MAX_TIMESTAMP_AGE_MS,
    });
    return badRequestResponse('Request timestamp is too old or invalid', discordCorsHeaders);
  }

  // Verify the signature
  const isValid = await verifyDiscordWebhookSignature({
    rawBody,
    signature,
    timestamp,
    publicKey,
  });

  if (!isValid) {
    logWarn('Discord webhook signature verification failed', {
      ...logContext,
      has_timestamp: !!timestamp,
      signature_length: signature.length,
    });
    return unauthorizedResponse('Invalid Discord webhook signature', discordCorsHeaders);
  }

  // Reconstruct the request with the body so handlers can read it
  // This is necessary because we consumed the body stream during verification
  ctx.request = new Request(ctx.request.url, {
    method: ctx.request.method,
    headers: ctx.request.headers,
    body: rawBody,
  });

  return next();
};

serveEdgeApp<FluxStationContext>({
  buildContext: (request) => buildStandardContext(request, ['/flux-station']),
  defaultCors: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  },
  onNoMatch: async (ctx) => {
    // Default route for unmatched POST requests (external webhooks)
    if (ctx.method === 'POST' || ctx.method === 'OPTIONS') {
      return chain<FluxStationContext>(rateLimit('public'))((c) =>
        handleExternalWebhook(c.request)
      )(ctx);
    }
    const logContext = createUtilityContext('flux-station', 'not-found', {
      pathname: ctx.pathname,
    });
    return await errorResponse(
      new Error(`Not Found: ${ctx.pathname}`),
      'flux-station:not-found',
      publicCorsHeaders,
      logContext
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
      handler: chain<FluxStationContext>(rateLimit('email'))((ctx) => {
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
    // Image Generation Routes
    {
      name: 'image-generation-process',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/image-generation/process',
      handler: chain<FluxStationContext>(rateLimit('queueWorker'))((ctx) =>
        handleImageGenerationQueue(ctx.request)
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
        // Header validation happens in handler (returns 400 if missing)
        return ctx.pathname === '/discord/direct' || ctx.pathname === '/discord/direct/';
      },
      handler: chain<FluxStationContext>(
        rateLimit('public'),
        verifyDiscordWebhookSignatureMiddleware
      )((ctx) => handleDiscordDirect(ctx.request)),
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
              queuesAttempted: summary.queuesAttempted,
              queuesSucceeded: summary.queuesSucceeded,
              totalMessagesProcessed: (summary.results ?? []).reduce(
                (sum, r) => sum + (r.processed ?? 0),
                0
              ),
              results: summary.results ?? [],
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
