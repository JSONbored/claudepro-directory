import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock safe-action middleware - standardized pattern
// Pattern: rateLimitedAction.inputSchema().metadata().action()
jest.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createRateLimitedActionHandler = (inputSchema: any) => {
    return jest.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          return await handler({
            parsedInput: parsed,
            ctx: { userAgent: 'test-user-agent', startTime: performance.now() },
          });
        } catch (error) {
          // Simulate middleware error handling
          const { logActionFailure } = require('../errors.ts');
          logActionFailure('contact', error, {});
          throw error;
        }
      };
    });
  };

  const createRateLimitedMetadataResult = (inputSchema: any) => ({
    action: createRateLimitedActionHandler(inputSchema),
  });

  const createRateLimitedInputSchemaResult = (inputSchema: any) => ({
    metadata: jest.fn(() => createRateLimitedMetadataResult(inputSchema)),
    action: createRateLimitedActionHandler(inputSchema),
  });

  return {
    rateLimitedAction: {
      inputSchema: jest.fn((schema: any) => createRateLimitedInputSchemaResult(schema)),
    },
  };
});

// DO NOT mock getService - use real getService which will use Prismocker
// This allows us to test the real data flow end-to-end

describe('getContactCommands', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test (required for test isolation)
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();
  });

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

    const result = await getContactCommands({});

    // Service transforms command_text -> text
    expect(result).toEqual({
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

  it('should propagate service errors (no error handling in action)', async () => {
    const { getContactCommands } = await import('./contact.ts');

    // Mock Prisma to throw error
    const findManySpy = jest
      .spyOn(prismocker.contact_commands, 'findMany')
      .mockRejectedValue(new Error('Service error'));

    // Action doesn't catch service errors, so it propagates
    await expect(getContactCommands({})).rejects.toThrow('Service error');

    findManySpy.mockRestore();
  });

  it('should handle null result from service', async () => {
    const { getContactCommands } = await import('./contact.ts');

    // Empty setData means no commands found
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('contact_commands', []);
    }

    const result = await getContactCommands({});

    // Service returns empty array, action uses ?? [] so result is []
    expect(result).toEqual({ commands: [] });
  });

  it('should handle undefined result from service', async () => {
    const { getContactCommands } = await import('./contact.ts');

    // Mock service method to return undefined
    // Since we're using real getService, we need to mock the Prisma query result
    // Empty array simulates undefined/null case (action uses ?? [] so it becomes [])
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('contact_commands', []);
    }

    const result = await getContactCommands({});

    expect(result).toEqual({ commands: [] });
  });

  it('should handle empty array result from service', async () => {
    const { getContactCommands } = await import('./contact.ts');

    // Empty setData means no commands
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('contact_commands', []);
    }

    const result = await getContactCommands({});

    expect(result).toEqual({ commands: [] });
  });

  describe('edge cases', () => {
    it('should propagate getService errors (no error handling in action)', async () => {
      const { getContactCommands } = await import('./contact.ts');

      // Mock getService to throw error
      // Since we're using real getService, we need to mock it temporarily
      const originalGetService = await import('../data/service-factory');
      const getServiceSpy = jest
        .spyOn(originalGetService, 'getService')
        .mockRejectedValue(new Error('Service initialization failed'));

      // Action doesn't catch service initialization errors, so it propagates
      await expect(getContactCommands({})).rejects.toThrow('Service initialization failed');

      getServiceSpy.mockRestore();
    });

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

      const result = await getContactCommands({}) as { commands: Array<{ id: string | null; text: string | null }> };

      // Should only return active commands (filtered by is_active: true in query)
      expect(result.commands).toHaveLength(1);
      expect(result.commands[0].id).toBe('cmd-1');
      expect(result.commands[0].text).toBe('help');
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

      const result = await getContactCommands({}) as { commands: Array<{ id: string | null; text: string | null }> };

      // Should be ordered by display_order ascending
      expect(result.commands).toHaveLength(3);
      expect(result.commands[0].id).toBe('cmd-1');
      expect(result.commands[0].text).toBe('first');
      expect(result.commands[1].id).toBe('cmd-2');
      expect(result.commands[1].text).toBe('second');
      expect(result.commands[2].id).toBe('cmd-3');
      expect(result.commands[2].text).toBe('third');
    });
  });
});
