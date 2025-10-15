/**
 * Content API Request Handlers
 *
 * Mocks for /api/[contentType]/route.ts endpoints.
 * Provides realistic responses for agents, mcp, rules, commands, hooks, statuslines.
 *
 * **Test Coverage:**
 * - Successful content retrieval
 * - Invalid content type (404)
 * - Rate limiting (429)
 * - Server errors (500)
 * - Cache headers validation
 *
 * @see src/app/api/[contentType]/route.ts
 */

import { delay, HttpResponse, http } from 'msw';
import {
  mockAgents,
  mockCommands,
  mockHooks,
  mockMcp,
  mockRules,
  mockStatuslines,
} from '../fixtures/content';

/**
 * Content type mapping (matches API route structure)
 */
const contentResponses = {
  'agents.json': { data: mockAgents, type: 'agent', key: 'agents' },
  'mcp.json': { data: mockMcp, type: 'mcp', key: 'mcp' },
  'commands.json': { data: mockCommands, type: 'command', key: 'commands' },
  'hooks.json': { data: mockHooks, type: 'hook', key: 'hooks' },
  'rules.json': { data: mockRules, type: 'rule', key: 'rules' },
  'statuslines.json': { data: mockStatuslines, type: 'statusline', key: 'statuslines' },
};

/**
 * Content API handlers
 */
export const contentHandlers = [
  /**
   * GET /api/all-configurations.json - Success
   * Returns all content types combined
   * NOTE: Must be before /:contentType to match first
   */
  http.get('http://localhost:3000/api/all-configurations.json', async () => {
    await delay(100);

    const totalCount =
      mockAgents.length +
      mockMcp.length +
      mockCommands.length +
      mockHooks.length +
      mockRules.length +
      mockStatuslines.length;

    return HttpResponse.json(
      {
        agents: mockAgents,
        mcp: mockMcp,
        commands: mockCommands,
        hooks: mockHooks,
        rules: mockRules,
        statuslines: mockStatuslines,
        totalCount,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  /**
   * GET /api/[contentType] - Success
   * Returns mock content data with proper structure
   */
  http.get('http://localhost:3000/api/:contentType', async ({ params }) => {
    const { contentType } = params;

    // Validate content type
    if (typeof contentType !== 'string' || !(contentType in contentResponses)) {
      return HttpResponse.json(
        {
          error: 'Content type not found',
          message: `Available content types: ${Object.keys(contentResponses).join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Simulate network delay (realistic behavior)
    await delay(50);

    const { data, type, key } = contentResponses[contentType as keyof typeof contentResponses];

    // Transform data to match API response structure
    const responseData = {
      [key]: data.map((item) => ({
        ...item,
        type,
        url: `https://claudepro.directory/${key}/${item.slug}`,
      })),
      count: data.length,
      lastUpdated: new Date().toISOString(),
    };

    return HttpResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
        'X-Cache': 'MISS',
        'Content-Type': 'application/json',
      },
    });
  }),
];

/**
 * Error scenario handlers (for negative testing)
 * Use server.use() to override default handlers in specific tests
 */
export const contentErrorHandlers = {
  /**
   * Simulate rate limiting (429)
   */
  rateLimitExceeded: http.get('http://localhost:3000/api/:contentType', () => {
    return HttpResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60,
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }),

  /**
   * Simulate server error (500)
   */
  serverError: http.get('http://localhost:3000/api/:contentType', () => {
    return HttpResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }),

  /**
   * Simulate network timeout
   */
  networkTimeout: http.get('http://localhost:3000/api/:contentType', async () => {
    await delay('infinite');
    return HttpResponse.json({});
  }),

  /**
   * Simulate empty response (cache invalidation scenarios)
   */
  emptyContent: http.get('http://localhost:3000/api/:contentType', () => {
    return HttpResponse.json({
      agents: [],
      count: 0,
      lastUpdated: new Date().toISOString(),
    });
  }),
};
