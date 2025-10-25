/**
 * Content API Request Handlers
 *
 * Mock handlers for content endpoints (/api/agents.json, /api/mcp.json, etc.).
 * Provides realistic responses using fixtures for deterministic testing.
 *
 * **Test Coverage:**
 * - Content retrieval by category (agents, mcp, commands, hooks, rules, statuslines)
 * - All configurations endpoint
 * - Error scenarios (rate limiting, server errors, empty content)
 *
 * @see src/app/api directory
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
 * Content API handlers
 */
export const contentHandlers = [
  /**
   * GET /api/agents.json - Fetch all agents
   */
  http.get('http://localhost:3000/api/agents.json', async () => {
    await delay(100);

    return HttpResponse.json({
      agents: mockAgents,
      count: mockAgents.length,
      lastUpdated: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/mcp.json - Fetch all MCP servers
   */
  http.get('http://localhost:3000/api/mcp.json', async () => {
    await delay(100);

    return HttpResponse.json({
      mcp: mockMcp,
      count: mockMcp.length,
      lastUpdated: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/commands.json - Fetch all commands
   */
  http.get('http://localhost:3000/api/commands.json', async () => {
    await delay(100);

    return HttpResponse.json({
      commands: mockCommands,
      count: mockCommands.length,
      lastUpdated: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/hooks.json - Fetch all hooks
   */
  http.get('http://localhost:3000/api/hooks.json', async () => {
    await delay(100);

    return HttpResponse.json({
      hooks: mockHooks,
      count: mockHooks.length,
      lastUpdated: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/rules.json - Fetch all rules
   */
  http.get('http://localhost:3000/api/rules.json', async () => {
    await delay(100);

    return HttpResponse.json({
      rules: mockRules,
      count: mockRules.length,
      lastUpdated: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/statuslines.json - Fetch all statuslines
   */
  http.get('http://localhost:3000/api/statuslines.json', async () => {
    await delay(100);

    return HttpResponse.json({
      statuslines: mockStatuslines,
      count: mockStatuslines.length,
      lastUpdated: new Date().toISOString(),
    });
  }),

  /**
   * GET /api/all-configurations.json - Fetch all content combined
   */
  http.get('http://localhost:3000/api/all-configurations.json', async () => {
    await delay(200);

    return HttpResponse.json({
      agents: mockAgents,
      mcp: mockMcp,
      commands: mockCommands,
      hooks: mockHooks,
      rules: mockRules,
      statuslines: mockStatuslines,
      totalCount:
        mockAgents.length +
        mockMcp.length +
        mockCommands.length +
        mockHooks.length +
        mockRules.length +
        mockStatuslines.length,
      lastUpdated: new Date().toISOString(),
    });
  }),
];

/**
 * Error scenario handlers for content endpoints
 * Use these in tests to simulate failures
 */
export const contentErrorHandlers = {
  /**
   * Rate limit exceeded (429)
   */
  rateLimitExceeded: http.get('http://localhost:3000/api/:contentType.json', () => {
    return HttpResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60,
      },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      }
    );
  }),

  /**
   * Server error (500)
   */
  serverError: http.get('http://localhost:3000/api/:contentType.json', () => {
    return HttpResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }),

  /**
   * Network timeout (simulated)
   */
  networkTimeout: http.get('http://localhost:3000/api/:contentType.json', async () => {
    // Delay longer than typical timeout
    await delay(10000);

    return HttpResponse.json({
      error: 'Timeout',
      message: 'Request timed out',
    });
  }),

  /**
   * Empty content response (200 but no data)
   */
  emptyContent: http.get('http://localhost:3000/api/:contentType.json', () => {
    return HttpResponse.json({
      agents: [],
      mcp: [],
      commands: [],
      hooks: [],
      rules: [],
      statuslines: [],
      count: 0,
      lastUpdated: new Date().toISOString(),
    });
  }),

  /**
   * Malformed JSON response
   */
  malformedJson: http.get('http://localhost:3000/api/:contentType.json', () => {
    return new HttpResponse('{ invalid json }', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),

  /**
   * Network error (complete failure)
   */
  networkError: http.get('http://localhost:3000/api/:contentType.json', () => {
    return HttpResponse.error();
  }),
};
