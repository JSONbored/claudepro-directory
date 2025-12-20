/**
 * Unit Tests for Revalidate API Route
 *
 * Tests the /api/revalidate endpoint which triggers on-demand ISR revalidation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
} from '../__helpers__/test-helpers';
import { revalidatePath, revalidateTag } from 'next/cache';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
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

// Mock shared-runtime/schemas/env
vi.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    REVALIDATE_SECRET: 'test-secret',
  },
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
  unauthorizedResponse: vi.fn((message, authInfo, corsHeaders) => {
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }),
  handleOptionsRequest: vi.fn((corsHeaders) => {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        body: await request.json().catch(() => ({})),
      });
    };
  }),
  createOptionsHandler: vi.fn(() => {
    return async () => {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      });
    };
  }),
}));

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 when revalidation succeeds with category', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/revalidate',
      body: {
        secret: 'test-secret',
        category: 'agents',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('revalidated', true);
    expect(body).toHaveProperty('paths');
    expect((body as { paths: string[] }).paths).toContain('/');
    expect((body as { paths: string[] }).paths).toContain('/agents');
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/agents');
  });

  it('should return 200 when revalidation succeeds with category and slug', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/revalidate',
      body: {
        secret: 'test-secret',
        category: 'agents',
        slug: 'code-reviewer',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('revalidated', true);
    expect((body as { paths: string[] }).paths).toContain('/agents/code-reviewer');
    expect(revalidatePath).toHaveBeenCalledWith('/agents/code-reviewer');
  });

  it('should return 200 when revalidation succeeds with tags', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/revalidate',
      body: {
        secret: 'test-secret',
        tags: ['content', 'homepage', 'trending'],
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('revalidated', true);
    expect(body).toHaveProperty('tags');
    expect((body as { tags: string[] }).tags).toEqual(['content', 'homepage', 'trending']);
    expect(revalidateTag).toHaveBeenCalledWith('content', 'max');
    expect(revalidateTag).toHaveBeenCalledWith('homepage', 'max');
    expect(revalidateTag).toHaveBeenCalledWith('trending', 'max');
  });

  it('should return 200 when revalidation succeeds with both category and tags', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/revalidate',
      body: {
        secret: 'test-secret',
        category: 'agents',
        slug: 'code-reviewer',
        tags: ['content', 'homepage'],
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('revalidated', true);
    expect(body).toHaveProperty('paths');
    expect(body).toHaveProperty('tags');
    expect(revalidatePath).toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalled();
  });

  it('should return 401 when secret is missing', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/revalidate',
      body: {
        category: 'agents',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 401);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('should return 401 when secret is invalid', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/revalidate',
      body: {
        secret: 'wrong-secret',
        category: 'agents',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 401);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('should return 500 when neither category nor tags provided', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/revalidate',
      body: {
        secret: 'test-secret',
      },
    });

    // Factory will handle error and return 500
    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should include timestamp in response', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/revalidate',
      body: {
        secret: 'test-secret',
        category: 'agents',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('timestamp');
    expect(typeof (body as { timestamp: string }).timestamp).toBe('string');
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
