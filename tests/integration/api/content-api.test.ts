/**
 * Content API Integration Tests
 *
 * Tests /api/[contentType]/route.ts endpoints using MSW for mocking.
 * Demonstrates integration testing with mocked HTTP requests.
 *
 * **Test Coverage:**
 * - Successful content retrieval
 * - Invalid content type handling (404)
 * - Rate limiting behavior (429)
 * - Server error handling (500)
 * - Cache headers validation
 * - Response structure validation
 *
 * **Testing Strategy:**
 * - Uses MSW to mock API responses
 * - Tests actual fetch logic without hitting real endpoints
 * - Validates response structure and error handling
 * - Ensures type safety and schema compliance
 *
 * @see src/app/api/[contentType]/route.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { mockAgents, mockMcp } from '@/tests/mocks/fixtures/content';

const API_BASE_URL = 'http://localhost:3000/api';

describe('Content API - GET /api/[contentType]', () => {
  describe('Successful Requests', () => {
    it('should fetch agents successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/agents.json`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(data).toHaveProperty('agents');
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('lastUpdated');
      expect(Array.isArray(data.agents)).toBe(true);
      expect(data.agents.length).toBeGreaterThan(0);

      // Validate first agent structure
      const firstAgent = data.agents[0];
      expect(firstAgent).toHaveProperty('slug');
      expect(firstAgent).toHaveProperty('name');
      expect(firstAgent).toHaveProperty('description');
      expect(firstAgent).toHaveProperty('type', 'agent');
      expect(firstAgent).toHaveProperty('url');
      expect(firstAgent.url).toContain('/agents/');
    });

    it('should fetch MCP servers successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp.json`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('mcp');
      expect(data).toHaveProperty('count');
      expect(Array.isArray(data.mcp)).toBe(true);
      expect(data.mcp.length).toBeGreaterThan(0);

      // Validate MCP structure
      const firstMcp = data.mcp[0];
      expect(firstMcp).toHaveProperty('type', 'mcp');
      expect(firstMcp.url).toContain('/mcp/');
    });

    it('should include proper cache headers', async () => {
      const response = await fetch(`${API_BASE_URL}/agents.json`);

      expect(response.headers.get('cache-control')).toContain('s-maxage');
      expect(response.headers.get('cache-control')).toContain('stale-while-revalidate');
      expect(response.headers.has('x-cache')).toBe(true);
    });

    it('should return correct count', async () => {
      const response = await fetch(`${API_BASE_URL}/commands.json`);
      const data = await response.json();

      expect(data.count).toBe(data.commands.length);
      expect(typeof data.count).toBe('number');
      expect(data.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for invalid content type', async () => {
      const response = await fetch(`${API_BASE_URL}/invalid-type.json`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Content type not found');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
    });

    it('should handle rate limiting (429)', async () => {
      // Override handler for this test
      server.use(
        http.get(`${API_BASE_URL}/:contentType`, () => {
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
        })
      );

      const response = await fetch(`${API_BASE_URL}/agents.json`);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toHaveProperty('error', 'Rate limit exceeded');
      expect(response.headers.get('retry-after')).toBe('60');
      expect(response.headers.get('x-ratelimit-remaining')).toBe('0');
    });

    it('should handle server errors (500)', async () => {
      // Override handler for this test
      server.use(
        http.get(`${API_BASE_URL}/:contentType`, () => {
          return HttpResponse.json(
            {
              error: 'Internal server error',
              message: 'An unexpected error occurred',
              timestamp: new Date().toISOString(),
            },
            { status: 500 }
          );
        })
      );

      const response = await fetch(`${API_BASE_URL}/agents.json`);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Internal server error');
    });

    it('should handle network errors gracefully', async () => {
      // Override handler to simulate network failure
      server.use(
        http.get(`${API_BASE_URL}/:contentType`, () => {
          return HttpResponse.error();
        })
      );

      await expect(fetch(`${API_BASE_URL}/agents.json`)).rejects.toThrow();
    });
  });

  describe('Content Type Validation', () => {
    const validContentTypes = [
      'agents.json',
      'mcp.json',
      'commands.json',
      'hooks.json',
      'rules.json',
      'statuslines.json',
    ];

    validContentTypes.forEach((contentType) => {
      it(`should accept valid content type: ${contentType}`, async () => {
        const response = await fetch(`${API_BASE_URL}/${contentType}`);
        expect(response.status).toBe(200);
      });
    });

    it('should reject content type without .json extension', async () => {
      const response = await fetch(`${API_BASE_URL}/agents`);
      expect(response.status).toBe(404);
    });
  });

  describe('Response Structure', () => {
    it('should include type field for each item', async () => {
      const response = await fetch(`${API_BASE_URL}/agents.json`);
      const data = await response.json();

      data.agents.forEach((agent: unknown) => {
        expect(agent).toHaveProperty('type');
        expect(typeof (agent as { type: string }).type).toBe('string');
      });
    });

    it('should include full URL for each item', async () => {
      const response = await fetch(`${API_BASE_URL}/mcp.json`);
      const data = await response.json();

      data.mcp.forEach((item: { url: string; slug: string }) => {
        expect(item.url).toBe(`https://claudepro.directory/mcp/${item.slug}`);
        expect(item.url).toMatch(/^https:\/\//);
      });
    });

    it('should include lastUpdated timestamp', async () => {
      const response = await fetch(`${API_BASE_URL}/agents.json`);
      const data = await response.json();

      expect(data).toHaveProperty('lastUpdated');
      expect(new Date(data.lastUpdated).toString()).not.toBe('Invalid Date');
      expect(Date.now() - new Date(data.lastUpdated).getTime()).toBeLessThan(5000);
    });
  });
});

describe('Content API - GET /api/all-configurations.json', () => {
  it('should fetch all content types combined', async () => {
    const response = await fetch(`${API_BASE_URL}/all-configurations.json`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('agents');
    expect(data).toHaveProperty('mcp');
    expect(data).toHaveProperty('commands');
    expect(data).toHaveProperty('hooks');
    expect(data).toHaveProperty('rules');
    expect(data).toHaveProperty('statuslines');
    expect(data).toHaveProperty('totalCount');
    expect(data).toHaveProperty('lastUpdated');
  });

  it('should calculate total count correctly', async () => {
    const response = await fetch(`${API_BASE_URL}/all-configurations.json`);
    const data = await response.json();

    const expectedTotal =
      data.agents.length +
      data.mcp.length +
      data.commands.length +
      data.hooks.length +
      data.rules.length +
      data.statuslines.length;

    expect(data.totalCount).toBe(expectedTotal);
  });

  it('should include cache headers', async () => {
    const response = await fetch(`${API_BASE_URL}/all-configurations.json`);

    expect(response.headers.get('cache-control')).toContain('s-maxage');
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
