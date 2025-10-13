/**
 * External Service Request Handlers
 *
 * Mocks for third-party services and external APIs.
 * Prevents real network calls during testing.
 *
 * **Services:**
 * - Supabase Database (REST API)
 * - Redis (Upstash HTTP API)
 * - Resend Email API
 * - GitHub API
 * - Analytics services
 *
 * **Benefits:**
 * - Faster test execution (no network latency)
 * - Deterministic test results
 * - No API rate limits
 * - Works offline
 * - No test data pollution in production services
 */

import { delay, HttpResponse, http } from 'msw';

/**
 * External service handlers
 */
export const externalHandlers = [
  /**
   * Supabase REST API - Generic query handler
   * Intercepts Supabase database queries
   */
  http.get('https://*.supabase.co/rest/v1/:table', async ({ params, request }) => {
    await delay(100);

    const { table } = params;

    // Mock response based on table
    const mockData: Record<string, unknown[]> = {
      bookmarks: [
        {
          id: 'bookmark-1',
          user_id: 'user-123',
          content_type: 'agent',
          content_slug: 'test-agent',
          created_at: new Date().toISOString(),
        },
      ],
      collections: [
        {
          id: 'collection-1',
          user_id: 'user-123',
          name: 'My Favorite Agents',
          description: 'A collection of useful agents',
          created_at: new Date().toISOString(),
        },
      ],
      reviews: [
        {
          id: 'review-1',
          user_id: 'user-123',
          content_type: 'mcp',
          content_slug: 'test-mcp',
          rating: 5,
          comment: 'Excellent MCP server!',
          created_at: new Date().toISOString(),
        },
      ],
    };

    return HttpResponse.json(mockData[table as string] || [], {
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': `0-${(mockData[table as string] || []).length - 1}/${(mockData[table as string] || []).length}`,
      },
    });
  }),

  /**
   * Supabase REST API - POST (insert)
   */
  http.post('https://*.supabase.co/rest/v1/:table', async ({ request, params }) => {
    await delay(150);

    const body = await request.json();
    const { table } = params;

    // Mock successful insert
    return HttpResponse.json(
      [
        {
          id: `${table}-${Math.random().toString(36).substring(7)}`,
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { status: 201 }
    );
  }),

  /**
   * Supabase REST API - PATCH (update)
   */
  http.patch('https://*.supabase.co/rest/v1/:table', async ({ request, params }) => {
    await delay(100);

    const body = await request.json();

    return HttpResponse.json([
      {
        ...body,
        updated_at: new Date().toISOString(),
      },
    ]);
  }),

  /**
   * Supabase REST API - DELETE
   */
  http.delete('https://*.supabase.co/rest/v1/:table', async () => {
    await delay(100);

    return HttpResponse.json({ success: true }, { status: 204 });
  }),

  /**
   * Upstash Redis HTTP API - GET
   */
  http.get('https://*.upstash.io/get/:key', async ({ params }) => {
    await delay(50);

    // Mock cached data
    const mockCache: Record<string, string> = {
      'stats:views:agent:test-agent': '1234',
      'stats:copies:command:test-command': '567',
      'cache:featured:weekly': JSON.stringify(['agent-1', 'mcp-2']),
    };

    const { key } = params;
    const value = mockCache[key as string];

    if (value) {
      return HttpResponse.json({ result: value });
    }

    return HttpResponse.json({ result: null });
  }),

  /**
   * Upstash Redis HTTP API - SET
   */
  http.post('https://*.upstash.io/set/:key', async ({ params }) => {
    await delay(50);

    return HttpResponse.json({ result: 'OK' });
  }),

  /**
   * Upstash Redis HTTP API - INCR
   */
  http.post('https://*.upstash.io/incr/:key', async () => {
    await delay(50);

    return HttpResponse.json({ result: Math.floor(Math.random() * 1000) + 1 });
  }),

  /**
   * Resend Email API - Send email
   */
  http.post('https://api.resend.com/emails', async ({ request }) => {
    await delay(200);

    const body = await request.json();

    // Validate API key
    const apiKey = request.headers.get('authorization');
    if (!(apiKey && apiKey.startsWith('Bearer re_'))) {
      return HttpResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    return HttpResponse.json(
      {
        id: `email-${Math.random().toString(36).substring(7)}`,
        from: (body as { from: string }).from,
        to: (body as { to: string[] }).to,
        created_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  }),

  /**
   * GitHub API - Get repository info
   */
  http.get('https://api.github.com/repos/:owner/:repo', async ({ params }) => {
    await delay(300);

    const { owner, repo } = params;

    return HttpResponse.json({
      id: 123456,
      name: repo,
      full_name: `${owner}/${repo}`,
      description: 'A test repository',
      html_url: `https://github.com/${owner}/${repo}`,
      stargazers_count: 1234,
      watchers_count: 567,
      forks_count: 89,
      open_issues_count: 12,
      language: 'TypeScript',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      pushed_at: new Date().toISOString(),
    });
  }),

  /**
   * GitHub API - Get user info
   */
  http.get('https://api.github.com/users/:username', async ({ params }) => {
    await delay(200);

    const { username } = params;

    return HttpResponse.json({
      login: username,
      id: 789012,
      avatar_url: 'https://avatars.githubusercontent.com/u/789012?v=4',
      html_url: `https://github.com/${username}`,
      name: 'Test User',
      bio: 'Software developer and open source contributor',
      public_repos: 42,
      followers: 567,
      following: 123,
      created_at: '2020-01-01T00:00:00Z',
    });
  }),
];

/**
 * Error scenario handlers
 */
export const externalErrorHandlers = {
  /**
   * Supabase database connection error
   */
  supabaseConnectionError: http.get('https://*.supabase.co/rest/v1/:table', () => {
    return HttpResponse.json(
      {
        code: 'PGRST301',
        message: 'Database connection error',
        details: null,
        hint: null,
      },
      { status: 503 }
    );
  }),

  /**
   * Redis timeout
   */
  redisTimeout: http.get('https://*.upstash.io/get/:key', async () => {
    await delay('infinite');
    return HttpResponse.json({});
  }),

  /**
   * Resend API rate limit
   */
  resendRateLimit: http.post('https://api.resend.com/emails', () => {
    return HttpResponse.json(
      {
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      }
    );
  }),

  /**
   * GitHub API rate limit
   */
  githubRateLimit: http.get('https://api.github.com/:path*', () => {
    return HttpResponse.json(
      {
        message: 'API rate limit exceeded',
        documentation_url:
          'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting',
      },
      {
        status: 403,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
        },
      }
    );
  }),
};
