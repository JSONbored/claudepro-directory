/**
 * Unit Tests for Flux Catch-All API Route
 *
 * Tests the /api/flux/[...path] endpoint which routes requests to Flux handlers.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { GET, POST, OPTIONS } from './route';
import { createMockRequest, getResponseBody, expectStatus } from '../../__helpers__/test-helpers';

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

// Mock web-runtime/flux/router
const mockRouteFluxRequest = jest.fn();

jest.mock('@heyclaude/web-runtime/flux/router', () => ({
  routeFluxRequest: mockRouteFluxRequest,
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }),
  createApiRoute: jest.fn((config) => {
    return async (request: Request, context?: unknown) => {
      try {
        const handlerResult = await config.handler({
          logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
          request: request as any,
          nextContext: context,
        });
        // Handler returns NextResponse from routeFluxRequest
        // Factory should return NextResponse directly (factory doesn't convert NextResponse to Response)
        if (handlerResult instanceof NextResponse) {
          return handlerResult;
        }
        // If it's a Response, convert to NextResponse (factory does this)
        if (handlerResult instanceof Response) {
          return new NextResponse(handlerResult.body, {
            status: handlerResult.status,
            statusText: handlerResult.statusText,
            headers: handlerResult.headers,
          });
        }
        // If it's a NextResponse-like object, return as-is
        if (handlerResult && typeof handlerResult === 'object' && 'status' in handlerResult) {
          return handlerResult as NextResponse;
        }
        return handlerResult;
      } catch (error) {
        // Factory catches errors and returns 500 as NextResponse
        return new NextResponse(
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
  createOptionsHandler: jest.fn(() => {
    return async () => {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
      });
    };
  }),
}));

describe('GET /api/flux/[...path]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // routeFluxRequest returns NextResponse
    mockRouteFluxRequest.mockImplementation(
      async (method: string, path: string[], request: Request) => {
        return new NextResponse(JSON.stringify({ count: 1234 }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    );
  });

  it('should route email/count request', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/flux/email/count',
    });

    const context = {
      params: Promise.resolve({ path: ['email', 'count'] }),
    };

    // Ensure mock returns a NextResponse
    mockRouteFluxRequest.mockResolvedValueOnce(
      new NextResponse(JSON.stringify({ count: 1234 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockRouteFluxRequest).toHaveBeenCalledWith(
      'GET',
      ['email', 'count'],
      expect.any(Object)
    );
    expect(body).toHaveProperty('count', 1234);
  });

  it('should route other flux paths', async () => {
    const paths = [['discord', 'direct'], ['revalidation'], ['webhook', 'external']];

    for (const path of paths) {
      // Reset mock for each path to ensure it returns a NextResponse
      mockRouteFluxRequest.mockImplementationOnce(
        async (method: string, path: string[], request: Request) => {
          return new NextResponse(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      );

      const request = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/flux/${path.join('/')}`,
      });

      const context = {
        params: Promise.resolve({ path }),
      };

      const response = await GET(request, context);

      expectStatus(response, 200);
      expect(mockRouteFluxRequest).toHaveBeenCalledWith('GET', path, expect.any(Object));
    }
  });

  it('should handle missing route context', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/flux/email/count',
    });

    // Factory will handle error and return 500 (handler throws)
    const response = await GET(request, null);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle routeFluxRequest errors', async () => {
    // Override the mock to throw an error
    mockRouteFluxRequest.mockImplementationOnce(async () => {
      throw new Error('Flux handler error');
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/flux/email/count',
    });

    const context = {
      params: Promise.resolve({ path: ['email', 'count'] }),
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
  });
});

describe('POST /api/flux/[...path]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // routeFluxRequest returns NextResponse
    mockRouteFluxRequest.mockImplementation(
      async (method: string, path: string[], request: Request) => {
        return new NextResponse(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    );
  });

  it('should route POST requests to flux handlers', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/flux/discord/direct',
      body: { message: 'Test' },
    });

    const context = {
      params: Promise.resolve({ path: ['discord', 'direct'] }),
    };

    const response = await POST(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(mockRouteFluxRequest).toHaveBeenCalledWith(
      'POST',
      ['discord', 'direct'],
      expect.any(Object)
    );
    expect(body).toHaveProperty('success', true);
  });

  it('should handle missing route context', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/flux/discord/direct',
    });

    // Factory will handle error and return 500 (handler throws)
    const response = await POST(request, null);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });
});
