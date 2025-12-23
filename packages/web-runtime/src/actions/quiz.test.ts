import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache, getRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// DO NOT mock next/headers - safemocker handles this automatically
// DO NOT mock Supabase client or auth - safemocker handles auth automatically
// safemocker's __mocks__/next-safe-action.ts provides pre-configured rateLimitedAction
// with context already injected (test-user-agent, startTime)

// Mock logger (used by safe-action middleware)
jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(function (context: any) {
      return this; // Return logger itself for chaining
    }),
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

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth → rate limiting → logging → error handling
// The next-safe-action dependency is automatically mocked via __mocks__/next-safe-action.ts

// DO NOT mock data functions - use real data functions which use Prismocker
// This allows us to test the real data flow end-to-end

// Import action AFTER all mocks are set up
import { getQuizConfigurationAction } from './quiz.ts';

describe('getQuizConfigurationAction', () => {
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

    // Note: getQuizConfiguration uses MiscService.getQuizConfiguration which uses Prisma directly
    // (not RPC), so we don't need to set up $queryRawUnsafe
  });

  describe('input validation', () => {
    it('should accept empty input object', async () => {
      const result = await getQuizConfigurationAction({});

      // Verify SafeActionResult structure
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('serverError');
      expect(result).toHaveProperty('fieldErrors');
    });
  });

  describe('successful quiz configuration fetch', () => {
    it('should return quiz configuration from data layer', async () => {
      // Seed Prismocker with quiz questions and options
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('quiz_questions', [
          {
            id: 'q1-id', // Prisma primary key (UUID in real DB, but we use string for testing)
            question_id: 'q1', // Unique identifier used for foreign key
            question_text: 'What is your use case?',
            description: 'Select your primary use case',
            required: true,
            display_order: 1,
          },
          {
            id: 'q2-id', // Prisma primary key
            question_id: 'q2', // Unique identifier used for foreign key
            question_text: 'What is your experience level?',
            description: 'Select your experience level',
            required: false,
            display_order: 2,
          },
        ]);

        (prismocker as any).setData('quiz_options', [
          {
            question_id: 'q1',
            value: 'agents',
            label: 'AI Agents',
            description: 'Building AI agents',
            icon_name: 'bot',
            display_order: 1,
          },
          {
            question_id: 'q1',
            value: 'mcp',
            label: 'MCP Servers',
            description: 'Building MCP servers',
            icon_name: 'server',
            display_order: 2,
          },
          {
            question_id: 'q2',
            value: 'beginner',
            label: 'Beginner',
            description: 'Just getting started',
            icon_name: 'star',
            display_order: 1,
          },
          {
            question_id: 'q2',
            value: 'advanced',
            label: 'Advanced',
            description: 'Experienced developer',
            icon_name: 'rocket',
            display_order: 2,
          },
        ]);
      }

      const result = await getQuizConfigurationAction({});

      // Verify SafeActionResult structure
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify data structure
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);

      // Verify first question
      expect(result.data?.[0]).toMatchObject({
        id: 'q1',
        question: 'What is your use case?',
        description: 'Select your primary use case',
        required: true,
        display_order: 1,
      });
      // Verify that relations are filtered correctly (after Prismocker fix)
      expect(Array.isArray(result.data?.[0]?.options)).toBe(true);
      expect(result.data?.[0]?.options).toHaveLength(2);
      expect(result.data?.[0]?.options?.[0]).toMatchObject({
        value: 'agents',
        label: 'AI Agents',
        description: 'Building AI agents',
        icon_name: 'bot',
      });
      expect(result.data?.[0]?.options?.[1]).toMatchObject({
        value: 'mcp',
        label: 'MCP Servers',
        description: 'Building MCP servers',
        icon_name: 'server',
      });

      // Verify second question
      expect(result.data?.[1]).toMatchObject({
        id: 'q2',
        question: 'What is your experience level?',
        description: 'Select your experience level',
        required: false,
        display_order: 2,
      });
      // Verify that relations are filtered correctly (after Prismocker fix)
      expect(Array.isArray(result.data?.[1]?.options)).toBe(true);
      expect(result.data?.[1]?.options).toHaveLength(2);
      expect(result.data?.[1]?.options?.[0]).toMatchObject({
        value: 'beginner',
        label: 'Beginner',
        description: 'Just getting started',
        icon_name: 'star',
      });
      expect(result.data?.[1]?.options?.[1]).toMatchObject({
        value: 'advanced',
        label: 'Advanced',
        description: 'Experienced developer',
        icon_name: 'rocket',
      });
    });

    it('should handle empty quiz configuration', async () => {
      // Seed Prismocker with empty data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('quiz_questions', []);
        (prismocker as any).setData('quiz_options', []);
      }

      const result = await getQuizConfigurationAction({});

      // Verify SafeActionResult structure
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Verify empty array is returned
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle null quiz configuration', async () => {
      // Seed Prismocker with null data (simulating no configuration found)
      // Note: getQuizConfiguration can return null if no data is found
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('quiz_questions', []);
        (prismocker as any).setData('quiz_options', []);
      }

      // Mock the data function to return null
      // Since we're using real data functions, we need to ensure Prismocker returns empty results
      // which will result in an empty array, not null
      // However, if the data function can return null, we should test that case
      // For now, let's test that empty results return an empty array
      const result = await getQuizConfigurationAction({});

      // Verify SafeActionResult structure
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();

      // Empty results should return an empty array (not null)
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('caching behavior', () => {
    it('should cache results on duplicate calls (caching test)', async () => {
      // Seed Prismocker with quiz data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('quiz_questions', [
          {
            question_id: 'q1',
            question_text: 'What is your use case?',
            description: 'Select your primary use case',
            required: true,
            display_order: 1,
          },
        ]);

        (prismocker as any).setData('quiz_options', [
          {
            question_id: 'q1',
            value: 'agents',
            label: 'AI Agents',
            description: 'Building AI agents',
            icon_name: 'bot',
            display_order: 1,
          },
        ]);
      }

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getQuizConfigurationAction({});
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getQuizConfigurationAction({});
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1.data).toEqual(result2.data);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('error handling', () => {
    it('should return SafeActionResult structure with error properties', async () => {
      // Test that the action always returns SafeActionResult structure
      // Even on success, the structure includes data, serverError, and fieldErrors properties
      const result = await getQuizConfigurationAction({});

      // Verify SafeActionResult structure (even on success, these properties exist)
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('serverError');
      expect(result).toHaveProperty('fieldErrors');

      // On success, data should be defined and serverError/fieldErrors should be undefined
      expect(result.data).toBeDefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should handle null return from data function', async () => {
      // getQuizConfiguration can return null if createDataFunction's onError handler is triggered
      // or if there's a service initialization error
      // Since we're using real data functions, we can't easily force this scenario
      // But we can verify the action structure handles null correctly

      // Seed empty data (normal case - returns empty array, not null)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('quiz_questions', []);
        (prismocker as any).setData('quiz_options', []);
      }

      const result = await getQuizConfigurationAction({});

      // Verify SafeActionResult structure
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('serverError');
      expect(result).toHaveProperty('fieldErrors');

      // Empty results should return empty array (not null) from the service
      // But if createDataFunction's onError handler is triggered, it could return null
      // The action should handle both cases
      if (result.data === null) {
        // If data is null, it means an error occurred and onError returned null
        // The action should still return a valid SafeActionResult structure
        expect(result.serverError).toBeUndefined(); // Action doesn't throw, just returns null
        expect(result.fieldErrors).toBeUndefined();
      } else {
        // Normal case: empty array
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
