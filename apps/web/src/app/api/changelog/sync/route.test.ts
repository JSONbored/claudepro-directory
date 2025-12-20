/**
 * Unit Tests for Changelog Sync API Route
 *
 * Tests the /api/changelog/sync endpoint which syncs changelog entries from CHANGELOG.md to database.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
} from '../../__helpers__/test-helpers';

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

// Mock node:crypto
vi.mock('node:crypto', () => ({
  timingSafeEqual: vi.fn((a, b) => {
    if (a.length !== b.length) return false;
    return a.equals(b);
  }),
}));

// Mock data-layer services
const mockSyncChangelogEntry = vi.fn();

vi.mock('@heyclaude/data-layer', async () => {
  // Import actual modules to get PrismockClient (via __mocks__/@prisma/client.ts)
  const actual = await vi.importActual<typeof import('@heyclaude/data-layer')>('@heyclaude/data-layer');
  return {
    ...actual,
    ChangelogService: class {
      syncChangelogEntry = mockSyncChangelogEntry;
    },
    // prisma is already exported from actual (will be PrismockClient in tests)
  };
});

// Don't mock pgmq-client - let it use the real function with PrismockClient
// pgmqSend imports prisma from @heyclaude/data-layer, which will be PrismockClient in tests

// Mock shared-runtime
vi.mock('@heyclaude/shared-runtime', () => ({
  requireEnvVar: vi.fn((key: string) => {
    if (key === 'CHANGELOG_SYNC_TOKEN') {
      return process.env['CHANGELOG_SYNC_TOKEN'] || 'test-token';
    }
    throw new Error(`Missing env var: ${key}`);
  }),
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
  postCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  handleOptionsRequest: vi.fn((corsHeaders) => {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
          body: await request.json().catch(() => ({})),
        });
        // Handler returns NextResponse from jsonResponse, factory returns it as-is
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
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      });
    };
  }),
}));

describe('POST /api/changelog/sync', () => {
  let prismock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env['CHANGELOG_SYNC_TOKEN'] = 'test-token';
    
    // Get PrismockClient instance (automatically provided via __mocks__/@prisma/client.ts)
    const { prisma } = await import('@heyclaude/data-layer');
    prismock = prisma;
    
    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }
    
    // Prismock doesn't support $queryRawUnsafe, so we mock it for pgmqSend
    // pgmqSend uses prisma.$queryRawUnsafe internally
    const queryRawUnsafeSpy = vi.fn().mockResolvedValue([{ msg_id: BigInt(1) }]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;
  });

  it('should return 200 when changelog is synced successfully', async () => {
    // Use the same Date object to ensure created_at === updated_at (new entry)
    // CRITICAL: Must be the exact same object reference for === comparison
    const sameDate = new Date('2025-12-07T00:00:00Z');
    const mockChangelogData = {
      id: 'test-id',
      slug: '1-2-0-2025-12-07',
      created_at: sameDate,
      updated_at: sameDate, // Same object reference ensures === comparison
      tldr: 'Test summary',
    };

    // Ensure mock returns the exact object (not a copy)
    mockSyncChangelogEntry.mockImplementation(async () => {
      return mockChangelogData;
    });

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/changelog/sync',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        version: '1.2.0',
        date: '2025-12-07',
        content: 'Test content',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('id', 'test-id');
    expect(body).toHaveProperty('message', 'Changelog entry synced successfully');
    expect(body).toHaveProperty('slug', '1-2-0-2025-12-07');
    expect(mockSyncChangelogEntry).toHaveBeenCalled();
    // Verify isNewEntry is true (created_at === updated_at)
    // pgmqSend should have been called (uses prisma.$queryRawUnsafe which is mocked)
    expect((prismock as any).$queryRawUnsafe).toHaveBeenCalled();
  });

  it('should return 401 when token is missing', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/changelog/sync',
      body: {
        version: '1.2.0',
        date: '2025-12-07',
        content: 'Test content',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 401);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    expect(mockSyncChangelogEntry).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/changelog/sync',
      headers: {
        authorization: 'Bearer wrong-token',
      },
      body: {
        version: '1.2.0',
        date: '2025-12-07',
        content: 'Test content',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 401);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    expect(mockSyncChangelogEntry).not.toHaveBeenCalled();
  });

  it('should return 200 when entry already exists', async () => {
    const mockChangelogData = {
      id: 'test-id',
      slug: '1-2-0-2025-12-07',
      created_at: new Date('2025-12-06'),
      updated_at: new Date('2025-12-07'), // Different from created_at = existing entry
      tldr: 'Test summary',
    };

    mockSyncChangelogEntry.mockResolvedValue(mockChangelogData);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/changelog/sync',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        version: '1.2.0',
        date: '2025-12-07',
        content: 'Test content',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('message', 'Entry already exists');
    // Should not enqueue for existing entries (isNewEntry is false)
    expect((prismock as any).$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle optional fields correctly', async () => {
    const mockChangelogData = {
      id: 'test-id',
      slug: '1-2-0-2025-12-07',
      created_at: new Date('2025-12-07'),
      updated_at: new Date('2025-12-07'),
      tldr: null,
    };

    mockSyncChangelogEntry.mockResolvedValue(mockChangelogData);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/changelog/sync',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        version: '1.2.0',
        date: '2025-12-07',
        content: 'Test content',
        tldr: 'Test summary',
        whatChanged: 'Test changes',
        sections: {
          Added: ['Feature 1'],
        },
        rawContent: 'Raw markdown',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('success', true);
    expect(mockSyncChangelogEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        p_content: 'Test content',
        p_date: '2025-12-07',
        p_version: '1.2.0',
        p_tldr: 'Test summary',
        p_what_changed: 'Test changes',
        p_sections: { Added: ['Feature 1'] },
        p_raw_content: 'Raw markdown',
      })
    );
  });

  it('should handle notification enqueue failure gracefully', async () => {
    // Use the same Date object to ensure created_at === updated_at (new entry)
    const sameDate = new Date('2025-12-07T00:00:00Z');
    const mockChangelogData = {
      id: 'test-id',
      slug: '1-2-0-2025-12-07',
      created_at: sameDate,
      updated_at: sameDate, // Same object reference ensures === comparison
      tldr: 'Test summary',
    };

    mockSyncChangelogEntry.mockResolvedValue(mockChangelogData);
    // Make $queryRawUnsafe throw to simulate pgmqSend failure
    (prismock as any).$queryRawUnsafe.mockRejectedValueOnce(new Error('Queue error'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/changelog/sync',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        version: '1.2.0',
        date: '2025-12-07',
        content: 'Test content',
      },
    });

    // Should still return 200 even if notification fails
    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('success', true);
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
