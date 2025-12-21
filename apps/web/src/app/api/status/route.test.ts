/**
 * Status API Route Unit Tests
 *
 * Tests the /api/status route handler logic in isolation using Vitest.
 * Tests validation, error handling, response formatting, and service integration.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
} from '../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  connection: vi.fn(() => Promise.resolve()),
}));

// Mock data-layer services (service-factory imports from @heyclaude/data-layer)
// This matches the pattern used in service-factory.test.ts
const mockGetApiHealthFormatted = vi.fn();

vi.mock('@heyclaude/data-layer', async () => {
  // Import actual modules to get prisma export (PrismockClient in tests)
  // Required because pgmqSend imports prisma from @heyclaude/data-layer
  const actual = await vi.importActual<typeof import('@heyclaude/data-layer')>('@heyclaude/data-layer');
  return {
    ...actual,
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {},
    ContentService: class {},
    JobsService: class {},
    MiscService: class {
      getApiHealthFormatted = mockGetApiHealthFormatted;
    },
    NewsletterService: class {},
    SearchService: class {},
    TrendingService: class {},
    // prisma is already exported from actual (will be PrismockClient in tests)
  };
});

// Mock logger (route-factory imports from '../logging/server')
vi.mock('../../../../packages/web-runtime/src/logging/server', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
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
  normalizeError: vi.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock server/api-helpers (route-factory imports from '../server/api-helpers')
vi.mock('../../../../packages/web-runtime/src/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  getWithAuthCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  },
  postCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  badRequestResponse: vi.fn((message, errors) => {
    return new Response(
      JSON.stringify({
        error: message,
        ...(errors && { errors }),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
  handleOptionsRequest: vi.fn((corsHeaders) => {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
}));

// Mock authentication (status route doesn't require auth, but factory checks it)
// Route-factory imports from '../auth/get-authenticated-user' (relative path)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to return healthy by default
    mockGetApiHealthFormatted.mockResolvedValue({
      status: 'healthy',
      database: 'connected',
      timestamp: '2025-01-11T12:00:00Z',
    });
  });

  it('should return 200 with healthy status', async () => {
    const mockHealthData = {
      status: 'healthy',
      database: 'connected',
      timestamp: '2025-01-11T12:00:00Z',
      version: '1.1.0',
    };
    mockGetApiHealthFormatted.mockResolvedValue(mockHealthData);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Debug: Log actual response to understand format
    // console.log('Response body:', JSON.stringify(body, null, 2));
    // console.log('Response status:', response.status);

    // Response handler checks for 'status' property in result
    // The result from cachedServiceCall is passed directly to responseHandler
    // If result has status='healthy', returns 200
    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true); // Optional in test env (cacheLife/cacheTag are mocked)
    // Check if status exists in body (might be nested or direct)
    if (typeof body === 'object' && body !== null) {
      const statusValue = 'status' in body ? body.status : undefined;
      expect(statusValue).toBe('healthy');
    }
    expect(mockGetApiHealthFormatted).toHaveBeenCalledWith();
    expect(mockGetApiHealthFormatted).toHaveBeenCalledTimes(1);
  });

  it('should return 200 with degraded status', async () => {
    mockGetApiHealthFormatted.mockResolvedValue({
      status: 'degraded',
      database: 'slow',
      timestamp: '2025-01-11T12:00:00Z',
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('status', 'degraded');
    expect(body).toHaveProperty('database', 'slow');
  });

  it('should return 503 with unhealthy status', async () => {
    mockGetApiHealthFormatted.mockResolvedValue({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: '2025-01-11T12:00:00Z',
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 503);
    expect(body).toHaveProperty('status', 'unhealthy');
    expect(body).toHaveProperty('database', 'disconnected');
  });

  it('should handle composite type string status', async () => {
    // Test the edge case where status is a composite type string from database
    mockGetApiHealthFormatted.mockResolvedValue({
      status: '(healthy,"2025-01-11T12:00:00Z",1.1.0,{})',
      database: 'connected',
      timestamp: '2025-01-11T12:00:00Z',
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('status', 'healthy'); // Should be parsed from composite string
  });

  it('should handle service errors gracefully', async () => {
    mockGetApiHealthFormatted.mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Factory handles errors - returns 500 for service errors
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle OPTIONS request', async () => {
    const request = createMockRequest({
      method: 'OPTIONS',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await OPTIONS();

    // OPTIONS handler returns 204 (No Content) for CORS preflight
    expectStatus(response, 204);
    expectCorsHeaders(response);
    expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
  });

  it('should include X-Generated-By header', async () => {
    mockGetApiHealthFormatted.mockResolvedValue({
      status: 'healthy',
      database: 'connected',
      timestamp: '2025-01-11T12:00:00Z',
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);

    expect(response.headers.get('x-generated-by')).toBe('prisma.rpc.get_api_health_formatted');
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/status',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
  });
});
