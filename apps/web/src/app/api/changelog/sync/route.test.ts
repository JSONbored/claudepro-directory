/**
 * Integration Tests for Changelog Sync API Route
 *
 * Tests the /api/changelog/sync endpoint which syncs changelog entries from CHANGELOG.md to database.
 * Uses real ChangelogService with Prismocker for integration testing.
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { POST, OPTIONS } from './route';
import {
  createMockRequest,
  getResponseBody,
  expectStatus,
  expectCorsHeaders,
} from '../../__helpers__/test-helpers';

// Import real cache utilities for proper cache testing
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock next/cache
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.requireActual('next/server').NextRequest,
  NextResponse: jest.requireActual('next/server').NextResponse,
  connection: jest.fn(async () => {}),
}));

// Mock node:crypto
jest.mock('node:crypto', () => ({
  timingSafeEqual: jest.fn((a, b) => {
    if (a.length !== b.length) return false;
    return a.equals(b);
  }),
}));

// Import prisma directly - don't use jest.requireActual
// Prisma is automatically PrismockerClient via __mocks__/@prisma/client.ts
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock data-layer services (use real ChangelogService, but mock other services to avoid side effects)
jest.mock('@heyclaude/data-layer', () => {
  const actual = jest.requireActual('@heyclaude/data-layer');
  return {
    ...actual, // Include all real exports (including ChangelogService)
    AccountService: class {},
    CompaniesService: class {},
    ContentService: class {},
    JobsService: class {},
    MiscService: class {},
    NewsletterService: class {},
    SearchService: class {},
    TrendingService: class {},
  };
});

// Mock shared-runtime
jest.mock('@heyclaude/shared-runtime', () => ({
  requireEnvVar: jest.fn((key: string) => {
    if (key === 'CHANGELOG_SYNC_TOKEN') {
      return process.env['CHANGELOG_SYNC_TOKEN'] || 'test-token';
    }
    throw new Error(`Missing env var: ${key}`);
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
// This ensures we test the complete flow: Route → Factory → Handler → Service → RPC → Database (Prismocker)

describe('POST /api/changelog/sync', () => {
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

    // 5. Set environment variable
    process.env['CHANGELOG_SYNC_TOKEN'] = 'test-token';

    // 6. Set up $queryRawUnsafe for RPC testing
    // ChangelogService.syncChangelogEntry uses callRpc → BasePrismaService.callRpc → $queryRawUnsafe
    // pgmqSend also uses prisma.$queryRawUnsafe internally
    // Default: return successful results for both RPC and pgmq
    prismocker.$queryRawUnsafe = jest
      .fn()
      .mockResolvedValue([{ msg_id: BigInt(1) }]) as unknown as typeof prismocker.$queryRawUnsafe;
  });

  it('should return 200 when changelog is synced successfully', async () => {
    // Use the same Date object to ensure created_at === updated_at (new entry)
    // CRITICAL: Must be the exact same object reference for === comparison
    const sameDate = new Date('2025-12-07T00:00:00Z');
    const mockChangelogData = [
      {
        id: 'test-id',
        slug: '1-2-0-2025-12-07',
        created_at: sameDate,
        updated_at: sameDate, // Same object reference ensures === comparison
        tldr: 'Test summary',
      },
    ];

    // Mock RPC response for sync_changelog_entry
    // ChangelogService.syncChangelogEntry calls callRpc which uses $queryRawUnsafe
    // RPC returns TABLE(...) which is an array, so we return array
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce(
      mockChangelogData as any
    );

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

    // Verify RPC was called for sync_changelog_entry
    // Arguments are passed in object key insertion order: p_version, p_date, p_content
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('sync_changelog_entry'),
      '1.2.0', // p_version (first in insertion order)
      '2025-12-07', // p_date
      'Test content' // p_content
    );

    // Verify isNewEntry is true (created_at === updated_at)
    // pgmqSend should have been called (uses prisma.$queryRawUnsafe which is mocked)
    // pgmqSend is called after successful sync, so $queryRawUnsafe should be called at least twice
    // (once for sync_changelog_entry, once for pgmqSend)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2);
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
    // Verify RPC was not called (authentication failed before service call)
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
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
    // Verify RPC was not called (authentication failed before service call)
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 200 when entry already exists', async () => {
    // Different dates = existing entry (created_at !== updated_at)
    const mockChangelogData = [
      {
        id: 'test-id',
        slug: '1-2-0-2025-12-07',
        created_at: new Date('2025-12-06'),
        updated_at: new Date('2025-12-07'), // Different from created_at = existing entry
        tldr: 'Test summary',
      },
    ];

    // Mock RPC response for sync_changelog_entry (existing entry)
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce(
      mockChangelogData as any
    );

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
    // Verify RPC was called for sync_changelog_entry
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('sync_changelog_entry'),
      '1.2.0',
      '2025-12-07',
      'Test content'
    );
    // Should not enqueue for existing entries (isNewEntry is false)
    // Only one call (sync_changelog_entry), no pgmqSend call
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('should handle optional fields correctly', async () => {
    const sameDate = new Date('2025-12-07T00:00:00Z');
    const mockChangelogData = [
      {
        id: 'test-id',
        slug: '1-2-0-2025-12-07',
        created_at: sameDate,
        updated_at: sameDate,
        tldr: null,
      },
    ];

    // Mock RPC response for sync_changelog_entry
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce(
      mockChangelogData as any
    );

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

    // Verify RPC was called with all optional fields
    // Arguments are passed in object key insertion order
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('sync_changelog_entry'),
      '1.2.0', // p_version
      '2025-12-07', // p_date
      'Test content', // p_content
      expect.objectContaining({ version: '1.2.0' }), // p_metadata
      'Test summary', // p_tldr
      'Test changes', // p_what_changed
      { Added: ['Feature 1'] }, // p_sections
      'Raw markdown' // p_raw_content
    );
  });

  it('should handle notification enqueue failure gracefully', async () => {
    // Use the same Date object to ensure created_at === updated_at (new entry)
    const sameDate = new Date('2025-12-07T00:00:00Z');
    const mockChangelogData = [
      {
        id: 'test-id',
        slug: '1-2-0-2025-12-07',
        created_at: sameDate,
        updated_at: sameDate, // Same object reference ensures === comparison
        tldr: 'Test summary',
      },
    ];

    // Mock RPC response for sync_changelog_entry (success)
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce(
      mockChangelogData as any
    );
    // Make $queryRawUnsafe throw on second call to simulate pgmqSend failure
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValueOnce(
      new Error('Queue error')
    );

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

    // Should still return 200 even if notification fails (non-fatal error)
    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expect(body).toHaveProperty('success', true);
    // Verify sync_changelog_entry was called (first call)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('sync_changelog_entry'),
      '1.2.0',
      '2025-12-07',
      'Test content'
    );
    // Verify pgmqSend was attempted (second call, which failed)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2);
  });

  it('should return 401 when CHANGELOG_SYNC_TOKEN is not configured', async () => {
    // Remove environment variable
    delete process.env['CHANGELOG_SYNC_TOKEN'];

    // Mock requireEnvVar to throw
    const { requireEnvVar } = jest.requireMock('@heyclaude/shared-runtime');
    requireEnvVar.mockImplementationOnce(() => {
      throw new Error('CHANGELOG_SYNC_TOKEN is required');
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

    expectStatus(response, 401);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    // Verify RPC was not called
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();

    // Restore environment variable
    process.env['CHANGELOG_SYNC_TOKEN'] = 'test-token';
  });

  it('should return 400 when request body is invalid', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/changelog/sync',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: {
        // Missing required fields: version, date, content
        tldr: 'Test summary',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    // createApiRoute factory validates body and returns 400 for invalid input
    expectStatus(response, 400);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    // Verify RPC was not called (validation failed before service call)
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should return 500 when syncChangelogEntry returns null', async () => {
    // Mock RPC to return empty array (service returns null)
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValueOnce([]);

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

    // Route throws error when syncChangelogEntry returns null
    expectStatus(response, 500);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('sync_changelog_entry'),
      '1.2.0',
      '2025-12-07',
      'Test content'
    );
  });

  it('should return 500 when service throws error', async () => {
    // Mock RPC to throw error
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValueOnce(
      new Error('Database error')
    );

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

    // createApiRoute factory catches errors and returns 500
    expectStatus(response, 500);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('error');
    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('sync_changelog_entry'),
      '1.2.0',
      '2025-12-07',
      'Test content'
    );
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
