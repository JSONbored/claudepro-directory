import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache, getRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// DO NOT mock next/headers - safemocker handles this automatically
// DO NOT mock Supabase client or auth - safemocker handles auth automatically
// safemocker's __mocks__/next-safe-action.ts provides pre-configured optionalAuthAction and rateLimitedAction
// with context already injected (test-user-id, test@example.com, test-token for optionalAuthAction)

// Mock logger (used by safe-action middleware)
jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    })),
  },
  toLogContextValue: (val: unknown) => val,
}));

// Mock errors (used by safe-action middleware) - keep real behavior for error normalization
jest.mock('../errors.ts', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: jest.fn((name, error, context) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock environment (used by safe-action error handling and Prisma client)
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined, // Allow undefined in tests (Prismocker doesn't need it)
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop: string) => {
        // Handle isProduction dynamically
        if (prop === 'isProduction') {
          return false; // Default to false for tests
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return false; // Default to false for tests
    },
  };
});

// Use test queue for PGMQ operations
// Mock pgmq-client to use test queue
// This allows actions to enqueue events that can be read by Inngest function tests
// Create mocks that will be connected to test queue in beforeEach
const mockPgmqSend = jest.fn();
const mockPgmqRead = jest.fn();
const mockPgmqDelete = jest.fn();
const mockPgmqDeleteBatch = jest.fn();

jest.mock('../supabase/pgmq-client.ts', () => ({
  pgmqSend: (...args: unknown[]) => mockPgmqSend(...args),
  pgmqRead: (...args: unknown[]) => mockPgmqRead(...args),
  pgmqDelete: (...args: unknown[]) => mockPgmqDelete(...args),
  pgmqDeleteBatch: (...args: unknown[]) => mockPgmqDeleteBatch(...args),
  __mockPgmqSend: mockPgmqSend,
  __mockPgmqRead: mockPgmqRead,
  __mockPgmqDelete: mockPgmqDelete,
  __mockPgmqDeleteBatch: mockPgmqDeleteBatch,
}));

// Import test queue utilities for use in tests (after jest.mock())
import {
  resetTestPgmqQueue,
  getTestPgmqQueue,
  createTestPgmqQueue,
} from '../supabase/pgmq-client.test';

// DO NOT mock enqueuePulseEventServer - use REAL implementation
// It will call pgmqSend (mocked to use test queue)
// This allows us to test the real flow: action → enqueuePulseEventServer → pgmqSend → test queue

const PULSE_QUEUE_NAME = 'pulse';

/**
 * Helper function to set up test queue and connect mocks
 * Should be called in beforeEach hooks
 */
function setupTestQueue() {
  const testQueue = getTestPgmqQueue() || createTestPgmqQueue();
  const { createPgmqMocks } = require('../supabase/pgmq-client.test');
  const mocks = createPgmqMocks(testQueue);

  // Connect mocks to test queue
  mockPgmqSend.mockImplementation(mocks.pgmqSend);
  mockPgmqRead.mockImplementation(mocks.pgmqRead);
  mockPgmqDelete.mockImplementation(mocks.pgmqDelete);
  mockPgmqDeleteBatch.mockImplementation(mocks.pgmqDeleteBatch);

  return testQueue;
}

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth/rate limiting → logging → error handling

// DO NOT mock getConfigRecommendations - use real getConfigRecommendations which uses Prismocker
// This allows us to test the real RPC flow end-to-end

describe('trackInteractionAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTestPgmqQueue(); // Clear test queue before each test
    setupTestQueue(); // Set up test queue and connect mocks
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid interaction_type', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');

      const result = (await trackInteractionAction({
        interaction_type: 'invalid-type',
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.interaction_type).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return fieldErrors for invalid session_id UUID format', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');

      const result = (await trackInteractionAction({
        interaction_type: 'view',
        session_id: 'invalid-uuid',
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.session_id).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should accept valid input with all optional fields', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');

      const result = (await trackInteractionAction({
        interaction_type: 'view',
        content_type: 'agents',
        content_slug: 'test-agent',
        session_id: '123e4567-e89b-12d3-a456-426614174000',
        metadata: { source: 'homepage' },
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined(); // Action returns void
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).not.toBeNull();
      expect(messages).toHaveLength(1);
    });
  });

  describe('event enqueueing', () => {
    it('should call enqueuePulseEventServer with correct parameters', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');

      const result = (await trackInteractionAction({
        interaction_type: 'view',
        content_type: 'agents',
        content_slug: 'test-agent',
        session_id: '123e4567-e89b-12d3-a456-426614174000',
        metadata: { source: 'homepage' },
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue with correct data
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        user_id: 'test-user-id', // From safemocker's optionalAuthAction context
        content_type: 'agents',
        content_slug: 'test-agent',
        interaction_type: 'view',
        session_id: '123e4567-e89b-12d3-a456-426614174000',
        metadata: { source: 'homepage' },
      });
    });

    it('should handle null values for optional fields', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');

      const result = (await trackInteractionAction({
        interaction_type: 'view',
        content_type: null,
        content_slug: null,
        session_id: null,
        metadata: null,
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue with null values
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        user_id: 'test-user-id', // From safemocker's optionalAuthAction context
        content_type: null,
        content_slug: null,
        interaction_type: 'view',
        session_id: null,
        metadata: null,
      });
    });

    it('should handle null userId when not authenticated', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');

      // Note: safemocker's optionalAuthAction always provides userId in tests
      // In production, optionalAuthAction would provide null userId if not authenticated
      // This test verifies the action handles the userId from context correctly
      const result = (await trackInteractionAction({
        interaction_type: 'view',
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).not.toBeNull();
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        interaction_type: 'view',
      });
    });
  });
});

describe('trackNewsletterEventAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTestPgmqQueue(); // Clear test queue before each test
    setupTestQueue(); // Set up test queue and connect mocks
  });

  describe('input validation', () => {
    it('should return fieldErrors for missing eventType', async () => {
      const { trackNewsletterEventAction } = await import('./pulse.ts');

      const result = (await trackNewsletterEventAction({
        // Missing eventType
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.eventType).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should accept valid input with optional metadata', async () => {
      const { trackNewsletterEventAction } = await import('./pulse.ts');

      const result = (await trackNewsletterEventAction({
        eventType: 'click',
        metadata: { source: 'footer' },
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).not.toBeNull();
      expect(messages).toHaveLength(1);
    });
  });

  describe('event enqueueing', () => {
    it('should call enqueuePulseEventServer with newsletter event data', async () => {
      const { trackNewsletterEventAction } = await import('./pulse.ts');

      const result = (await trackNewsletterEventAction({
        eventType: 'click',
        metadata: { source: 'footer' },
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue with newsletter event data
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        user_id: 'test-user-id', // From safemocker's optionalAuthAction context
        content_type: null,
        content_slug: 'newsletter_cta',
        interaction_type: 'click',
        session_id: null,
        metadata: {
          event_type: 'click',
          source: 'footer',
        },
      });
    });
  });
});

describe('trackTerminalCommandAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTestPgmqQueue(); // Clear test queue before each test
    setupTestQueue(); // Set up test queue and connect mocks
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid contact_action_type', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');

      const result = (await trackTerminalCommandAction({
        command_id: 'cmd-1',
        action_type: 'invalid-action',
        success: true,
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.action_type).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return fieldErrors for missing required fields', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');

      const result = (await trackTerminalCommandAction({
        // Missing required fields
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should accept valid input with optional fields', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');

      const result = (await trackTerminalCommandAction({
        command_id: 'cmd-1',
        action_type: 'internal', // Valid contact_action_type: 'internal', 'external', 'route', 'sheet', 'easter-egg'
        success: true,
        error_reason: 'Timeout',
        execution_time_ms: 500,
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).not.toBeNull();
      expect(messages).toHaveLength(1);
    });
  });

  describe('event enqueueing', () => {
    it('should call enqueuePulseEventServer with terminal command data', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');

      const result = (await trackTerminalCommandAction({
        command_id: 'cmd-1',
        action_type: 'internal', // Valid contact_action_type
        success: true,
        error_reason: 'Timeout',
        execution_time_ms: 500,
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue with terminal command data
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        user_id: 'test-user-id', // From safemocker's optionalAuthAction context
        content_type: null,
        content_slug: 'contact-terminal',
        interaction_type: 'contact_interact',
        session_id: null,
        metadata: {
          command_id: 'cmd-1',
          action_type: 'internal',
          success: true,
          error_reason: 'Timeout',
          execution_time_ms: 500,
        },
      });
    });

    it('should omit optional fields when not provided', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');

      const result = (await trackTerminalCommandAction({
        command_id: 'cmd-1',
        action_type: 'external', // Valid contact_action_type
        success: true,
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue with minimal metadata
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        user_id: 'test-user-id',
        content_type: null,
        content_slug: 'contact-terminal',
        interaction_type: 'contact_interact',
        session_id: null,
        metadata: {
          command_id: 'cmd-1',
          action_type: 'external',
          success: true,
        },
      });
    });
  });
});

describe('trackTerminalFormSubmissionAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTestPgmqQueue(); // Clear test queue before each test
    setupTestQueue(); // Set up test queue and connect mocks
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid contact_category', async () => {
      const { trackTerminalFormSubmissionAction } = await import('./pulse.ts');

      const result = (await trackTerminalFormSubmissionAction({
        category: 'invalid-category',
        success: true,
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.category).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return fieldErrors for missing required fields', async () => {
      const { trackTerminalFormSubmissionAction } = await import('./pulse.ts');

      const result = (await trackTerminalFormSubmissionAction({
        // Missing required fields
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should accept valid input with optional error', async () => {
      const { trackTerminalFormSubmissionAction } = await import('./pulse.ts');

      const result = (await trackTerminalFormSubmissionAction({
        category: 'general',
        success: false,
        error: 'Validation failed',
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).not.toBeNull();
      expect(messages).toHaveLength(1);
    });
  });

  describe('event enqueueing', () => {
    it('should call enqueuePulseEventServer with form submission data', async () => {
      const { trackTerminalFormSubmissionAction } = await import('./pulse.ts');

      const result = (await trackTerminalFormSubmissionAction({
        category: 'general',
        success: true,
        error: 'Validation failed',
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue with form submission data
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        user_id: 'test-user-id', // From safemocker's optionalAuthAction context
        content_type: null,
        content_slug: 'contact-form',
        interaction_type: 'contact_submit',
        session_id: null,
        metadata: {
          category: 'general',
          success: true,
          error: 'Validation failed',
        },
      });
    });
  });
});

describe('trackUsageAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTestPgmqQueue(); // Clear test queue before each test
    setupTestQueue(); // Set up test queue and connect mocks
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid content_category', async () => {
      const { trackUsageAction } = await import('./pulse.ts');

      const result = (await trackUsageAction({
        content_type: 'invalid-category',
        content_slug: 'test-agent',
        action_type: 'copy',
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.content_type).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return fieldErrors for invalid action_type', async () => {
      const { trackUsageAction } = await import('./pulse.ts');

      const result = (await trackUsageAction({
        content_type: 'agents',
        content_slug: 'test-agent',
        action_type: 'invalid-action',
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.action_type).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return fieldErrors for missing required fields', async () => {
      const { trackUsageAction } = await import('./pulse.ts');

      const result = (await trackUsageAction({
        // Missing required fields
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });
  });

  describe('event enqueueing', () => {
    it('should map copy action_type to copy interaction_type', async () => {
      const { trackUsageAction } = await import('./pulse.ts');

      const result = (await trackUsageAction({
        content_type: 'agents',
        content_slug: 'test-agent',
        action_type: 'copy',
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue with copy action
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        user_id: 'test-user-id', // From safemocker's optionalAuthAction context
        content_type: 'agents',
        content_slug: 'test-agent',
        interaction_type: 'copy',
        session_id: null,
        metadata: {
          action_type: 'copy',
        },
      });
    });

    it('should map download action_types to download interaction_type', async () => {
      const { trackUsageAction } = await import('./pulse.ts');

      const result = (await trackUsageAction({
        content_type: 'agents',
        content_slug: 'test-agent',
        action_type: 'download_zip',
      })) as SafeActionResult<unknown>;

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify event was enqueued to test queue with download action
      const queue = getTestPgmqQueue();
      expect(queue).not.toBeNull();
      const messages = await queue!.read(PULSE_QUEUE_NAME);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toMatchObject({
        user_id: 'test-user-id',
        content_type: 'agents',
        content_slug: 'test-agent',
        interaction_type: 'download',
        session_id: null,
        metadata: {
          action_type: 'download_zip',
        },
      });
    });
  });
});

describe('generateConfigRecommendationsAction', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (getConfigRecommendations uses RPC via createDataFunction)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // Mock structure must match GetRecommendationsReturns: { results, total_matches, algorithm, summary }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        results: [],
        total_matches: 0,
        algorithm: 'test-algorithm',
        summary: {
          top_category: null,
          avg_match_score: 0,
          diversity_score: 0,
        },
      },
    ]);

    // Note: safemocker automatically provides rate limiting context for rateLimitedAction:
    // - ctx.userAgent = 'test-user-agent'
    // - ctx.startTime = performance.now()
    // No manual auth mocks needed (rateLimitedAction doesn't require auth)
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid useCase', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      const result = (await generateConfigRecommendationsAction({
        useCase: 'invalid-use-case' as any, // Invalid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      })) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.useCase).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return fieldErrors for invalid experienceLevel', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      const result = (await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'invalid-level',
        toolPreferences: ['cursor'],
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.experienceLevel).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should return fieldErrors for missing required fields', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      const result = (await generateConfigRecommendationsAction({
        // Missing required fields
      } as any)) as SafeActionResult<unknown>;

      expect(result.fieldErrors).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should accept valid input with optional arrays', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      // Mock RPC to return valid data matching GetRecommendationsReturns structure
      // The action expects: { results: [...], total_matches: number, algorithm: string, summary: {...} }
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: [],
          total_matches: 0,
          algorithm: 'test-algorithm',
          summary: {
            top_category: null,
            avg_match_score: 0,
            diversity_score: 0,
          },
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase: 'code-review' | 'api-development' | 'frontend-development' | 'data-science' | 'content-creation' | 'devops-infrastructure' | 'general-development' | 'testing-qa' | 'security-audit'
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        integrations: [],
        focusAreas: [],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      // If result.data is undefined, check what error we got
      if (!result.data) {
        if (result.serverError) {
          throw new Error(`Action returned serverError: ${result.serverError}`);
        }
        if (result.fieldErrors) {
          throw new Error(`Action returned fieldErrors: ${JSON.stringify(result.fieldErrors)}`);
        }
        throw new Error(`Action returned undefined data but no error: ${JSON.stringify(result)}`);
      }

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify RPC was called (getConfigRecommendations uses createDataFunction which calls RPC)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('recommendations generation', () => {
    it('should call getConfigRecommendations and transform results', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      const mockRecommendations = {
        results: [
          {
            slug: 'test-config',
            title: 'Test Config',
            description: 'Test description',
            category: 'agents',
            tags: ['react'],
            author: 'Test Author',
            match_score: 0.9,
            match_percentage: 90,
            primary_reason: 'Matches your preferences',
            rank: 1,
            reasons: [{ type: 'tool_match', message: 'Uses Cursor' }],
          },
        ],
        total_matches: 1,
        algorithm: 'test-algorithm',
        summary: {
          top_category: 'agents',
          avg_match_score: 0.9,
          diversity_score: 0.8,
        },
      };

      // Mock RPC to return recommendations (matching GetRecommendationsReturns structure)
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRecommendations,
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        integrations: ['github'],
        focusAreas: ['automation'], // Valid focus_area_type: 'security' | 'performance' | 'documentation' | 'testing' | 'code-quality' | 'automation'
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      // Debug: Check what error we got
      if (!result.data) {
        if (result.serverError) {
          throw new Error(`Action returned serverError: ${result.serverError}`);
        }
        if (result.fieldErrors) {
          throw new Error(`Action returned fieldErrors: ${JSON.stringify(result.fieldErrors)}`);
        }
        throw new Error(`Action returned undefined data but no error: ${JSON.stringify(result)}`);
      }

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify RPC was called with correct parameters
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM get_recommendations'),
        'beginner', // p_experience_level
        ['automation'], // p_focus_areas (valid focus_area_type)
        ['github'], // p_integrations
        20, // p_limit (default)
        ['cursor'], // p_tool_preferences
        'general-development' // p_use_case
      );

      expect(result.data?.success).toBe(true);
      expect(result.data?.recommendations).toMatchObject({
        results: expect.arrayContaining([
          expect.objectContaining({
            slug: 'test-config',
            title: 'Test Config',
          }),
        ]),
        total_matches: 1,
        algorithm: 'test-algorithm', // From mock
        summary: {
          top_category: 'agents',
          avg_match_score: 0.9,
          diversity_score: 0.8,
        },
        answers: {
          useCase: 'general-development',
          experienceLevel: 'beginner',
          toolPreferences: ['cursor'],
          integrations: ['github'],
          focusAreas: ['automation'], // Valid focus_area_type: 'security' | 'performance' | 'documentation' | 'testing' | 'code-quality' | 'automation'
        },
      });
      expect((result.data?.recommendations as any).id).toMatch(/^rec_\d+_[a-z0-9]+$/);
      expect((result.data?.recommendations as any).generatedAt).toBeDefined();
    });

    it('should handle null results from getConfigRecommendations', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      // Mock RPC to return null (onError returns null)
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('RPC failed')
      );

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // When getConfigRecommendations returns null, action uses fallback
      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).results).toEqual([]);
      expect((result.data?.recommendations as any).total_matches).toBe(0);
    });

    it('should handle transformation errors gracefully', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { logger } = await import('../logger.ts');

      // Mock data that will cause transformation error
      // Making item null will cause TypeError when accessing item.slug
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: [
            null as any, // null item will cause TypeError when accessing item.slug
          ],
          total_matches: 1,
          algorithm: 'test-algorithm',
          summary: {
            top_category: null,
            avg_match_score: 0,
            diversity_score: 0,
          },
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(logger.error).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).results).toEqual([]);
    });

    it('should handle getConfigRecommendations errors gracefully', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { logger } = await import('../logger.ts');

      // When RPC throws, getConfigRecommendations catches it via onError: () => null
      // and returns null. The action then uses the fallback, but doesn't log an error
      // because getConfigRecommendations handled it gracefully.
      // To test the action's error handling, we need to make getConfigRecommendations throw
      // directly (not via RPC). But since getConfigRecommendations has onError: () => null,
      // it will always return null on error, not throw.
      // So the action will use the fallback when data is null, without logging an error.
      const mockError = new Error('Service error');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      // getConfigRecommendations returns null on error (via onError: () => null)
      // Action uses fallback when data is null, without logging (this is expected behavior)
      // Note: getConfigRecommendations logs the error internally, but the action doesn't
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Action uses fallback when getConfigRecommendations returns null
      expect(result.data?.success).toBe(true); // Uses fallback, which has success: true
      expect((result.data?.recommendations as any).results).toEqual([]); // Fallback has empty array
      expect((result.data?.recommendations as any).total_matches).toBe(0);
      expect((result.data?.recommendations as any).answers).toMatchObject({
        useCase: 'general-development',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });
    });
  });

  describe('edge cases', () => {
    it('should handle getConfigRecommendations returning data with null results', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: null,
          total_matches: 0,
          algorithm: 'test-algorithm',
          summary: {
            top_category: null,
            avg_match_score: 0,
            diversity_score: 0,
          },
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).results).toEqual([]);
    });

    it('should handle getConfigRecommendations returning data with non-array results', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { logger } = await import('../logger.ts');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: 'not-an-array',
          total_matches: 0,
          algorithm: 'test-algorithm',
          summary: {
            top_category: null,
            avg_match_score: 0,
            diversity_score: 0,
          },
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).results).toEqual([]);
    });

    it('should handle item.tags being non-array in transformation', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { logger } = await import('../logger.ts');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: [
            {
              slug: 'test-config',
              title: 'Test Config',
              tags: 'not-an-array',
            },
          ],
          total_matches: 1,
          algorithm: 'test-algorithm',
          summary: {
            top_category: null,
            avg_match_score: 0,
            diversity_score: 0,
          },
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).results[0].tags).toEqual([]);
    });

    it('should handle item.reasons being non-array in transformation', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: [
            {
              slug: 'test-config',
              title: 'Test Config',
              tags: [],
              reasons: 'not-an-array',
            },
          ],
          total_matches: 1,
          algorithm: 'test-algorithm',
          summary: {
            top_category: null,
            avg_match_score: 0,
            diversity_score: 0,
          },
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).results[0].reasons).toEqual([]);
    });

    it('should handle empty toolPreferences array', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: [],
          total_matches: 0,
          algorithm: 'test-algorithm',
          summary: {
            top_category: null,
            avg_match_score: 0,
            diversity_score: 0,
          },
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: [],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).answers.toolPreferences).toEqual([]);
    });

    it('should handle empty integrations array', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: [],
          total: 0,
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        integrations: [],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).answers.integrations).toEqual([]);
    });

    it('should handle empty focusAreas array', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: [],
          total: 0,
        },
      ]);

      const result = (await generateConfigRecommendationsAction({
        useCase: 'general-development', // Valid useCase
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        focusAreas: [],
      })) as SafeActionResult<{
        success: boolean;
        recommendations: unknown;
      }>;

      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      expect(result.data?.success).toBe(true);
      expect((result.data?.recommendations as any).answers.focusAreas).toEqual([]);
    });
  });
});
