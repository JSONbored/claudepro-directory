/**
 * API Route Test Template
 *
 * Template for creating Vitest unit tests for API routes.
 * Copy this template and customize for each route.
 */

import { describe, it, vi, beforeEach } from 'vitest';
// TODO: Update import path to your actual route file
// import { GET, OPTIONS } from './route';
// TODO: Uncomment when you have a real route
// import {
//   createMockRequest,
//   getResponseBody,
//   expectStatus,
//   expectCorsHeaders,
// } from '../__helpers__/test-helpers';

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
// Update service class and method as needed
// IMPORTANT: Use vi.importActual to include prisma export (required by pgmq-client)
const mockServiceMethod = vi.fn();

vi.mock('@heyclaude/data-layer', async () => {
  // Import actual modules to get prisma export (PrismockClient in tests)
  const actual = await vi.importActual<typeof import('@heyclaude/data-layer')>('@heyclaude/data-layer');
  return {
    ...actual,
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {
      // Add methods as needed: yourMethodName = mockServiceMethod;
    },
    ContentService: class {},
    JobsService: class {},
    MiscService: class {
      // Add methods as needed: yourMethodName = mockServiceMethod;
    },
    NewsletterService: class {},
    SearchService: class {
      // Add methods as needed: yourMethodName = mockServiceMethod;
    },
    TrendingService: class {},
    // prisma is already exported from actual (will be PrismockClient in tests)
  };
});

// Mock logger
vi.mock('../../../../packages/web-runtime/src/logging/server', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  createErrorResponse: vi.fn((error) => {
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

// Mock server/api-helpers
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
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    });
  }),
  unauthorizedResponse: vi.fn((message, _authInfo, corsHeaders) => {
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

// Mock authentication (if route requires auth)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async (options?: { requireUser?: boolean }) => {
    if (options?.requireUser) {
      // For requireAuth routes, return authenticated user
      return {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        isAuthenticated: true,
      };
    }
    // For optionalAuth or no auth routes
    return {
      user: null,
      isAuthenticated: false,
    };
  }),
}));

describe('GET /api/your-route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with valid data', async () => {
    // Mock service response
    mockServiceMethod.mockResolvedValue({
      // Your expected response data
    });

    // TODO: Uncomment when you have a real route
    // const request = createMockRequest({
    //   method: 'GET',
    //   url: 'http://localhost:3000/api/v1/your-route',
    //   query: {
    //     // Query parameters if needed
    //   },
    // });
    // const response = await GET(request);
    // const body = await getResponseBody(response);
    // expectStatus(response, 200);
    // expectCorsHeaders(response);
    // Add more assertions based on your route
  });

  it('should handle OPTIONS request', async () => {
    // TODO: Uncomment when you have a real route
    // const response = await OPTIONS();
    // expectStatus(response, 204);
    // expectCorsHeaders(response);
  });
});
