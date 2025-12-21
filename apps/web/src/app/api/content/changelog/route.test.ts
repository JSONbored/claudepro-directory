/**
 * Unit Tests for Changelog Index API Route
 *
 * Tests the /api/content/changelog endpoint which returns changelog in LLMs.txt format.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import { createMockRequest, getResponseBody, expectStatus, expectCorsHeaders, expectCacheHeaders } from '../../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache (Cache Components)
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  connection: vi.fn(async () => {}),
}));

// Mock data-layer services
const mockGetChangelogLlmsTxt = vi.fn();

vi.mock('@heyclaude/data-layer', async () => {
  const actual = await vi.importActual<typeof import('@heyclaude/data-layer')>('@heyclaude/data-layer');
  return {
    ...actual,
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {},
    ContentService: class {
      getChangelogLlmsTxt = mockGetChangelogLlmsTxt;
    },
    JobsService: class {},
    MiscService: class {},
    NewsletterService: class {},
    SearchService: class {},
    TrendingService: class {},
  };
});

// Mock service-factory (getService)
vi.mock('../../../../../packages/web-runtime/src/data/service-factory', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    const { ContentService } = await import('@heyclaude/data-layer');
    if (serviceKey === 'content') {
      return new ContentService();
    }
    throw new Error(`Unknown service key: ${serviceKey}`);
  }),
}));

// Mock logging/server
vi.mock('../../../../../packages/web-runtime/src/logging/server', () => ({
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
vi.mock('../../../../../packages/web-runtime/src/server/api-helpers', () => ({
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

// Mock auth (changelog route doesn't require auth)
vi.mock('@heyclaude/web-runtime/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/content/changelog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetChangelogLlmsTxt.mockResolvedValue('# Changelog\n\n## [1.0.0] - 2025-01-11\n- Added new feature');
  });

  it('should return changelog in llms format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(typeof body === 'string' || body === null).toBe(true);
    expect(mockGetChangelogLlmsTxt).toHaveBeenCalledWith();
  });

  it('should return changelog with default format when format is missing', async () => {
    // changelogFormatSchema has a default value, so missing format is valid
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: {}, // No format - should default to 'llms-changelog'
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(typeof body === 'string' || body === null).toBe(true);
    expect(mockGetChangelogLlmsTxt).toHaveBeenCalledWith();
  });

  it('should return 400 for invalid format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'json' }, // Invalid - must be 'llms-changelog'
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockGetChangelogLlmsTxt).not.toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    mockGetChangelogLlmsTxt.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/changelog',
      query: { format: 'llms-changelog' },
    });

    const response = await GET(request);
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
