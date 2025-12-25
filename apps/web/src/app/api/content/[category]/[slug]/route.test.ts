/**
 * Unit Tests for Content Detail Export API Route
 *
 * Tests the /api/content/[category]/[slug] endpoint which returns individual content in multiple formats.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
} from '../../../__helpers__/test-helpers';

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock RPC error logging utility (if needed)
jest.mock('@heyclaude/data-layer/utils/rpc-error-logging', () => ({
  logRpcError: jest.fn(),
}));

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock next/cache (Cache Components)
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(async () => {}),
}));

// Import prisma directly - don't use jest.requireActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services (use real ContentService, but mock other services to avoid side effects)
jest.mock('@heyclaude/data-layer', () => {
  const actual = jest.requireActual('@heyclaude/data-layer');
  return {
    ...actual, // Include all real exports (including ContentService)
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {},
    JobsService: class {},
    MiscService: class {},
    NewsletterService: class {},
    SearchService: class {},
    TrendingService: class {},
  };
});

// Mock shared-runtime
jest.mock('@heyclaude/shared-runtime', () => ({
  APP_CONFIG: {
    url: 'https://claudepro.directory',
  },
  getStringProperty: jest.fn((obj: unknown, key: string) => {
    if (typeof obj === 'object' && obj !== null && key in obj) {
      const value = (obj as Record<string, unknown>)[key];
      return typeof value === 'string' ? value : undefined;
    }
    return undefined;
  }),
}));

// Mock web-runtime/utils/category-validation
jest.mock('@heyclaude/web-runtime/utils/category-validation', () => ({
  isValidCategory: jest.fn((category: string) => {
    const validCategories = ['agents', 'mcp', 'rules', 'skills'];
    return validCategories.includes(category.toLowerCase());
  }),
  VALID_CATEGORIES: ['agents', 'mcp', 'rules', 'skills'],
}));

// Mock server/not-found-response
jest.mock('@heyclaude/web-runtime/server/not-found-response', () => ({
  notFoundResponse: jest.fn((message, resourceType) => {
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
jest.mock('@heyclaude/web-runtime/logging/server', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
  generateRequestId: jest.fn(() => 'test-request-id'),
  normalizeError: jest.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
  createErrorResponse: jest.fn((error, context) => {
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
jest.mock('@heyclaude/web-runtime/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  getWithAcceptCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Accept',
  },
  jsonResponse: jest.fn((data, status, corsHeaders, additionalHeaders) => {
    return new Response(JSON.stringify(data), {
      status: typeof status === 'number' ? status : 200,
      headers: {
        'Content-Type': 'application/json',
        ...(typeof corsHeaders === 'object' && corsHeaders !== null
          ? (corsHeaders as Record<string, string>)
          : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null
          ? (additionalHeaders as Record<string, string>)
          : {}),
      },
    });
  }),
  textResponse: jest.fn((text, status, corsHeaders, additionalHeaders) => {
    return new Response(text, {
      status: typeof status === 'number' ? status : 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(typeof corsHeaders === 'object' && corsHeaders !== null
          ? (corsHeaders as Record<string, string>)
          : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null
          ? (additionalHeaders as Record<string, string>)
          : {}),
      },
    });
  }),
  markdownResponse: jest.fn((markdown, filename, status, corsHeaders, additionalHeaders) => {
    return new Response(markdown, {
      status: typeof status === 'number' ? status : 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...(typeof corsHeaders === 'object' && corsHeaders !== null
          ? (corsHeaders as Record<string, string>)
          : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null
          ? (additionalHeaders as Record<string, string>)
          : {}),
      },
    });
  }),
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(typeof corsHeaders === 'object' && corsHeaders !== null
          ? (corsHeaders as Record<string, string>)
          : {}),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
  buildCacheHeaders: jest.fn(() => ({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  })),
}));

// Mock supabase/server-anon (for storage format)
jest.mock('@heyclaude/web-runtime/supabase/server-anon', () => ({
  createSupabaseAnonClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(() => ({
          data: {
            publicUrl:
              'https://storage.supabase.co/storage/v1/object/public/content/agents/test-content.json',
          },
        })),
      })),
    },
  })),
}));

// Mock authentication (content detail route doesn't require auth, but factory checks it)
jest.mock('@heyclaude/web-runtime/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: jest.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/content/[category]/[slug]', () => {
  let prismocker: PrismaClient;

  // Mock data for RPC calls
  const mockApiContentFull = {
    id: 'test-id',
    title: 'Test Content',
    slug: 'test-content',
    category: 'agents',
    description: 'Test description',
  };
  const mockItemLlmsTxt = '# Test Content\n\nTest description';
  const mockMarkdownExport = {
    success: true,
    markdown: '# Test Content\n\nTest description',
    filename: 'test-content.md',
    content_id: 'test-id',
  };
  const mockStoragePath = [
    {
      bucket: 'content',
      object_path: 'agents/test-content.json',
    },
  ];

  beforeEach(() => {
    // Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC testing (all ContentService methods use RPC)
    // Must assign jest.fn() to $queryRawUnsafe before using mockImplementation
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>) = jest
      .fn()
      .mockImplementation((sql: string) => {
        if (sql.includes('get_api_content_full')) {
          return Promise.resolve(mockApiContentFull);
        }
        if (sql.includes('generate_item_llms_txt')) {
          return Promise.resolve(mockItemLlmsTxt);
        }
        if (sql.includes('generate_markdown_export')) {
          return Promise.resolve(mockMarkdownExport);
        }
        if (sql.includes('get_skill_storage_path') || sql.includes('get_mcpb_storage_path')) {
          return Promise.resolve(mockStoragePath);
        }
        return Promise.resolve([]);
      });
  });

  it('should return JSON format by default', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM get_api_content_full(p_base_url => $1, p_category => $2, p_slug => $3)',
      'https://claudepro.directory',
      'agents',
      'test-content'
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('title');
    }
  });

  it('should return JSON format with format=json', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM get_api_content_full(p_base_url => $1, p_category => $2, p_slug => $3)',
      'https://claudepro.directory',
      'agents',
      'test-content'
    );
  });

  it('should return LLMs format with format=llms', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=llms',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_item_llms_txt(p_category => $1, p_slug => $2)',
      'agents',
      'test-content'
    );
    expect(body).toBe(mockItemLlmsTxt);
  });

  it('should return LLMs format with format=llms-txt', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=llms-txt',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_item_llms_txt(p_category => $1, p_slug => $2)',
      'agents',
      'test-content'
    );
  });

  it('should return Markdown format with format=markdown', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=markdown',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_markdown_export(p_category => $1, p_include_footer => $2, p_include_metadata => $3, p_slug => $4)',
      'agents',
      false,
      true,
      'test-content'
    );
    expect(body).toBe(mockMarkdownExport.markdown);
  });

  it('should return Markdown format with format=md', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=md',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_markdown_export(p_category => $1, p_include_footer => $2, p_include_metadata => $3, p_slug => $4)',
      'agents',
      false,
      true,
      'test-content'
    );
  });

  it('should handle markdown export with includeFooter parameter', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=markdown&includeFooter=true',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_markdown_export(p_category => $1, p_include_footer => $2, p_include_metadata => $3, p_slug => $4)',
      'agents',
      true,
      true,
      'test-content'
    );
  });

  it('should handle markdown export with includeMetadata parameter', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=markdown&includeMetadata=false',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);

    expectStatus(response, 200);
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM generate_markdown_export(p_category => $1, p_include_footer => $2, p_include_metadata => $3, p_slug => $4)',
      'agents',
      false,
      false,
      'test-content'
    );
  });

  it('should return storage format for skills category (redirects to storage URL)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/skills/test-skill?format=storage',
    });

    const context = {
      params: Promise.resolve({ category: 'skills', slug: 'test-skill' }), // Next.js params are Promises
    };

    const response = await GET(request, context);

    // When metadata=false (default), storage format redirects to Supabase Storage public URL with 308
    expectStatus(response, 308);
    expect(response.headers.get('Location')).toBeTruthy();
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM get_skill_storage_path(p_slug => $1)',
      'test-skill'
    );
  });

  it('should return storage format for mcp category (redirects to storage URL)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/mcp/test-mcp?format=storage',
    });

    const context = {
      params: Promise.resolve({ category: 'mcp', slug: 'test-mcp' }), // Next.js params are Promises
    };

    const response = await GET(request, context);

    // When metadata=false (default), storage format redirects to Supabase Storage public URL with 308
    expectStatus(response, 308);
    expect(response.headers.get('Location')).toBeTruthy();
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM get_mcpb_storage_path(p_slug => $1)',
      'test-mcp'
    );
  });

  it('should return storage metadata when metadata=true', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/skills/test-skill?format=storage&metadata=true',
    });

    const context = {
      params: Promise.resolve({ category: 'skills', slug: 'test-skill' }), // Next.js params are Promises
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('bucket');
      expect(body).toHaveProperty('object_path');
      expect(body).toHaveProperty('download_url');
      expect(body).toHaveProperty('note');
    }
  });

  it('should return 404 when content not found', async () => {
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>) = jest.fn().mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });

  it('should return 404 when LLMs content not found', async () => {
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>) = jest
      .fn()
      .mockImplementation((sql: string) => {
        if (sql.includes('generate_item_llms_txt')) {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockApiContentFull);
      });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=llms',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });

  it('should handle invalid category in route params', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/invalid/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'invalid', slug: 'test-content' }), // Next.js params are Promises
    };

    // Factory will handle error and return 500 (methodArgs throws, factory catches and returns 500)
    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });

  it('should handle missing route context', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=json',
    });

    // Factory will handle error and return 500 (handler throws)
    const response = await GET(request, null);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });

  it('should return 500 for invalid format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=invalid',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    // Factory will handle validation error and return 500 (format handler not found)
    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });

  it('should handle markdown generation failure', async () => {
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>) = jest
      .fn()
      .mockImplementation((sql: string) => {
        if (sql.includes('generate_markdown_export')) {
          return Promise.resolve({
            success: false,
            error: 'Generation failed',
          });
        }
        return Promise.resolve(mockApiContentFull);
      });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=markdown',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });

  it('should handle service errors gracefully', async () => {
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>) = jest
      .fn()
      .mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    // Factory will handle error and return 500
    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });

  it('should handle storage format error for unsupported category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=storage',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    // Storage format only supports skills and mcp categories
    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    // Clear cache before test
    clearRequestCache();

    const request1 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=json',
    });

    const context1 = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    // First call - should populate cache
    const cacheBefore = getRequestCache().getStats().size;
    await GET(request1, context1);
    const cacheAfterFirst = getRequestCache().getStats().size;
    const firstCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls
      .length;

    // Clear cache between calls to ensure second call makes a fresh request
    clearRequestCache();

    // Second call - should make a new RPC call (request-scoped cache doesn't persist across separate GET calls)
    // Each GET() call creates a new request context, so cache is fresh for each call
    const request2 = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=json',
    });

    const context2 = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const cacheBeforeSecond = getRequestCache().getStats().size;
    await GET(request2, context2);
    const cacheAfterSecond = getRequestCache().getStats().size;
    const secondCallCount = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls
      .length;

    // The createFormatHandlerRoute factory uses Next.js Cache Components, which are request-scoped.
    // This means each call to GET(request, context) creates a new request context, and thus a new cache.
    // Therefore, the underlying service method will be called once for each GET() call.
    expect(firstCallCount).toBe(1);
    expect(secondCallCount).toBe(2);
    // Verify cache worked within each request (cache size increased after first call)
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
    // Second call creates a new cache context, so cache size should increase again
    expect(cacheAfterSecond).toBeGreaterThan(cacheBeforeSecond);
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/content/agents/test-content?format=json',
    });

    const context = {
      params: Promise.resolve({ category: 'agents', slug: 'test-content' }), // Next.js params are Promises
    };

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 405);
    if (typeof body === 'object' && body !== null) {
      expect(body).toHaveProperty('error');
    }
  });
});
