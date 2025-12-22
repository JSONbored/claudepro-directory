/**
 * Common Mock Utilities for Inngest Function Tests
 *
 * Provides reusable mock functions and setup utilities for testing Inngest functions.
 * This reduces boilerplate and ensures consistent mocking patterns across all tests.
 *
 * @module web-runtime/inngest/utils/test-mocks
 */

import { vi } from 'vitest';

/**
 * Logger mock factory
 */
export function createLoggerMock(): {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  child: ReturnType<typeof vi.fn>;
} {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn((context) => ({
      ...createLoggerMock(),
      ...context,
    })),
  };
}

/**
 * Service factory mock factory
 */
export function createServiceFactoryMock(): ReturnType<typeof vi.fn> {
  return vi.fn();
}

/**
 * Resend integration mocks factory
 */
export function createResendMocks(): {
  syncContactToResend: ReturnType<typeof vi.fn>;
  buildContactProperties: ReturnType<typeof vi.fn>;
  resolveNewsletterInterest: ReturnType<typeof vi.fn>;
  sendEmail: ReturnType<typeof vi.fn>;
  enrollInOnboardingSequence: ReturnType<typeof vi.fn>;
} {
  return {
    syncContactToResend: vi.fn(),
    buildContactProperties: vi.fn(),
    resolveNewsletterInterest: vi.fn(),
    sendEmail: vi.fn(),
    enrollInOnboardingSequence: vi.fn(),
  };
}

/**
 * PGMQ client mocks factory
 */
export function createPgmqMocks(): {
  pgmqRead: ReturnType<typeof vi.fn>;
  pgmqDelete: ReturnType<typeof vi.fn>;
} {
  return {
    pgmqRead: vi.fn(),
    pgmqDelete: vi.fn(),
  };
}

/**
 * Next.js cache mocks factory
 */
export function createCacheMocks(): {
  revalidateTag: ReturnType<typeof vi.fn>;
  revalidatePath: ReturnType<typeof vi.fn>;
} {
  return {
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
  };
}

/**
 * Monitoring mocks factory
 */
export function createMonitoringMocks(): {
  sendCronSuccessHeartbeat: ReturnType<typeof vi.fn>;
  sendCriticalFailureHeartbeat: ReturnType<typeof vi.fn>;
} {
  return {
    sendCronSuccessHeartbeat: vi.fn(),
    sendCriticalFailureHeartbeat: vi.fn(),
  };
}

/**
 * Environment variable mock factory
 */
export function createEnvVarMock(envVars: Record<string, string | undefined> = {}): ReturnType<typeof vi.fn> {
  return vi.fn((key: string) => {
    return envVars[key] ?? undefined;
  });
}

/**
 * Fetch mock factory
 */
export function createFetchMock(): ReturnType<typeof vi.fn> {
  return vi.fn();
}

/**
 * Create web app context mock factory
 */
export function createWebAppContextMock(operation: string, route: string): ReturnType<typeof vi.fn> {
  return vi.fn(() => ({
    requestId: 'test-request-id',
    operation,
    route,
  }));
}

/**
 * Normalize error mock factory
 */
export function createNormalizeErrorMock(): ReturnType<typeof vi.fn> {
  return vi.fn((error: unknown) => {
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
  validateEmail: ReturnType<typeof vi.fn>;
  normalizeError: ReturnType<typeof vi.fn>;
  getEnvVar: ReturnType<typeof vi.fn>;
} {
  return {
    validateEmail: vi.fn((email: string) => ({
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
  vi.clearAllMocks();

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

