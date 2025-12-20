/**
 * Unit Tests for Changelog Entry API Route
 *
 * Tests the /api/content/changelog/[slug] endpoint which returns a changelog entry in LLMs.txt format.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import { createMockRequest, getResponseBody, expectStatus, expectCorsHeaders, expectCacheHeaders } from '../../../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache (Cache Components)
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  connection: vi.fn(async () => {}),
}));

// Mock data-layer services
const mockGetChangelogEntryLlmsTxt = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  AccountService: class {},
  ChangelogService: class {},
  CompaniesService: class {},
  ContentService: class {
    getChangelogEntryLlmsTxt = mockGetChangelogEntryLlmsTxt;
  },
  JobsService: class {},
  MiscService: class {},
  NewsletterService: class {},
  SearchService: class {},
  TrendingService: class {},
}));

// Mock service-factory (getService)
vi.mock('../../../../../../packages/web-runtime/src/data/service-factory', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    const { ContentService } = await import('@heyclaude/data-layer');
    if (serviceKey === 'content') {
      return new ContentService();
    }
    throw new Error(`Unknown service key: ${serviceKey}`);
  }),
}));

// Mock logging/server
vi.mock('../../../../../../packages/web-runtime/src/logging/server', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
  generateRequestId: vi.fn(() => 'test-request-id'),
  normalizeError: vi.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock server/api-helpers
vi.mock('../../../../../../packages/web-runtime/src/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  textResponse: vi.fn((text, status, corsHeaders, additionalHeaders) => {
    return new Response(text, {
      status,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
        ...additionalHeaders,
      },
    });
  }),
  badRequestResponse: vi.fn((message, corsHeaders) => {
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...(corsHeaders || {}),
        },
      }
    );
  }),
  handleOptionsRequest: vi.fn(() => {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
  buildSecurityHeaders: vi.fn(() => ({})),
}));

// Mock server/not-found-response
vi.mock('../../../../../../packages/web-runtime/src/server/not-found-response', () => ({
  notFoundResponse: vi.fn((message, resourceType) => {
    return new Response(
      JSON.stringify({
        error: message,
        resourceType,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
}));

// Mock auth (changelog entry route doesn't require auth)
vi.mock('../../../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/content/changelog/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetChangelogEntryLlmsTxt.mockResolvedValue('# Changelog Entry\n\n## [1.0.0] - 2025-01-11\n- Added feature');
  });

  it('should return changelog entry in llms format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    // Mock route params
    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(typeof body === 'string' || body === null).toBe(true);
    expect(mockGetChangelogEntryLlmsTxt).toHaveBeenCalledWith({ p_slug: '1-0-0-2025-01-11' });
  });

  it('should return changelog entry with default format when format is missing', async () => {
    // changelogEntryFormatSchema has a default value, so missing format is valid
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: {}, // No format - should default to 'llms-entry'
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(typeof body === 'string' || body === null).toBe(true);
    expect(mockGetChangelogEntryLlmsTxt).toHaveBeenCalledWith({ p_slug: '1-0-0-2025-01-11' });
  });

  it('should return 400 for invalid format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'json' }, // Invalid - must be 'llms-entry'
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetChangelogEntryLlmsTxt).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent changelog entry', async () => {
    mockGetChangelogEntryLlmsTxt.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/nonexistent',
      query: { format: 'llms-entry' },
    });

    const context = {
      params: Promise.resolve({ slug: 'nonexistent' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
  });

  it('should handle service errors gracefully', async () => {
    mockGetChangelogEntryLlmsTxt.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog/1-0-0-2025-01-11',
      query: { format: 'llms-entry' },
    });

    const context = {
      params: Promise.resolve({ slug: '1-0-0-2025-01-11' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
