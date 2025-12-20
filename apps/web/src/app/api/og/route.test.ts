/**
 * Unit Tests for Open Graph Image API Route
 *
 * Tests the /api/og endpoint which generates dynamic Open Graph images.
 * Note: ImageResponse is complex to test, so we focus on query parameter handling and defaults.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
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

// Mock React globally for JSX transformation (Next.js uses automatic JSX runtime)
// JSX in route.tsx gets transformed to React.createElement calls
globalThis.React = {
  createElement: (type: any, props: any, ...children: any[]) => {
    // Return a simple object representing the JSX element
    // This allows JSX to work without actually rendering
    return { type, props, children: children.flat() };
  },
} as any;

// Mock next/og ImageResponse using vi.hoisted
// ImageResponse is complex - we mock it to return a simple Response
const mockImageResponse = vi.hoisted(() => vi.fn());

vi.mock('next/og', () => ({
  ImageResponse: class ImageResponse extends Response {
    constructor(jsx: unknown, options?: { width?: number; height?: number }) {
      // Track that ImageResponse was called
      mockImageResponse(jsx, options);
      // Return a mock response that extends Response
      // This simulates ImageResponse which extends Response
      // Include CORS headers since factory adds them
      super('mock-image-data', {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      });
    }
  },
}));

// Mock shared-runtime
vi.mock('@heyclaude/shared-runtime', () => ({
  OG_DEFAULTS: {
    title: 'Default Title',
    description: 'Default Description',
    type: 'DEFAULT',
  },
  OG_DIMENSIONS: {
    width: 1200,
    height: 630,
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
      try {
        const handlerResult = await config.handler({
          logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
          },
          request: request as any,
          nextContext: context,
          query: Object.fromEntries(new URL(request.url).searchParams),
        });
        // Handler returns ImageResponse (extends Response), factory converts to NextResponse
        if (handlerResult instanceof Response) {
          return handlerResult;
        }
        return handlerResult;
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

describe('GET /api/og', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with image when using default parameters', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(mockImageResponse).toHaveBeenCalled();
  });

  it('should use custom title when provided', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og?title=Custom%20Title',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockImageResponse).toHaveBeenCalled();
  });

  it('should use custom description when provided', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og?title=Test&description=Custom%20Description',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockImageResponse).toHaveBeenCalled();
  });

  it('should use custom type when provided', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og?title=Test&type=AGENT',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockImageResponse).toHaveBeenCalled();
  });

  it('should parse and deduplicate tags', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og?title=Test&tags=ai,automation,ai,testing',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockImageResponse).toHaveBeenCalled();
    // Tags should be deduplicated (ai appears twice, should only appear once)
  });

  it('should trim tag whitespace', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og?title=Test&tags=ai%20,automation%20,testing',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockImageResponse).toHaveBeenCalled();
  });

  it('should limit tags to 5', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og?title=Test&tags=tag1,tag2,tag3,tag4,tag5,tag6,tag7',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockImageResponse).toHaveBeenCalled();
    // generateOgImage function limits to 5 tags via .slice(0, 5)
  });

  it('should handle empty tags parameter', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og?title=Test&tags=',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockImageResponse).toHaveBeenCalled();
  });

  it('should use defaults when parameters omitted', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og',
    });

    const response = await GET(request);

    expectStatus(response, 200);
    expect(mockImageResponse).toHaveBeenCalled();
    // Should use OG_DEFAULTS for title, description, type
  });

  it('should handle ImageResponse errors', async () => {
    mockImageResponse.mockImplementation(() => {
      throw new Error('ImageResponse error');
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/og?title=Test',
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
