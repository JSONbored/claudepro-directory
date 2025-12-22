/**
 * Unit Tests for Content Detail Export API Route
 *
 * Tests the /api/content/[category]/[slug] endpoint which returns individual content in multiple formats.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
} from '../../../__helpers__/test-helpers';

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
    NextResponse: class NextResponse extends Response {
      static json = vi.fn((data: unknown, init?: ResponseInit) => {
        return new Response(JSON.stringify(data), {
          status: init?.status || 200,
          headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
        });
      });
      static redirect = vi.fn((url: string) => new Response(null, { status: 302, headers: { Location: url } }));
    },
  };
});

// Mock data-layer services
// Import prisma directly - don't use vi.importActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

const mockGetApiContentFull = vi.fn();
const mockGetItemLlmsTxt = vi.fn();
const mockGenerateMarkdownExport = vi.fn();
const mockGetStoragePath = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  ContentService: class {
    getApiContentFull = mockGetApiContentFull;
    getItemLlmsTxt = mockGetItemLlmsTxt;
    generateMarkdownExport = mockGenerateMarkdownExport;
    getStoragePath = mockGetStoragePath;
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

// Mock shared-runtime
vi.mock('@heyclaude/shared-runtime', () => ({
  APP_CONFIG: {
    url: 'https://claudepro.directory',
  },
  getStringProperty: vi.fn((obj: unknown, key: string) => {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      const value = (obj as Record<string, unknown>)[key];
      return typeof value === 'string' ? value : undefined;
    }
    return undefined;
  }),
}));

// Mock web-runtime/utils/category-validation
vi.mock('../../../../../../../packages/web-runtime/src/utils/category-validation', () => ({
  isValidCategory: vi.fn((category: string) => {
    const validCategories = ['agents', 'mcp', 'rules', 'skills'];
    return validCategories.includes(category.toLowerCase());
  }),
  VALID_CATEGORIES: ['agents', 'mcp', 'rules', 'skills'],
}));

// Mock server/not-found-response
vi.mock('../../../../../../../packages/web-runtime/src/server/not-found-response', () => ({
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
vi.mock('../../../../../../../packages/web-runtime/src/logging/server', () => ({
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
vi.mock('../../../../../../../packages/web-runtime/src/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  getWithAcceptCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Accept',
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
  markdownResponse: vi.fn((markdown, filename, status, corsHeaders, additionalHeaders) => {
    return new Response(markdown, {
      status,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
vi.mock('../../../../../../../packages/web-runtime/src/api/route-factory', () => ({
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
  createOptionsHandler: vi.fn((cors: string) => {
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
  createFormatHandlerRoute: vi.fn((config) => {
    return async (request: Request, context?: unknown) => {
      try {
        const url = new URL(request.url);
        const format = url.searchParams.get('format') || 'json';
        const formatHandler = config.formats[format as keyof typeof config.formats];
        
        if (!formatHandler) {
          throw new Error(`Invalid format: ${format}`);
        }

        // Extract route params from context
        let routeParams: Record<string, string> = {};
        if (formatHandler.getRouteParams && context) {
          // getRouteParams throws for invalid categories - factory catches and returns 500
          routeParams = await formatHandler.getRouteParams(context);
        }

        // Mock service call
        const { getService } = await import('@heyclaude/web-runtime/data/service-factory');
        const service = await getService(formatHandler.serviceKey);
        const query = Object.fromEntries(url.searchParams);
        const methodArgs = formatHandler.methodArgs(format as any, query, {}, routeParams);
        const result = await (service as any)[formatHandler.methodName](...methodArgs);

        // Call response handler
        return await formatHandler.responseHandler(
          result,
          format as any,
          query,
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
      } catch (error) {
        // Factory catches errors and returns 500
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    };
  }),
}));

describe('GET /api/content/[category]/[slug]', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;
    
    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }
    
    vi.clearAllMocks();
    mockGetApiContentFull.mockResolvedValue({
      id: 'test-id',
      title: 'Test Content',
      slug: 'test-content',
      category: 'agents',
      description: 'Test description',
    });
    mockGetItemLlmsTxt.mockResolvedValue('# Test Content\n\nTest description');
    mockGenerateMarkdownExport.mockResolvedValue({
      success: true,
      markdown: '# Test Content\n\nTest description',
      filename: 'test-content.md',
      content_id: 'test-id',
    });
    mockGetStoragePath.mockResolvedValue([{
      bucket: 'content',
      object_path: 'agents/test-content.json',
    }]);
  });

  it('should return JSON format by default', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(mockGetApiContentFull).toHaveBeenCalledWith({
      p_base_url: 'https://claudepro.directory',
      p_category: 'agents',
      p_slug: 'test-content',
    });
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('title');
  });

  it('should return JSON format with format=json', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(mockGetApiContentFull).toHaveBeenCalled();
  });

  it('should return LLMs format with format=llms', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=llms',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(mockGetItemLlmsTxt).toHaveBeenCalledWith({
      p_category: 'agents',
      p_slug: 'test-content',
    });
  });

  it('should return LLMs format with format=llms-txt', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=llms-txt',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(mockGetItemLlmsTxt).toHaveBeenCalled();
  });

  it('should return Markdown format with format=markdown', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=markdown',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(mockGenerateMarkdownExport).toHaveBeenCalledWith({
      p_category: 'agents',
      p_slug: 'test-content',
      p_include_footer: false,
      p_include_metadata: true,
    });
  });

  it('should return Markdown format with format=md', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=md',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(mockGenerateMarkdownExport).toHaveBeenCalled();
  });

  it('should handle markdown export with includeFooter parameter', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=markdown&includeFooter=true',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(mockGenerateMarkdownExport).toHaveBeenCalledWith(
      expect.objectContaining({
        p_include_footer: true,
      })
    );
  });

  it('should handle markdown export with includeMetadata parameter', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=markdown&includeMetadata=false',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(mockGenerateMarkdownExport).toHaveBeenCalledWith(
      expect.objectContaining({
        p_include_metadata: false,
      })
    );
  });

  it('should return 404 when content not found', async () => {
    mockGetApiContentFull.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
  });

  it('should return 404 when LLMs content not found', async () => {
    mockGetItemLlmsTxt.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=llms',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
  });

  it('should handle invalid category in route params', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/invalid/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'invalid', slug: 'test-content' }),
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
      url: 'http://localhost:3000/api/content/agents/test-content?format=json',
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
      url: 'http://localhost:3000/api/content/agents/test-content?format=invalid',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    // Factory will handle validation and return 400
    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should handle markdown generation failure', async () => {
    mockGenerateMarkdownExport.mockResolvedValue({
      success: false,
      error: 'Generation failed',
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=markdown',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should handle service errors gracefully', async () => {
    mockGetApiContentFull.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/content/agents/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }),
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
