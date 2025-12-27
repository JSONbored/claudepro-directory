/**
 * Trending Metrics Calculation Inngest Function Integration Tests
 *
 * Tests calculateTrendingMetrics function → TrendingService → database flow.
 * Uses InngestTestEngine, Prismocker for in-memory database, and real service factory.
 *
 * @group Inngest
 * @group Trending
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { calculateTrendingMetrics } from './calculate-metrics';

// Mock service-factory to return REAL services (not mocked services) for integration testing
// This allows us to test the complete flow: Inngest function → TrendingService → database
jest.mock('../../../data/service-factory', () => {
  // Import real service factory to return real services
  const actual = jest.requireActual('../../../data/service-factory');
  return {
    ...actual,
    getService: actual.getService, // Use real getService which returns real services
  };
});

jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'calculateTrendingMetrics',
    route: '/inngest/trending/calculate-metrics',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

jest.mock('@heyclaude/shared-runtime', () => {
  const mockNormalizeError = jest.fn((error: unknown, fallbackMessage?: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  return {
    normalizeError: mockNormalizeError,
    __mockNormalizeError: mockNormalizeError,
  };
});

jest.mock('../../utils/monitoring', () => ({
  isBetterStackMonitoringEnabled: jest.fn().mockReturnValue(false),
  isInngestMonitoringEnabled: jest.fn().mockReturnValue(false),
  isCriticalFailureMonitoringEnabled: jest.fn().mockReturnValue(false),
  isCronSuccessMonitoringEnabled: jest.fn().mockReturnValue(false),
  isApiEndpointMonitoringEnabled: jest.fn().mockReturnValue(false),
  sendBetterStackHeartbeat: jest.fn(),
  sendCriticalFailureHeartbeat: jest.fn(),
  sendCronSuccessHeartbeat: jest.fn(),
  sendApiEndpointHeartbeat: jest.fn(),
}));

// Import Prismocker for database integration testing
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Import function AFTER mocks are set up
describe('calculateTrendingMetrics', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Prismocker instance for database integration testing
   */
  let prismocker: PrismaClient;

  /**
   * Mock functions - accessed via jest.requireMock
   */
  let mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  let mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  let mockNormalizeError: ReturnType<typeof jest.fn>;

  /**
   * Setup before each test
   */
  beforeEach(() => {
    // Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Get mocked functions via jest.requireMock
    const loggingMock = jest.requireMock('../../../logging/server') as {
      __mockLogger: {
        info: ReturnType<typeof jest.fn>;
        warn: ReturnType<typeof jest.fn>;
        error: ReturnType<typeof jest.fn>;
      };
      __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
    };
    const sharedRuntimeMock = jest.requireMock('@heyclaude/shared-runtime') as {
      __mockNormalizeError: ReturnType<typeof jest.fn>;
    };

    mockLogger = loggingMock.__mockLogger;
    mockCreateWebAppContextWithId = loggingMock.__mockCreateWebAppContextWithId;
    mockNormalizeError = sharedRuntimeMock.__mockNormalizeError;

    // Set up $queryRawUnsafe for RPC testing (refreshTrendingMetricsView uses callRpc → $queryRawUnsafe)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: calculateTrendingMetrics,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Restore mock implementations after reset
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'calculateTrendingMetrics',
      route: '/inngest/trending/calculate-metrics',
    });

    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });
  });

  /**
   * Cleanup after each test to prevent open handles
   */
  afterEach(async () => {
    // Clear all timers
    jest.clearAllTimers();

    // Ensure all pending promises are resolved
    await new Promise((resolve) => setImmediate(resolve));

    // Clear the test engine reference to allow garbage collection
    (t as any) = null;
  });

  /**
   * Success case: Calculate metrics successfully
   *
   * Tests that trending metrics are calculated and materialized view is refreshed.
   */
  it('should calculate trending metrics successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { updated: number; created: number } };

    expect(result.updated).toBe(0);
    expect(result.created).toBe(0);

    // Verify RPC was called (real TrendingService.refreshTrendingMetricsView uses callRpc → $queryRawUnsafe)
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('refresh_trending_metrics_view')
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.anything(),
      'Materialized view refreshed successfully'
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedMetrics: 0,
        createdMetrics: 0,
      }),
      'Trending metrics calculation completed'
    );
  });

  /**
   * Error case: Materialized view refresh failure
   *
   * Tests that materialized view refresh failures are handled and function throws.
   */
  it('should handle materialized view refresh failure', async () => {
    // Simulate RPC failure by making $queryRawUnsafe throw an error
    (prismocker as any).$queryRawUnsafe = jest
      .fn<() => Promise<any[]>>()
      .mockRejectedValue(new Error('Database connection failed'));

    const { error } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { error?: Error };

    expect(error).toBeDefined();
    // The error message comes from the original error ("Database connection failed")
    // normalizeError preserves the original message if it's an Error instance
    expect(error?.message).toBe('Database connection failed');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
      }),
      'Failed to refresh materialized view'
    );
  });

  /**
   * Step test: calculate-time-metrics step
   *
   * Tests the calculate-time-metrics step individually.
   */
  it('should execute calculate-time-metrics step correctly', async () => {
    const { result } = (await t.executeStep('calculate-time-metrics', {
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { updated: number; created: number } };

    expect(result.updated).toBe(0);
    expect(result.created).toBe(0);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.anything(),
      'Time-windowed metrics calculation skipped (RPC removed)'
    );
  });

  /**
   * Step test: refresh-materialized-view step
   *
   * Tests the refresh-materialized-view step individually.
   */
  it('should execute refresh-materialized-view step correctly', async () => {
    // First execute calculate-time-metrics step
    await t.executeStep('calculate-time-metrics', {
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    });

    // Now execute full function to test refresh-materialized-view step
    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { updated: number; created: number } };

    expect(result.updated).toBe(0);
    expect(result.created).toBe(0);
    expect(mockTrendingService.refreshTrendingMetricsView).toHaveBeenCalled();
  });
});
