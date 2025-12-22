/**
 * Unit Tests for Feeds API Route
 *
 * Tests the /api/feeds endpoint which generates RSS or Atom feeds.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
} from '../__helpers__/test-helpers';

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

// Import prisma directly - don't use vi.importActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services
const mockGenerateContentRssFeed = vi.fn();
const mockGenerateContentAtomFeed = vi.fn();
const mockGenerateChangelogRssFeed = vi.fn();
const mockGenerateChangelogAtomFeed = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  ContentService: class {
    generateContentRssFeed = mockGenerateContentRssFeed;
    generateContentAtomFeed = mockGenerateContentAtomFeed;
    generateChangelogRssFeed = mockGenerateChangelogRssFeed;
    generateChangelogAtomFeed = mockGenerateChangelogAtomFeed;
  },
}));

// Mock service-factory
vi.mock('@heyclaude/web-runtime/data/service-factory', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    const { ContentService } = await import('@heyclaude/data-layer');
    if (serviceKey === 'content') {
      return new ContentService();
    }
    throw new Error(`Unknown service key: ${serviceKey}`);
  }),
}));

// Mock web-runtime/utils/category-validation
vi.mock('../../../../../packages/web-runtime/src/utils/category-validation', () => ({
  isValidCategory: vi.fn((category: string) => {
    const validCategories = ['agents', 'mcp', 'rules', 'skills'];
    return validCategories.includes(category.toLowerCase());
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
  xmlResponse: vi.fn((xml, contentType, status, corsHeaders, additionalHeaders) => {
    return new Response(xml, {
      status,
      headers: {
        'Content-Type': contentType,
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
      const type = url.searchParams.get('type') || config.defaultFormat || 'rss';
      const category = url.searchParams.get('category') || null;
      const formatHandler = config.formats[type as keyof typeof config.formats];
      
      if (!formatHandler) {
        throw new Error(`Invalid type: ${type}`);
      }

      // Mock service call
      const { getService } = await import('@heyclaude/web-runtime/data/service-factory');
      const service = await getService(formatHandler.serviceKey);
      const methodArgs = formatHandler.methodArgs(type as any, { category, type }, {}, {});
      const result = await (service as any)[formatHandler.methodName](...methodArgs);

      // For changelog feeds, handleFeedResponse calls service again
      if (category === 'changelog') {
        const changelogMethod = type === 'rss' ? 'generateChangelogRssFeed' : 'generateChangelogAtomFeed';
        const changelogResult = await (service as any)[changelogMethod]({ p_limit: 50 });
        return await formatHandler.responseHandler(
          changelogResult,
          type as any,
          { category, type },
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
      }

      // Call response handler
      return await formatHandler.responseHandler(
        result,
        type as any,
        { category, type },
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

describe('GET /api/feeds', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;
    
    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }
    
    vi.clearAllMocks();
    mockGenerateContentRssFeed.mockResolvedValue('<?xml version="1.0"?><rss>...</rss>');
    mockGenerateContentAtomFeed.mockResolvedValue('<?xml version="1.0"?><feed>...</feed>');
    mockGenerateChangelogRssFeed.mockResolvedValue('<?xml version="1.0"?><rss>...</rss>');
    mockGenerateChangelogAtomFeed.mockResolvedValue('<?xml version="1.0"?><feed>...</feed>');
  });

  it('should return RSS feed by default', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/feeds',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('application/rss+xml');
    expect(mockGenerateContentRssFeed).toHaveBeenCalled();
  });

  it('should return RSS feed with type=rss', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/feeds?type=rss',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/rss+xml');
    expect(mockGenerateContentRssFeed).toHaveBeenCalled();
  });

  it('should return Atom feed with type=atom', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/feeds?type=atom',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/atom+xml');
    expect(mockGenerateContentAtomFeed).toHaveBeenCalled();
  });

  it('should filter by category when provided', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/feeds?type=rss&category=agents',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockGenerateContentRssFeed).toHaveBeenCalledWith(
      expect.objectContaining({ p_category: 'agents', p_limit: 50 })
    );
  });

  it('should return changelog RSS feed when category=changelog', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/feeds?type=rss&category=changelog',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/rss+xml');
    expect(mockGenerateChangelogRssFeed).toHaveBeenCalled();
  });

  it('should return changelog Atom feed when category=changelog', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/feeds?type=atom&category=changelog',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/atom+xml');
    expect(mockGenerateChangelogAtomFeed).toHaveBeenCalled();
  });

  it('should return 400 for invalid type', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/feeds?type=invalid',
    });

    // Factory will handle validation and return 400
    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should handle service errors gracefully', async () => {
    mockGenerateContentRssFeed.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/feeds?type=rss',
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
