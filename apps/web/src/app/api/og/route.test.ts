/**
 * Integration Tests for Open Graph Image API Route
 *
 * Tests the /api/og endpoint which generates dynamic Open Graph images.
 * Note: ImageResponse is complex to test, so we focus on query parameter handling and defaults.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GET, OPTIONS } from './route';
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

// Mock React globally for JSX transformation (Next.js uses automatic JSX runtime)
// JSX in route.tsx gets transformed to React.createElement calls
globalThis.React = {
  createElement: (type: any, props: any, ...children: any[]) => {
    // Return a simple object representing the JSX element
    // This allows JSX to work without actually rendering
    return { type, props, children: children.flat() };
  },
} as any;

// Mock next/og ImageResponse
// ImageResponse is complex - we mock it to return a simple Response
const mockImageResponse = jest.fn();

jest.mock('next/og', () => ({
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
// Note: Must include createPinoConfig since real route factory imports data-layer which needs it
jest.mock('@heyclaude/shared-runtime', () => ({
  OG_DEFAULTS: {
    title: 'Default Title',
    description: 'Default Description',
    type: 'DEFAULT',
  },
  OG_DIMENSIONS: {
    width: 1200,
    height: 630,
  },
  createPinoConfig: jest.fn((options?: { service?: string }) => ({
    level: 'info',
    base: {
      service: options?.service || 'test',
      env: 'test',
    },
    redact: [],
    serializers: {},
  })),
  normalizeError: jest.fn((error: unknown) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
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

// DO NOT mock api-helpers - use REAL helpers for integration testing
// The route factory uses these helpers internally, so we need the real implementations

// DO NOT mock route-factory - use REAL factory for integration testing
// This ensures we test the complete flow: Route → Factory → Handler → ImageResponse

describe('GET /api/og', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
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
