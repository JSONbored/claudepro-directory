/**
 * Unit Tests for Category Content API Route
 *
 * Tests the /api/content/[category] endpoint which returns category content in multiple formats.
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

// Import prisma directly - don't use vi.importActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services
const mockGetCategoryContentList = vi.fn();
const mockGetCategoryLlmsTxt = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  ContentService: class {
    getCategoryContentList = mockGetCategoryContentList;
    getCategoryLlmsTxt = mockGetCategoryLlmsTxt;
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
vi.mock('../../../../../../packages/web-runtime/src/utils/category-validation', () => ({
  isValidCategory: vi.fn((category: string) => {
    const validCategories = ['agents', 'mcp', 'rules', 'skills'];
    return validCategories.includes(category.toLowerCase());
  }),
  VALID_CATEGORIES: ['agents', 'mcp', 'rules', 'skills'],
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

// Mock logger
vi.mock('../../../../../../packages/web-runtime/src/logging/server', () => ({
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
vi.mock('../../../../../../packages/web-runtime/src/server/api-helpers', () => ({
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
vi.mock('../../../../../../packages/web-runtime/src/api/route-factory', () => ({
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
      const format = url.searchParams.get('format') || 'json';
      const formatHandler = config.formats[format as keyof typeof config.formats];
      
      if (!formatHandler) {
        throw new Error(`Invalid format: ${format}`);
      }

      // Extract route params from context
      let routeParams: Record<string, string> = {};
      if (formatHandler.getRouteParams && context) {
        routeParams = await formatHandler.getRouteParams(context);
      }

      // Mock service call
      const { getService } = await import('@heyclaude/web-runtime/data/service-factory');
      const service = await getService(formatHandler.serviceKey);
      const methodArgs = formatHandler.methodArgs(format as any, {}, {}, routeParams);
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

describe('GET /api/content/[category]', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;
    
    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }
    
    vi.clearAllMocks();
    mockGetCategoryContentList.mockResolvedValue([
      { id: '1', title: 'Item 1', category: 'agents' },
      { id: '2', title: 'Item 2', category: 'agents' },
    ]);
    mockGetCategoryLlmsTxt.mockResolvedValue('# Agents\n\n## Item 1\n## Item 2');
  });

  it('should return JSON format for valid category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(mockGetCategoryContentList).toHaveBeenCalledWith({ p_category: 'agents' });
    expect(Array.isArray(body)).toBe(true);
  });

  it('should return LLMs format for valid category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents?format=llms-category',
    });

    const context = {
      params: Promise.resolve({ category: 'agents' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(mockGetCategoryLlmsTxt).toHaveBeenCalledWith({ p_category: 'agents' });
    expect(typeof body === 'string' || body === null).toBe(true);
  });

  it('should return 404 when category content not found', async () => {
    mockGetCategoryContentList.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
  });

  it('should return 404 when category LLMs not found', async () => {
    mockGetCategoryLlmsTxt.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents?format=llms-category',
    });

    const context = {
      params: Promise.resolve({ category: 'agents' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
  });

  it('should handle invalid category in route params', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/invalid?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'invalid' }),
    };

    // Factory will handle error and return 500 (methodArgs throws)
    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle missing route context', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents?format=json',
    });

    // Factory will handle error and return 500 (handler throws)
    const response = await GET(request, null);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should return 400 for invalid format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents?format=invalid',
    });

    const context = {
      params: Promise.resolve({ category: 'agents' }),
    };

    // Factory will handle validation and return 400
    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should handle service errors gracefully', async () => {
    mockGetCategoryContentList.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents' }),
    };

    // Factory will handle error and return 500
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
