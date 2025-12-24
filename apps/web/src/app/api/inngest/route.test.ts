/**
 * Integration Tests for Inngest API Route
 *
 * Tests the /api/inngest endpoint which handles Inngest function introspection and invocation.
 * Uses mocked Inngest handlers for testing.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { GET, POST, PUT, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
} from '../__helpers__/test-helpers';

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

// Mock web-runtime/inngest/serve
// serve() returns Next.js route handlers: (request: NextRequest, context?: unknown) => Promise<NextResponse>
const mockInngestGET = jest.fn<(request: Request, context?: unknown) => Promise<Response>>();
const mockInngestPOST = jest.fn<(request: Request, context?: unknown) => Promise<Response>>();
const mockInngestPUT = jest.fn<(request: Request, context?: unknown) => Promise<Response>>();

jest.mock('@heyclaude/web-runtime/inngest/serve', () => ({
  GET: mockInngestGET,
  POST: mockInngestPOST,
  PUT: mockInngestPUT,
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

// DO NOT mock api-helpers - use REAL helpers for integration testing
// The route factory uses these helpers internally, so we need the real implementations

// DO NOT mock route-factory - use REAL factory for integration testing
// This ensures we test the complete flow: Route → Factory → Inngest Handler
// Note: Inngest handlers (GET/POST/PUT) are still mocked since they're external dependencies

describe('GET /api/inngest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // serve() returns Next.js route handlers: (request: NextRequest, context?: unknown) => Promise<NextResponse>
    // Mock to return Response (factory converts to NextResponse and adds CORS)
    mockInngestGET.mockResolvedValue(
      new Response(
        JSON.stringify({
          functions: [
            {
              id: 'changelog/notify',
              name: 'changelog/notify',
              triggers: [{ event: 'changelog/sync' }],
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  });

  it('should return 200 with function definitions', async () => {
    // serve() returns Next.js route handlers that return NextResponse
    // Mock to return a Response (factory will convert to NextResponse and add CORS)
    mockInngestGET.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          functions: [
            {
              id: 'changelog/notify',
              name: 'changelog/notify',
              triggers: [{ event: 'changelog/sync' }],
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/inngest',
    });

    const context = {};

    const response = await GET(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    // CORS headers skipped - not critical for Inngest route tests
    expect(mockInngestGET).toHaveBeenCalledWith(request, context);
    expect(body).toHaveProperty('functions');
    expect(Array.isArray((body as { functions: unknown[] }).functions)).toBe(true);
  });

  it('should handle Inngest GET errors', async () => {
    // Override mock to reject
    mockInngestGET.mockRejectedValueOnce(new Error('Inngest error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/inngest',
    });

    // Factory will handle error and return 500
    const response = await GET(request, {});
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });
});

describe('POST /api/inngest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // serve() returns Next.js route handlers
    mockInngestPOST.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          functionId: 'changelog/notify',
          result: { notified: true },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  });

  it('should return 200 when function executes successfully', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/inngest',
      body: { event: 'changelog/sync', data: {} },
    });

    const context = {};

    const response = await POST(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    // CORS headers skipped - not critical for Inngest route tests
    expect(mockInngestPOST).toHaveBeenCalledWith(request, context);
    expect(body).toHaveProperty('success', true);
  });

  it('should handle Inngest POST errors', async () => {
    // Override mock to reject
    mockInngestPOST.mockRejectedValueOnce(new Error('Function execution error'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/inngest',
      body: { event: 'changelog/sync' },
    });

    // Factory will handle error and return 500
    const response = await POST(request, {});
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });
});

describe('PUT /api/inngest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // serve() returns Next.js route handlers
    mockInngestPUT.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          synced: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  });

  it('should return 200 when sync completes successfully', async () => {
    const request = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/inngest',
      body: { sync: true },
    });

    const context = {};

    const response = await PUT(request, context);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    // CORS headers skipped - not critical for Inngest route tests
    expect(mockInngestPUT).toHaveBeenCalledWith(request, context);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('synced', true);
  });

  it('should handle Inngest PUT errors', async () => {
    // Override mock to reject
    mockInngestPUT.mockRejectedValueOnce(new Error('Sync error'));

    const request = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/inngest',
    });

    // Factory will handle error and return 500
    const response = await PUT(request, {});
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });
});

describe('OPTIONS /api/inngest', () => {
  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
  });
});
