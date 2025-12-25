/**
 * Common Mock Utilities for Inngest Function Tests
 *
 * Provides reusable mock functions and setup utilities for testing Inngest functions.
 * This reduces boilerplate and ensures consistent mocking patterns across all tests.
 *
 * @module web-runtime/inngest/utils/test-mocks
 */

import { jest } from '@jest/globals';

/**
 * Logger mock factory
 */
export function createLoggerMock(): {
  info: ReturnType<typeof jest.fn>;
  warn: ReturnType<typeof jest.fn>;
  error: ReturnType<typeof jest.fn>;
  debug: ReturnType<typeof jest.fn>;
  child: ReturnType<typeof jest.fn>;
} {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn((context) => ({
      ...createLoggerMock(),
      ...context,
    })),
  };
}

/**
 * Service factory mock factory
 */
export function createServiceFactoryMock(): ReturnType<typeof jest.fn> {
  return jest.fn();
}

/**
 * Resend integration mocks factory
 */
export function createResendMocks(): {
  syncContactToResend: ReturnType<typeof jest.fn>;
  buildContactProperties: ReturnType<typeof jest.fn>;
  resolveNewsletterInterest: ReturnType<typeof jest.fn>;
  sendEmail: ReturnType<typeof jest.fn>;
  enrollInOnboardingSequence: ReturnType<typeof jest.fn>;
} {
  return {
    syncContactToResend: jest.fn(),
    buildContactProperties: jest.fn(),
    resolveNewsletterInterest: jest.fn(),
    sendEmail: jest.fn(),
    enrollInOnboardingSequence: jest.fn(),
  };
}

/**
 * PGMQ client mocks factory
 */
export function createPgmqMocks(): {
  pgmqRead: ReturnType<typeof jest.fn>;
  pgmqDelete: ReturnType<typeof jest.fn>;
} {
  return {
    pgmqRead: jest.fn(),
    pgmqDelete: jest.fn(),
  };
}

/**
 * Next.js cache mocks factory
 */
export function createCacheMocks(): {
  revalidateTag: ReturnType<typeof jest.fn>;
  revalidatePath: ReturnType<typeof jest.fn>;
} {
  return {
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
  };
}

/**
 * Monitoring mocks factory
 */
export function createMonitoringMocks(): {
  sendCronSuccessHeartbeat: ReturnType<typeof jest.fn>;
  sendCriticalFailureHeartbeat: ReturnType<typeof jest.fn>;
} {
  return {
    sendCronSuccessHeartbeat: jest.fn(),
    sendCriticalFailureHeartbeat: jest.fn(),
  };
}

/**
 * Environment variable mock factory
 */
export function createEnvVarMock(
  envVars: Record<string, string | undefined> = {}
): ReturnType<typeof jest.fn> {
  return jest.fn((key: string) => {
    return envVars[key] ?? undefined;
  });
}

/**
 * Fetch mock factory
 */
export function createFetchMock(): ReturnType<typeof jest.fn> {
  return jest.fn();
}

/**
 * Create web app context mock factory
 */
export function createWebAppContextMock(
  operation: string,
  route: string
): ReturnType<typeof jest.fn> {
  return jest.fn(() => ({
    requestId: 'test-request-id',
    operation,
    route,
  }));
}

/**
 * Normalize error mock factory
 */
export function createNormalizeErrorMock(): ReturnType<typeof jest.fn> {
  return jest.fn((error: unknown) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  });
}

/**
 * Shared runtime mocks factory
 */
export function createSharedRuntimeMocks(): {
  validateEmail: ReturnType<typeof jest.fn>;
  normalizeError: ReturnType<typeof jest.fn>;
  getEnvVar: ReturnType<typeof jest.fn>;
} {
  return {
    validateEmail: jest.fn((email: string) => ({
      valid: true,
      normalized: email.toLowerCase().trim(),
      error: null,
    })),
    normalizeError: createNormalizeErrorMock(),
    getEnvVar: createEnvVarMock(),
  };
}

/**
 * Complete mock setup for common Inngest function dependencies
 */
export interface InngestTestMocks {
  logger: ReturnType<typeof createLoggerMock>;
  serviceFactory: ReturnType<typeof createServiceFactoryMock>;
  resend?: ReturnType<typeof createResendMocks>;
  pgmq?: ReturnType<typeof createPgmqMocks>;
  cache?: ReturnType<typeof createCacheMocks>;
  monitoring?: ReturnType<typeof createMonitoringMocks>;
  envVar?: ReturnType<typeof createEnvVarMock>;
  fetch?: ReturnType<typeof createFetchMock>;
  webAppContext?: ReturnType<typeof createWebAppContextMock>;
  sharedRuntime?: ReturnType<typeof createSharedRuntimeMocks>;
}

/**
 * Setup all common mocks for Inngest function tests
 */
export function setupInngestTestMocks(
  operation: string,
  route: string,
  options: {
    includeResend?: boolean;
    includePgmq?: boolean;
    includeCache?: boolean;
    includeMonitoring?: boolean;
    envVars?: Record<string, string | undefined>;
  } = {}
): InngestTestMocks {
  const mocks: InngestTestMocks = {
    logger: createLoggerMock(),
    serviceFactory: createServiceFactoryMock(),
  };

  if (options.includeResend) {
    mocks.resend = createResendMocks();
  }

  if (options.includePgmq) {
    mocks.pgmq = createPgmqMocks();
  }

  if (options.includeCache) {
    mocks.cache = createCacheMocks();
  }

  if (options.includeMonitoring) {
    mocks.monitoring = createMonitoringMocks();
  }

  mocks.envVar = createEnvVarMock(options.envVars);
  mocks.fetch = createFetchMock();
  mocks.webAppContext = createWebAppContextMock(operation, route);
  mocks.sharedRuntime = createSharedRuntimeMocks();

  return mocks;
}

/**
 * Reset all mocks to clean state
 */
export function resetInngestTestMocks(mocks: InngestTestMocks): void {
  jest.clearAllMocks();

  if (mocks.resend) {
    Object.values(mocks.resend).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReset' in mock) {
        mock.mockReset();
      }
    });
  }

  if (mocks.pgmq) {
    Object.values(mocks.pgmq).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReset' in mock) {
        mock.mockReset();
      }
    });
  }

  if (mocks.cache) {
    Object.values(mocks.cache).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReset' in mock) {
        mock.mockReset();
      }
    });
  }

  if (mocks.monitoring) {
    Object.values(mocks.monitoring).forEach((mock) => {
      if (typeof mock === 'function' && 'mockReset' in mock) {
        mock.mockReset();
      }
    });
  }

  if (mocks.fetch) {
    mocks.fetch.mockReset();
    // Default fetch to success response
    mocks.fetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  }
}
