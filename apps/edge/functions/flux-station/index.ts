/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Flux Station - Unified notification and queue processing edge function
 * ... (comments preserved) ...
 */

import {
  buildStandardContext,
  chain,
  rateLimit,
  type StandardContext,
  serveEdgeApp,
} from '@heyclaude/edge-runtime';
import { handleChangelogSyncRequest } from '@heyclaude/edge-runtime/handlers/changelog/handler.ts';
import { errorResponse, publicCorsHeaders } from '@heyclaude/edge-runtime/utils/http.ts';
import { handleChangelogNotify } from './routes/changelog/notify.ts';
import { handleChangelogProcess } from './routes/changelog/process.ts';
import { handleDiscordDirect } from './routes/discord/direct.ts';
import { handleDiscordJobs } from './routes/discord/jobs.ts';
import { handleDiscordSubmissions } from './routes/discord/submissions.ts';
import { handleActiveNotifications } from './routes/notifications/active.ts';
import { handleCreateNotification } from './routes/notifications/create.ts';
import { handleDismissNotifications } from './routes/notifications/dismiss.ts';
import { handlePulse } from './routes/pulse.ts';
import { processAllQueues } from './routes/queue-processor.ts';
import { handleRevalidation } from './routes/revalidation.ts';
import { handleExternalWebhook } from './routes/webhook/external.ts';

// Use StandardContext directly
type FluxStationContext = StandardContext;

serveEdgeApp<FluxStationContext>({
  buildContext: (request) => buildStandardContext(request, ['/flux-station']),
  defaultCors: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  },
  onNoMatch: (ctx) => {
    // Default route for unmatched POST requests (external webhooks)
    if (ctx.method === 'POST' || ctx.method === 'OPTIONS') {
      return handleExternalWebhook(ctx.request);
    }
    return Promise.resolve(
      errorResponse(new Error(`Not Found: ${ctx.pathname}`), 'flux-station:not-found')
    );
  },
  routes: [
    {
      name: 'changelog-webhook',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/changelog-webhook' || ctx.pathname === '/changelog-webhook/',
      handler: chain(rateLimit('queueWorker'))((ctx) => handleChangelogSyncRequest(ctx.request)),
    },
    {
      name: 'pulse',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/pulse' || ctx.pathname === '/pulse/',
      handler: chain(rateLimit('queueWorker'))((ctx) => handlePulse(ctx.request)),
    },
    {
      name: 'changelog-process',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/changelog/process' || ctx.pathname === '/changelog/process/',
      handler: chain(rateLimit('queueWorker'))((ctx) => handleChangelogProcess(ctx.request)),
    },
    {
      name: 'changelog-notify',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/changelog/notify' || ctx.pathname === '/changelog/notify/',
      handler: chain(rateLimit('queueWorker'))((ctx) => handleChangelogNotify(ctx.request)),
    },
    {
      name: 'discord-jobs',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/discord/jobs' || ctx.pathname === '/discord/jobs/',
      handler: chain(rateLimit('queueWorker'))((ctx) => handleDiscordJobs(ctx.request)),
    },
    {
      name: 'discord-submissions',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) =>
        ctx.pathname === '/discord/submissions' || ctx.pathname === '/discord/submissions/',
      handler: chain(rateLimit('queueWorker'))((ctx) => handleDiscordSubmissions(ctx.request)),
    },
    {
      name: 'revalidation',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/revalidation' || ctx.pathname === '/revalidation/',
      handler: chain(rateLimit('queueWorker'))((ctx) => handleRevalidation(ctx.request)),
    },
    {
      name: 'active-notifications',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      match: (ctx) => ctx.pathname.startsWith('/active-notifications'),
      handler: chain(rateLimit('public'))((ctx) => handleActiveNotifications(ctx.request)),
    },
    {
      name: 'dismiss-notifications',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname.startsWith('/dismiss'),
      handler: chain(rateLimit('public'))((ctx) => handleDismissNotifications(ctx.request)),
    },
    {
      name: 'create-notification',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname.startsWith('/notifications/create'),
      handler: chain(rateLimit('public'))((ctx) => handleCreateNotification(ctx.request)),
    },
    {
      name: 'discord-direct',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => {
        const notificationType = ctx.request.headers.get('X-Discord-Notification-Type');
        return Boolean(notificationType);
      },
      handler: chain(rateLimit('public'))((ctx) => handleDiscordDirect(ctx.request)),
    },
    {
      name: 'process-queues',
      methods: ['POST', 'OPTIONS'],
      match: (ctx) => ctx.pathname === '/process-queues' || ctx.pathname === '/process-queues/',
      handler: async () => {
        // No rate limit for internal queue processor cron? Or maybe 'heavy'?
        // Keeping it without rate limit as per original logic (it didn't use checkRateLimit)
        // Actually, original logic was just handler: async () => ...
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
      },
    },
  ],
});
