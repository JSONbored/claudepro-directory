/**
 * Company API Route Unit Tests
 *
 * Tests the /api/company route handler logic in isolation using Vitest.
 * Tests validation, error handling, response formatting, and service integration.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, OPTIONS, companyQuerySchema } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
  expectCacheHeaders,
  expectErrorResponse,
} from '../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  connection: vi.fn(() => Promise.resolve()),
}));

// Import prisma directly - don't use vi.importActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services
const mockGetCompanyProfile = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  AccountService: class {},
  ChangelogService: class {},
  CompaniesService: class {
    getCompanyProfile = mockGetCompanyProfile;
  },
  ContentService: class {},
  JobsService: class {},
  MiscService: class {},
  NewsletterService: class {},
  SearchService: class {},
  TrendingService: class {},
}));

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

// Mock server/not-found-response (route imports this)
vi.mock('../../../../packages/web-runtime/src/server/not-found-response', () => ({
  notFoundResponse: vi.fn((message, resourceType) => {
    return new Response(
      JSON.stringify({
        error: message,
        resourceType,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
}));

// Mock authentication (company route doesn't require auth)
// Route-factory imports from '../auth/get-authenticated-user' (relative path)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/company', () => {
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

  it('should return 200 with company profile for valid slug', async () => {
    const mockProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Acme Corp',
      slug: 'acme-corp',
      description: 'A leading technology company',
      website: 'https://acme.com',
      logo_url: 'https://acme.com/logo.png',
      p_slug: 'acme-corp',
    };

    mockGetCompanyProfile.mockResolvedValue(mockProfile);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/company',
      query: { slug: 'acme-corp' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true); // Optional in test env
    expect(body).toHaveProperty('slug', 'acme-corp');
    expect(body).toHaveProperty('name', 'Acme Corp');
    expect(mockGetCompanyProfile).toHaveBeenCalledWith({ p_slug: 'acme-corp' });
    expect(response.headers.get('x-generated-by')).toBe('prisma.rpc.get_company_profile');
  });

  it('should return 404 when company not found', async () => {
    mockGetCompanyProfile.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/company',
      query: { slug: 'non-existent' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
  });

  it('should return 404 when company profile is empty object', async () => {
    mockGetCompanyProfile.mockResolvedValue({});

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/company',
      query: { slug: 'empty-company' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 404);
    expect(body).toHaveProperty('error');
  });

  it('should return 400 for missing slug parameter', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/company',
      // No query parameters
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expectErrorResponse(body);
    expect(mockGetCompanyProfile).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid slug format', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/company',
      query: { slug: 'Invalid Slug!' }, // Invalid: contains spaces and special characters
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expectErrorResponse(body);
    expect(mockGetCompanyProfile).not.toHaveBeenCalled();
  });

  it('should validate slug schema correctly', () => {
    // Test valid slugs
    expect(companyQuerySchema.parse({ slug: 'acme-corp' })).toEqual({ slug: 'acme-corp' });
    expect(companyQuerySchema.parse({ slug: 'test-123' })).toEqual({ slug: 'test-123' });
    expect(companyQuerySchema.parse({ slug: 'a' })).toEqual({ slug: 'a' });

    // Test invalid slugs
    expect(() => companyQuerySchema.parse({ slug: 'Invalid Slug!' })).toThrow();
    expect(() => companyQuerySchema.parse({ slug: 'test@slug' })).toThrow();
    expect(() => companyQuerySchema.parse({ slug: '' })).toThrow();
  });

  it('should handle service errors gracefully', async () => {
    mockGetCompanyProfile.mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/company',
      query: { slug: 'acme-corp' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Factory handles errors - returns 500 for service errors
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    // OPTIONS handler returns 204 (No Content) for CORS preflight
    expectStatus(response, 204);
    expectCorsHeaders(response);
    expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
  });

  it('should return 405 for unsupported method', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/company',
      query: { slug: 'acme-corp' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 405);
    expect(body).toHaveProperty('error');
  });
});
