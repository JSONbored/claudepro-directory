/**
 * Unit Tests for OpenAPI Specification API Route
 *
 * Tests the /api/v1/openapi.json endpoint which serves the generated OpenAPI specification.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
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
jest.mock('server-only', () => ({}));

// Mock next/cache
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Mock next/server
jest.mock('next/server', () => {
  const actual = jest.requireActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    connection: jest.fn(async () => {}),
  };
});

// Mock fs/promises
jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

// Mock path
jest.mock('node:path', () => ({
  join: jest.fn((...args) => args.join('/')),
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

// Mock server/api-helpers and api/route-factory
jest.mock('@heyclaude/web-runtime/server', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  buildCacheHeaders: jest.fn((preset) => ({
    'Cache-Control': preset === 'config' ? 'public, s-maxage=86400, stale-while-revalidate=172800' : 'public',
  })),
  jsonResponse: jest.fn((data, status, corsHeaders, additionalHeaders) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...additionalHeaders,
      },
    });
  }),
  handleOptionsRequest: jest.fn((corsHeaders) => {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
  createApiRoute: jest.fn((config) => {
    return async (request: Request, context?: unknown) => {
      return await config.handler({
        logger: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
        request: request as any,
        nextContext: context,
      });
    };
  }),
  createOptionsHandler: jest.fn(() => {
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
    jest.clearAllMocks();
    // Reset process.cwd mock
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
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

    jest.mocked(readFile).mockResolvedValue(JSON.stringify(mockSpec));

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
    jest.mocked(readFile).mockRejectedValue(error);

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
    jest.mocked(readFile).mockRejectedValue(error);

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
    jest.mocked(readFile).mockResolvedValue('invalid json');

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

    jest.mocked(readFile).mockResolvedValue(JSON.stringify(mockSpec));

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
