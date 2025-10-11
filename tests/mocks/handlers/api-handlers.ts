/**
 * API Route Request Handlers
 *
 * Mocks for API routes beyond content endpoints.
 * Includes cron jobs, webhooks, email previews, etc.
 *
 * **Test Coverage:**
 * - Cron job endpoints (authentication, execution)
 * - Webhook handlers (Resend, GitHub, etc.)
 * - Cache warming endpoints
 * - Email preview endpoints
 *
 * @see src/app/api/ directory
 */

import { http, HttpResponse, delay } from 'msw';

/**
 * API route handlers
 */
export const apiHandlers = [
  /**
   * POST /api/cache/warm - Cache warming endpoint
   */
  http.post('http://localhost:3000/api/cache/warm', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      warmed: ['agents', 'mcp', 'commands', 'hooks', 'rules', 'statuslines'],
      timestamp: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/emails/preview - Email preview endpoint
   */
  http.get('http://localhost:3000/api/emails/preview', async ({ request }) => {
    const url = new URL(request.url);
    const template = url.searchParams.get('template');

    await delay(100);

    return HttpResponse.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Preview: ${template}</title>
        </head>
        <body>
          <h1>Preview: ${template}</h1>
          <p>This is a mock email preview for testing.</p>
        </body>
      </html>
    `);
  }),

  /**
   * POST /api/webhooks/resend - Resend webhook handler
   */
  http.post('http://localhost:3000/api/webhooks/resend', async ({ request }) => {
    await delay(50);

    const body = await request.json();

    // Validate webhook signature (mocked)
    const signature = request.headers.get('svix-signature');
    if (!signature) {
      return HttpResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      event: body,
      processed: true,
    });
  }),

  /**
   * GET /api/guides/trending - Trending guides endpoint
   */
  http.get('http://localhost:3000/api/guides/trending', async () => {
    await delay(100);

    return HttpResponse.json({
      trending: [
        {
          slug: 'getting-started-with-mcp',
          title: 'Getting Started with MCP',
          views: 1234,
          trending_score: 95.5,
        },
        {
          slug: 'advanced-claude-agents',
          title: 'Advanced Claude Agents',
          views: 987,
          trending_score: 87.2,
        },
      ],
      lastUpdated: new Date().toISOString(),
    });
  }),
];

/**
 * Cron job handlers (require authentication)
 */
export const cronHandlers = [
  /**
   * GET /api/cron/calculate-weekly-featured
   */
  http.get('http://localhost:3000/api/cron/calculate-weekly-featured', async ({ request }) => {
    // Check for cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer test-cron-secret') {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await delay(500);

    return HttpResponse.json({
      success: true,
      featured: ['agent-1', 'mcp-2', 'command-3'],
      calculatedAt: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/cron/calculate-similarities
   */
  http.get('http://localhost:3000/api/cron/calculate-similarities', async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer test-cron-secret') {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await delay(1000);

    return HttpResponse.json({
      success: true,
      processed: 150,
      similarityPairs: 450,
      duration: 980,
    });
  }),

  /**
   * GET /api/cron/send-weekly-digest
   */
  http.get('http://localhost:3000/api/cron/send-weekly-digest', async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer test-cron-secret') {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await delay(300);

    return HttpResponse.json({
      success: true,
      sent: 245,
      failed: 3,
      timestamp: new Date().toISOString(),
    });
  }),
];

/**
 * Error scenario handlers
 */
export const apiErrorHandlers = {
  /**
   * Unauthorized cron job request
   */
  unauthorizedCron: http.get('http://localhost:3000/api/cron/:job', () => {
    return HttpResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing cron secret' },
      { status: 401 }
    );
  }),

  /**
   * Webhook signature validation failure
   */
  invalidWebhookSignature: http.post('http://localhost:3000/api/webhooks/:service', () => {
    return HttpResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    );
  }),
};
