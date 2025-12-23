/**
 * API Route Test Template
 *
 * Template for creating Vitest unit tests for API routes.
 * Copy this template and customize for each route.
 */

// Mock data-layer services
// IMPORTANT: Import prisma directly - don't use vi.importActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import { type PrismaClient } from '@prisma/client';
import { beforeEach, describe, it, vi } from 'vitest';
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

const mockServiceMethod = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
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
}));

// Mock logger
vi.mock('../../../../packages/web-runtime/src/logging/server', () => ({
  createErrorResponse: vi.fn((error) =>
    Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  ),
  logger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    })),
  },
  normalizeError: vi.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock server/api-helpers
vi.mock('../../../../packages/web-runtime/src/server/api-helpers', () => ({
  badRequestResponse: vi.fn((message, errors) =>
    Response.json(
      {
        error: message,
        ...(errors && { errors }),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  ),
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Origin': '*',
  },
  getWithAuthCorsHeaders: {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Origin': '*',
  },
  handleOptionsRequest: vi.fn(
    (corsHeaders) =>
      new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        status: 204,
      })
  ),
  jsonResponse: vi.fn((data, status, corsHeaders, additionalHeaders) =>
    Response.json(data, {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...additionalHeaders,
      },
      status,
    })
  ),
  postCorsHeaders: {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': '*',
  },
  unauthorizedResponse: vi.fn((message, _authInfo, corsHeaders) =>
    Response.json(
      {
        error: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 401,
      }
    )
  ),
}));

// Mock authentication (if route requires auth)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async (options?: { requireUser?: boolean }) => {
    if (options?.requireUser) {
      // For requireAuth routes, return authenticated user
      return {
        isAuthenticated: true,
        user: {
          email: 'test@example.com',
          id: 'test-user-id',
        },
      };
    }
    // For optionalAuth or no auth routes
    return {
      isAuthenticated: false,
      user: null,
    };
  }),
}));

describe('GET /api/your-route', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

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
