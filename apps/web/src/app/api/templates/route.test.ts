/**
 * Integration Tests for Templates API Route
 *
 * Tests the /api/templates endpoint which fetches content templates by category.
 * Uses real ContentService with Prismocker for integration testing.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GET, OPTIONS } from './route';
import { createMockRequest, getResponseBody, expectStatus, expectCorsHeaders, expectCacheHeaders } from '../__helpers__/test-helpers';

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock next/cache (Cache Components)
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(async () => {}),
}));

// Mock next/server
jest.mock('next/server', () => {
  const actual = jest.requireActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    connection: jest.fn(async () => {}),
  };
});

// Import prisma directly - don't use jest.requireActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services (use real ContentService, but mock other services to avoid side effects)
jest.mock('@heyclaude/data-layer', () => {
  const actual = jest.requireActual('@heyclaude/data-layer');
  return {
    ...actual, // Include all real exports (including ContentService)
    AccountService: class {},
    ChangelogService: class {},
    CompaniesService: class {},
    JobsService: class {},
    MiscService: class {},
    NewsletterService: class {},
    SearchService: class {},
    TrendingService: class {},
  };
});

// Mock logging/server
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
}));

// DO NOT mock api-helpers - use REAL helpers for integration testing
// The route factory uses these helpers internally, so we need the real implementations

// Mock auth (templates route doesn't require auth)
jest.mock('@heyclaude/web-runtime/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: jest.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

// DO NOT mock route-factory - use REAL factory for integration testing
// This ensures we test the complete flow: Route → Factory → Service → RPC → Database (Prismocker)

describe('GET /api/templates', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof (prismocker as any).reset === 'function') {
      (prismocker as any).reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Seed content_templates data using Prismocker's setData method
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content_templates', [
        {
          id: 'template-1',
          category: 'skills',
          name: 'Test Template',
          description: 'A test template',
          template_data: { category: 'skills', tags: 'test' },
          active: true,
          display_order: 1,
        },
      ]);
    }
  });

  it('should return templates for valid category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates?category=skills',
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
    // Verify template structure
    const templates = (body as { templates: unknown[] }).templates;
    expect(templates[0]).toHaveProperty('id', 'template-1');
    expect(templates[0]).toHaveProperty('type', 'skills'); // ContentService transforms category to type
    expect(templates[0]).toHaveProperty('name', 'Test Template');
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates?category=skills',
    });

    // First call
    const cacheBefore = getRequestCache().getStats().size;
    const response1 = await GET(request);
    const body1 = await getResponseBody(response1);
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call
    const response2 = await GET(request);
    const body2 = await getResponseBody(response2);
    const cacheAfterSecond = getRequestCache().getStats().size;

    // Verify cache worked
    expect(body1).toEqual(body2);
    // Verify cache size increased after first call, stayed same after second
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
    expect(cacheAfterSecond).toBe(cacheAfterFirst);
  });

  it('should return 400 for missing category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Factory validation should return 400 for missing required parameter
    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should return 400 for invalid category', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates?category=invalid-category',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    // Factory validation should return 400 for invalid category
    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
  });

  it('should return empty templates array when no templates found', async () => {
    // Seed empty data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content_templates', []);
    }

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/templates?category=skills',
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('category', 'skills');
    expect(body).toHaveProperty('count', 0);
    expect(body).toHaveProperty('templates');
    expect(Array.isArray((body as { templates: unknown[] }).templates)).toBe(true);
    expect((body as { templates: unknown[] }).templates.length).toBe(0);
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
