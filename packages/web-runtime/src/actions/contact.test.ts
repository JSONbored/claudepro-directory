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
// safemocker's __mocks__/next-safe-action.ts provides pre-configured rateLimitedAction
// with context already injected (userAgent, startTime)

// Mock logger (used by safe-action middleware)
jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
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
// This ensures we test the complete middleware chain: rate limiting → logging → error handling

// DO NOT mock getService - use real getService which will use Prismocker
// This allows us to test the real data flow end-to-end

describe('getContactCommands', () => {
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

    // Note: safemocker automatically provides context:
    // - ctx.userAgent = 'test-user-agent'
    // - ctx.startTime = performance.now()
    // No manual context mocks needed!
  });

  describe('data fetching', () => {
    it('should return contact commands from MiscService', async () => {
      const { getContactCommands } = await import('./contact.ts');

      const mockCommands = [
        {
          id: 'cmd-1',
          command_text: 'help',
          description: 'Get help',
          category: 'general',
          icon_name: 'help',
          action_type: 'link',
          action_value: '/help',
          confetti_variant: null,
          requires_auth: false,
          aliases: ['h', '?'],
          is_active: true,
          display_order: 1,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      // getContactCommands uses Prisma directly (not RPC), so use setData
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('contact_commands', mockCommands);
      }

      // Call action - now returns SafeActionResult structure
      const result = await getContactCommands({});

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<{ commands: any[] }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
      expect(safeResult.validationErrors).toBeUndefined();

      // Verify result data structure (wrapped in SafeActionResult.data)
      // Service transforms command_text -> text
      expect(safeResult.data).toEqual({
        commands: [
          {
            id: 'cmd-1',
            text: 'help', // Transformed from command_text
            description: 'Get help',
            category: 'general',
            icon_name: 'help',
            action_type: 'link',
            action_value: '/help',
            confetti_variant: null,
            requires_auth: false,
            aliases: ['h', '?'],
          },
        ],
      });
    });

    it('should handle null result from service', async () => {
      const { getContactCommands } = await import('./contact.ts');

      // Empty setData means no commands found
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('contact_commands', []);
      }

      // Call action - now returns SafeActionResult structure
      const result = await getContactCommands({});

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<{ commands: any[] }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Service returns empty array, action uses ?? [] so result is []
      expect(safeResult.data).toEqual({ commands: [] });
    });

    it('should handle undefined result from service', async () => {
      const { getContactCommands } = await import('./contact.ts');

      // Empty array simulates undefined/null case (action uses ?? [] so it becomes [])
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('contact_commands', []);
      }

      // Call action - now returns SafeActionResult structure
      const result = await getContactCommands({});

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<{ commands: any[] }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.data).toEqual({ commands: [] });
    });

    it('should handle empty array result from service', async () => {
      const { getContactCommands } = await import('./contact.ts');

      // Empty setData means no commands
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('contact_commands', []);
      }

      // Call action - now returns SafeActionResult structure
      const result = await getContactCommands({});

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<{ commands: any[] }>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.data).toEqual({ commands: [] });
    });
  });

  describe('caching', () => {
    it('should cache results on duplicate calls (caching test)', async () => {
      const { getContactCommands } = await import('./contact.ts');

      const mockCommands = [
        {
          id: 'cmd-1',
          command_text: 'help',
          description: 'Get help',
          category: 'general',
          icon_name: 'help',
          action_type: 'link',
          action_value: '/help',
          confetti_variant: null,
          requires_auth: false,
          aliases: ['h', '?'],
          is_active: true,
          display_order: 1,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      // Seed data using Prismocker
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('contact_commands', mockCommands);
      }

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getContactCommands({});
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getContactCommands({});
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult1 = result1 as SafeActionResult<{ commands: any[] }>;
      const safeResult2 = result2 as SafeActionResult<{ commands: any[] }>;
      expect(safeResult1.data).toEqual(safeResult2.data);

      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('error handling', () => {
    it('should return serverError when service throws error', async () => {
      const { getContactCommands } = await import('./contact.ts');

      // Mock Prisma to throw error
      const findManySpy = jest
        .spyOn(prismocker.contact_commands, 'findMany')
        .mockRejectedValue(new Error('Service error'));

      // Call action - now returns SafeActionResult structure
      const result = await getContactCommands({});

      // Verify SafeActionResult structure with serverError
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      findManySpy.mockRestore();
    });

    it('should return serverError when getService fails', async () => {
      const { getContactCommands } = await import('./contact.ts');

      // Mock getService to throw error
      const originalGetService = await import('../data/service-factory');
      const getServiceSpy = jest
        .spyOn(originalGetService, 'getService')
        .mockRejectedValue(new Error('Service initialization failed'));

      // Call action - now returns SafeActionResult structure
      const result = await getContactCommands({});

      // Verify SafeActionResult structure with serverError
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      getServiceSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should filter inactive commands (only active commands returned)', async () => {
      const { getContactCommands } = await import('./contact.ts');

      const mockCommands = [
        {
          id: 'cmd-1',
          command_text: 'help',
          description: 'Get help',
          category: 'general',
          icon_name: 'help',
          action_type: 'link',
          action_value: '/help',
          confetti_variant: null,
          requires_auth: false,
          aliases: ['h', '?'],
          is_active: true, // Active
          display_order: 1,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 'cmd-2',
          command_text: 'old',
          description: 'Old command',
          category: 'general',
          icon_name: null,
          action_type: null,
          action_value: null,
          confetti_variant: null,
          requires_auth: false,
          aliases: null,
          is_active: false, // Inactive - should be filtered out
          display_order: 2,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      // Seed both active and inactive commands
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('contact_commands', mockCommands);
      }

      // Call action - now returns SafeActionResult structure
      const result = await getContactCommands({});

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<{ commands: any[] }>;
      expect(safeResult.data).toBeDefined();

      // Should only return active commands (filtered by is_active: true in query)
      expect(safeResult.data?.commands).toHaveLength(1);
      expect(safeResult.data?.commands[0]?.id).toBe('cmd-1');
      expect(safeResult.data?.commands[0]?.text).toBe('help');
    });

    it('should order commands by display_order ascending', async () => {
      const { getContactCommands } = await import('./contact.ts');

      const mockCommands = [
        {
          id: 'cmd-3',
          command_text: 'third',
          description: 'Third command',
          category: 'general',
          icon_name: null,
          action_type: null,
          action_value: null,
          confetti_variant: null,
          requires_auth: false,
          aliases: null,
          is_active: true,
          display_order: 3, // Last
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 'cmd-1',
          command_text: 'first',
          description: 'First command',
          category: 'general',
          icon_name: null,
          action_type: null,
          action_value: null,
          confetti_variant: null,
          requires_auth: false,
          aliases: null,
          is_active: true,
          display_order: 1, // First
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 'cmd-2',
          command_text: 'second',
          description: 'Second command',
          category: 'general',
          icon_name: null,
          action_type: null,
          action_value: null,
          confetti_variant: null,
          requires_auth: false,
          aliases: null,
          is_active: true,
          display_order: 2, // Middle
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      // Seed commands in wrong order
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('contact_commands', mockCommands);
      }

      // Call action - now returns SafeActionResult structure
      const result = await getContactCommands({});

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<{ commands: any[] }>;
      expect(safeResult.data).toBeDefined();

      // Should be ordered by display_order ascending
      expect(safeResult.data?.commands).toHaveLength(3);
      expect(safeResult.data?.commands[0]?.id).toBe('cmd-1');
      expect(safeResult.data?.commands[0]?.text).toBe('first');
      expect(safeResult.data?.commands[1]?.id).toBe('cmd-2');
      expect(safeResult.data?.commands[1]?.text).toBe('second');
      expect(safeResult.data?.commands[2]?.id).toBe('cmd-3');
      expect(safeResult.data?.commands[2]?.text).toBe('third');
    });
  });
});
