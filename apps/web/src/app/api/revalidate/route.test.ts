/**
 * Integration Tests for Revalidate API Route
 *
 * Tests the /api/revalidate endpoint which triggers on-demand ISR revalidation.
 * Uses real route factory with mocked revalidatePath/revalidateTag.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { POST, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
} from '../__helpers__/test-helpers';

// Import real cache utilities for proper cache testing
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock next/cache (revalidatePath and revalidateTag for cache invalidation)
const mockRevalidatePath = jest.fn();
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  connection: jest.fn(async () => {}),
}));

// Mock next/server (connection is imported from here, not next/cache)
jest.mock('next/server', () => {
  const actual = jest.requireActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    connection: jest.fn(async () => {}),
  };
});

// Mock shared-runtime/schemas/env
jest.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    REVALIDATE_SECRET: 'test-secret',
    isProduction: false,
  },
  get isProduction() {
    return false;
  },
}));

// Mock logger (route-factory imports from '../logging/server')
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

// Mock server/api-helpers (route-factory imports from '../server/api-helpers')
jest.mock('@heyclaude/web-runtime/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  jsonResponse: jest.fn((data, status, corsHeaders, additionalHeaders) => {
    return new Response(JSON.stringify(data), {
      status: typeof status === 'number' ? status : 200,
      headers: {
        'Content-Type': 'application/json',
        ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        ...(typeof additionalHeaders === 'object' && additionalHeaders !== null ? (additionalHeaders as Record<string, string>) : {}),
      },
    });
  }),
  unauthorizedResponse: jest.fn((message, authInfo, corsHeaders) => {
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        },
      }
    );
  }),
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(typeof corsHeaders === 'object' && corsHeaders !== null ? (corsHeaders as Record<string, string>) : {}),
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
}));

describe('POST /api/revalidate', () => {
  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Clear all mocks
    jest.clearAllMocks();

    // 3. Reset revalidate mocks
    mockRevalidatePath.mockClear();
    mockRevalidateTag.mockClear();
  });

  it('should return 200 when revalidation succeeds with category', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        secret: 'test-secret',
        category: 'agents',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response) as {
      revalidated?: boolean;
      paths?: string[];
      timestamp?: string;
    };

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('revalidated', true);
    expect(body).toHaveProperty('paths');
    expect(body.paths).toContain('/');
    expect(body.paths).toContain('/agents');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/agents');
    expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
  });

  it('should return 200 when revalidation succeeds with category and slug', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        secret: 'test-secret',
        category: 'agents',
        slug: 'code-reviewer',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response) as {
      revalidated?: boolean;
      paths?: string[];
      timestamp?: string;
    };

    expectStatus(response, 200);
    expect(body).toHaveProperty('revalidated', true);
    expect(body.paths).toContain('/');
    expect(body.paths).toContain('/agents');
    expect(body.paths).toContain('/agents/code-reviewer');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/agents');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/agents/code-reviewer');
    expect(mockRevalidatePath).toHaveBeenCalledTimes(3);
  });

  it('should return 200 when revalidation succeeds with tags', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        secret: 'test-secret',
        tags: ['content', 'homepage', 'trending'],
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response) as {
      revalidated?: boolean;
      tags?: string[];
      timestamp?: string;
    };

    expectStatus(response, 200);
    expect(body).toHaveProperty('revalidated', true);
    expect(body).toHaveProperty('tags');
    expect(body.tags).toEqual(['content', 'homepage', 'trending']);
    expect(mockRevalidateTag).toHaveBeenCalledWith('content', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('homepage', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('trending', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
  });

  it('should return 200 when revalidation succeeds with both category and tags', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        secret: 'test-secret',
        category: 'agents',
        slug: 'code-reviewer',
        tags: ['content', 'homepage'],
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response) as {
      revalidated?: boolean;
      paths?: string[];
      tags?: string[];
      timestamp?: string;
    };

    expectStatus(response, 200);
    expect(body).toHaveProperty('revalidated', true);
    expect(body).toHaveProperty('paths');
    expect(body).toHaveProperty('tags');
    expect(body.paths).toContain('/');
    expect(body.paths).toContain('/agents');
    expect(body.paths).toContain('/agents/code-reviewer');
    expect(body.tags).toEqual(['content', 'homepage']);
    expect(mockRevalidatePath).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledTimes(3);
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it('should return 401 when secret is missing', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        category: 'agents',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 401);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Missing secret');
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it('should return 401 when secret is invalid', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        secret: 'wrong-secret',
        category: 'agents',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 401);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Invalid secret');
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it('should return 500 when neither category nor tags provided', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        secret: 'test-secret',
      },
    });

    // Route throws error which factory catches and returns 500
    const response = await POST(request);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Missing category or tags');
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it('should return 500 when tags array is empty', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        secret: 'test-secret',
        tags: [], // Empty array
      },
    });

    // Route throws error which factory catches and returns 500
    const response = await POST(request);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Missing category or tags');
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it('should include timestamp in response', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/revalidate',
      body: {
        secret: 'test-secret',
        category: 'agents',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response) as {
      revalidated?: boolean;
      paths?: string[];
      timestamp?: string;
    };

    expectStatus(response, 200);
    expect(body).toHaveProperty('timestamp');
    expect(typeof body.timestamp).toBe('string');
    // Verify timestamp is valid ISO string
    expect(() => new Date(body.timestamp!)).not.toThrow();
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'GET', // Unsupported method (POST is required)
      url: 'http://localhost:3000/api/v1/revalidate',
      // No body for GET requests
    });

    const response = await POST(request);
    const body = await getResponseBody(response) as { error?: string };

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
    expect(response.headers.get('Allow')).toBe('POST');
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});
