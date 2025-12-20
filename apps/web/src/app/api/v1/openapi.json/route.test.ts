/**
 * Unit Tests for OpenAPI Specification API Route
 *
 * Tests the /api/v1/openapi.json endpoint which serves the generated OpenAPI specification.
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
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';

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

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

// Mock path
vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/')),
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
  buildCacheHeaders: vi.fn((preset) => ({
    'Cache-Control': preset === 'config' ? 'public, s-maxage=86400, stale-while-revalidate=172800' : 'public',
  })),
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
      });
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

describe('GET /api/v1/openapi.json', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.cwd mock
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project');
  });

  it('should return 200 with OpenAPI spec when file exists', async () => {
    const mockSpec = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/api/test': {
          get: {
            summary: 'Test endpoint',
          },
        },
      },
    };

    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSpec));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/openapi.json',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(body).toEqual(mockSpec);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should return 404 when OpenAPI spec file does not exist', async () => {
    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    vi.mocked(readFile).mockRejectedValue(error);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/openapi.json',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    expect((body as { error: string }).error).toContain('OpenAPI specification not found');
  });

  it('should return 500 when file read fails with non-ENOENT error', async () => {
    const error = new Error('Permission denied');
    vi.mocked(readFile).mockRejectedValue(error);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/openapi.json',
    });

    // Factory will handle error and return 500
    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should return 500 when JSON parsing fails', async () => {
    vi.mocked(readFile).mockResolvedValue('invalid json');

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/openapi.json',
    });

    // Factory will handle error and return 500
    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should include cache headers', async () => {
    const mockSpec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
    };

    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockSpec));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/openapi.json',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expectCacheHeaders(response, true);
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
