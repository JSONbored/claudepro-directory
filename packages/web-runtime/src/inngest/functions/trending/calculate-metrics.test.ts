/**
 * Trending Metrics Calculation Inngest Function Tests
 *
 * Tests the calculateTrendingMetrics function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/trending/calculate-metrics.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { calculateTrendingMetrics } from './calculate-metrics';

// Mock service factory, logging, shared-runtime, and monitoring
jest.mock('../../../data/service-factory', () => {
  const mockGetService = jest.fn();
  return {
    getService: mockGetService,
    __mockGetService: mockGetService,
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

// Import function AFTER mocks are set up
describe('calculateTrendingMetrics', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Mock functions - accessed via jest.requireMock
   */
  let mockGetService: ReturnType<typeof jest.fn>;
  let mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  let mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  let mockNormalizeError: ReturnType<typeof jest.fn>;
  let mockTrendingService: {
    refreshTrendingMetricsView: ReturnType<typeof jest.fn>;
  };

  /**
   * Setup before each test
   */
  beforeEach(() => {
    // Get mocked functions via jest.requireMock
    const serviceFactoryMock = jest.requireMock('../../../data/service-factory') as {
      __mockGetService: ReturnType<typeof jest.fn>;
    };
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

    mockGetService = serviceFactoryMock.__mockGetService;
    mockLogger = loggingMock.__mockLogger;
    mockCreateWebAppContextWithId = loggingMock.__mockCreateWebAppContextWithId;
    mockNormalizeError = sharedRuntimeMock.__mockNormalizeError;

    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: calculateTrendingMetrics,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockGetService.mockReset();

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

    // Set up mock TrendingService
    mockTrendingService = {
      refreshTrendingMetricsView: jest.fn().mockResolvedValue(undefined),
    };

    mockGetService.mockResolvedValue(mockTrendingService as never);
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

    expect(mockTrendingService.refreshTrendingMetricsView).toHaveBeenCalled();

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
    mockTrendingService.refreshTrendingMetricsView.mockRejectedValue(
      new Error('Database connection failed')
    );

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

