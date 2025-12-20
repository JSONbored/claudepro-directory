/**
 * Unit Tests for Sitewide Content API Route
 *
 * Tests the /api/content/sitewide endpoint which serves sitewide content in multiple formats.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
} from '../../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  connection: vi.fn(() => Promise.resolve()),
}));

// Mock next/server
vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    connection: vi.fn(async () => {}),
  };
});

// Mock data-layer services
const mockGetSitewideContentList = vi.fn();
const mockGetSitewideLlmsTxt = vi.fn();
const mockGetSitewideReadme = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  ContentService: class {
    getSitewideContentList = mockGetSitewideContentList;
    getSitewideLlmsTxt = mockGetSitewideLlmsTxt;
    getSitewideReadme = mockGetSitewideReadme;
  },
}));

// Mock service-factory
vi.mock('../../../../../packages/web-runtime/src/data/service-factory', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    const { ContentService } = await import('@heyclaude/data-layer');
    if (serviceKey === 'content') {
      return new ContentService();
    }
    throw new Error(`Unknown service key: ${serviceKey}`);
  }),
}));

// Mock logger
vi.mock('../../../../../packages/web-runtime/src/logging/server', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  generateRequestId: vi.fn(() => 'test-request-id'),
  normalizeError: vi.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
  createErrorResponse: vi.fn((error, context) => {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
}));

// Mock server/api-helpers
vi.mock('../../../../../packages/web-runtime/src/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  jsonResponse: vi.fn((data, status, corsHeaders, additionalHeaders) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...additionalHeaders,
      },
    });
  }),
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
  handleOptionsRequest: vi.fn((corsHeaders) => {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
}));

// Mock api/route-factory
vi.mock('../../../../../packages/web-runtime/src/api/route-factory', () => ({
  createApiRoute: vi.fn((config) => {
    return async (request: Request, context?: unknown) => {
      return await config.handler({
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
        },
        request: request as any,
        nextContext: context,
        query: Object.fromEntries(new URL(request.url).searchParams),
        body: await request.json().catch(() => ({})),
      });
    };
  }),
  createFormatHandlerRoute: vi.fn((config) => {
    return async (request: Request, context?: unknown) => {
      const url = new URL(request.url);
      const format = url.searchParams.get('format') || config.defaultFormat || 'llms-txt';
      const formatHandler = config.formats[format as keyof typeof config.formats];
      
      if (!formatHandler) {
        throw new Error(`Invalid format: ${format}`);
      }

      // Mock service call
      const { getService } = await import('../../../../../packages/web-runtime/src/data/service-factory');
      const service = await getService(formatHandler.serviceKey);
      const methodArgs = formatHandler.methodArgs(format as any, {}, {}, {});
      const result = await (service as any)[formatHandler.methodName](...methodArgs);

      // Call response handler
      return await formatHandler.responseHandler(
        result,
        format as any,
        {},
        {},
        {
          logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
          },
          request: request as any,
          nextContext: context,
        }
      );
    };
  }),
  createOptionsHandler: vi.fn(() => {
    return async () => {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      });
    };
  }),
}));

describe('GET /api/content/sitewide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSitewideLlmsTxt.mockResolvedValue('# Sitewide Content\n\n## Skills\n- Example');
    mockGetSitewideContentList.mockResolvedValue([
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' },
    ]);
    mockGetSitewideReadme.mockResolvedValue({
      categories: [{ name: 'Skills', count: 10 }],
      total_count: 100,
    });
  });

  it('should return LLMs format by default', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/sitewide',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(mockGetSitewideLlmsTxt).toHaveBeenCalled();
  });

  it('should return LLMs format with format=llms-txt', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/sitewide?format=llms-txt',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(mockGetSitewideLlmsTxt).toHaveBeenCalled();
  });

  it('should return LLMs format with format=llms', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/sitewide?format=llms',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(mockGetSitewideLlmsTxt).toHaveBeenCalled();
  });

  it('should return JSON format with format=json', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/sitewide?format=json',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(mockGetSitewideContentList).toHaveBeenCalledWith({ p_limit: 5000 });
    expect(Array.isArray(body)).toBe(true);
  });

  it('should return README format with format=readme', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/sitewide?format=readme',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(mockGetSitewideReadme).toHaveBeenCalled();
    expect(body).toHaveProperty('categories');
    expect(body).toHaveProperty('total_count');
  });

  it('should handle null LLMs result', async () => {
    mockGetSitewideLlmsTxt.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/sitewide?format=llms-txt',
    });

    // Factory will handle error and return 500
    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should return 400 for invalid format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/sitewide?format=invalid',
    });

    // Factory will handle validation and return 400
    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should handle service errors gracefully', async () => {
    mockGetSitewideLlmsTxt.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/sitewide',
    });

    // Factory will handle error and return 500
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
