/**
 * Unit Tests for Category Configs API Route
 *
 * Tests the /api/content/category-configs endpoint which returns category configuration data.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import { createMockRequest, getResponseBody, expectStatus, expectCorsHeaders, expectCacheHeaders } from '../../__helpers__/test-helpers';

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
const mockGetCategoryConfigs = vi.fn();

vi.mock('@heyclaude/data-layer', () => ({
  AccountService: class {},
  ChangelogService: class {},
  CompaniesService: class {},
  ContentService: class {
    getCategoryConfigs = mockGetCategoryConfigs;
  },
  JobsService: class {},
  MiscService: class {},
  NewsletterService: class {},
  SearchService: class {},
  TrendingService: class {},
}));

// Mock logging/server
vi.mock('../../../../../packages/web-runtime/src/logging/server', () => ({
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

// Mock auth (category-configs route doesn't require auth)
vi.mock('../../../../../packages/web-runtime/src/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    user: null,
    isAuthenticated: false,
  })),
}));

describe('GET /api/content/category-configs', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;
    
    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }
    
    vi.clearAllMocks();
    mockGetCategoryConfigs.mockResolvedValue([
      {
        category: 'skills',
        display_name: 'Skills',
        features: ['search', 'filter', 'bookmark'],
        metadata: {
          description: 'Programming skills and techniques',
        },
      },
      {
        category: 'agents',
        display_name: 'AI Agents',
        features: ['search', 'filter'],
        metadata: {
          description: 'AI agent configurations',
        },
      },
    ]);
  });

  it('should return category configs', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/category-configs',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expectCacheHeaders(response, true);
    expect(Array.isArray(body)).toBe(true);
    expect(mockGetCategoryConfigs).toHaveBeenCalledWith();
  });

  it('should return configs with correct structure', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/category-configs',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    const configs = body as unknown[];
    expect(configs.length).toBeGreaterThan(0);
    const firstConfig = configs[0] as {
      category?: string;
      display_name?: string;
      features?: string[];
      metadata?: unknown;
    };
    expect(firstConfig).toHaveProperty('category');
    expect(firstConfig).toHaveProperty('display_name');
    expect(firstConfig).toHaveProperty('features');
    expect(firstConfig).toHaveProperty('metadata');
  });

  it('should handle empty configs array', async () => {
    mockGetCategoryConfigs.mockResolvedValue([]);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/category-configs',
      query: {},
    });

    const response = await GET(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(Array.isArray(body)).toBe(true);
    expect((body as unknown[]).length).toBe(0);
  });

  it('should handle service errors gracefully', async () => {
    mockGetCategoryConfigs.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/content/category-configs',
      query: {},
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
