/**
 * API Route Test Template
 *
 * Template for creating Jest unit tests for API routes.
 * Copy this template and customize for each route.
 */

// Mock data-layer services
// IMPORTANT: Import prisma directly - don't use jest.requireActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import { type PrismaClient } from '@prisma/client';
import { beforeEach, describe, it, jest } from '@jest/globals';
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
jest.mock('server-only', () => ({}));

// Mock next/cache
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

const mockServiceMethod = jest.fn();

jest.mock('@heyclaude/data-layer', () => ({
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
jest.mock('../../../../packages/web-runtime/src/logging/server', () => ({
  createErrorResponse: jest.fn((error) =>
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
    child: jest.fn(() => ({
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    })),
  },
  normalizeError: jest.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock server/api-helpers
jest.mock('../../../../packages/web-runtime/src/server/api-helpers', () => ({
  badRequestResponse: jest.fn((message, errors) =>
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
  handleOptionsRequest: jest.fn(
    (corsHeaders) =>
      new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
        status: 204,
      })
  ),
  jsonResponse: jest.fn((data, status, corsHeaders, additionalHeaders) =>
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
  unauthorizedResponse: jest.fn((message, _authInfo, corsHeaders) =>
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

// NOTE: Routes no longer use requireAuth/optionalAuth in createApiRoute
// All user-authenticated routes should use authedAction server actions instead
// See bookmarks/add/route.test.ts and user/profile-image/route.test.ts for examples

describe('GET /api/your-route', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    jest.clearAllMocks();
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
