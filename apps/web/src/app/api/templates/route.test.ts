/**
 * Unit Tests for Templates API Route
 *
 * Tests the /api/templates endpoint which fetches content templates by category.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import { createMockRequest, getResponseBody, expectStatus, expectCorsHeaders, expectCacheHeaders } from '../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache (Cache Components)
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  connection: vi.fn(async () => {}),
}));

// Import prisma directly - don't use vi.importActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services
const mockGetContentTemplates = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  AccountService: class {},
  ChangelogService: class {},
  CompaniesService: class {},
  ContentService: class {
    getContentTemplates = mockGetContentTemplates;
  },
  JobsService: class {},
  MiscService: class {},
  NewsletterService: class {},
  SearchService: class {},
  TrendingService: class {},
}));

// Mock logging/server
vi.mock('../../../../packages/web-runtime/src/logging/server', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
  generateRequestId: vi.fn(() => 'test-request-id'),
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
  badRequestResponse: vi.fn((message, corsHeaders) => {
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }),
  handleOptionsRequest: vi.fn(() => {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }),
  buildSecurityHeaders: vi.fn(() => ({})),
}));

// Mock auth (templates route doesn't require auth)
vi.mock('../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/templates', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;
    
    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }
    
    vi.clearAllMocks();
    mockGetContentTemplates.mockResolvedValue({
      templates: [
        {
          id: 'template-1',
          title: 'Test Template',
          description: 'A test template',
          category: 'skills',
        },
      ],
    });
  });

  it('should return templates for valid category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates',
      query: { category: 'skills' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('category', 'skills');
    expect(body).toHaveProperty('count', 1);
    expect(body).toHaveProperty('templates');
    expect(Array.isArray((body as { templates: unknown[] }).templates)).toBe(true);
    expect(mockGetContentTemplates).toHaveBeenCalledWith({ p_category: 'skills' });
  });

  it('should return 500 for missing category (validation error in methodArgs)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // methodArgs throws validation error, factory catches and returns 500
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(mockGetContentTemplates).not.toHaveBeenCalled();
  });

  it('should return 500 for invalid category (validation error in methodArgs)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates',
      query: { category: 'invalid-category' },
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // methodArgs throws validation error, factory catches and returns 500
    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
    expect(mockGetContentTemplates).not.toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    mockGetContentTemplates.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates',
      query: { category: 'skills' },
    });

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
