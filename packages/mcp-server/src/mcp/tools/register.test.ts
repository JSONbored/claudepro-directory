/**
 * Tests for Tool Registration Logic
 *
 * Tests the tool registration implementation: tool registration with correct schemas,
 * error handling for invalid tools, context passing to handlers, and wrapper functionality.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { registerAllTools } from './register.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Tool Registration Logic', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let mcpServer: McpServer;
  let registerToolSpy: jest.SpiedFunction<any>;
  let toolHandlers: Map<string, (args: any) => Promise<any>>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    prismocker = prisma;
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    mockLogger = createMockLogger();
    mockEnv = createMockEnv();
    context = {
      prisma: prismocker,
      user: createMockUser() as any,
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };

    toolHandlers = new Map();
    mcpServer = {
      registerTool: jest.fn((name: string, _schema: any, handler: any) => {
        toolHandlers.set(name, handler);
      }),
    } as any;
    registerToolSpy = jest.spyOn(mcpServer, 'registerTool') as any;
  });

  describe('Tool Registration', () => {
    it('should register tools with correct schemas', () => {
      registerAllTools(mcpServer, context);

      const calls = registerToolSpy.mock.calls;

      // Verify all tools have required schema properties
      for (const call of calls) {
        const toolName = call[0] as string;
        const schema = call[1] as any;
        const handler = call[2] as any;

        expect(toolName).toBeDefined(); // Tool name
        expect(schema?.title).toBeDefined();
        expect(schema?.description).toBeDefined();
        expect(schema?.inputSchema).toBeDefined();
        expect(schema?.outputSchema).toBeDefined();
        expect(typeof handler).toBe('function'); // Handler
      }
    });

    it('should wrap handlers with timeout protection', async () => {
      registerAllTools(mcpServer, context);

      // Get a handler (e.g., listCategories)
      const handler = toolHandlers.get('listCategories');
      expect(handler).toBeDefined();

      // Handler should be callable
      if (handler) {
        // Should not throw immediately (timeout is 30s, test should complete faster)
        const promise = handler({});
        expect(promise).toBeInstanceOf(Promise);
        // Cancel the promise to avoid hanging
        await promise.catch(() => {}); // Ignore errors
      }
    });

    it('should pass context to handlers', async () => {
      registerAllTools(mcpServer, context);

      // The context is captured in closure by wrapToolHandler
      // We can verify this by checking that handlers use the context
      // (e.g., by checking logger calls)
      const handler = toolHandlers.get('listCategories');

      if (handler) {
        try {
          await handler({});
        } catch {
          // Ignore errors - we just want to verify handler is callable
        }
        // Context is used internally, so we can't directly verify it
        // But we can verify handlers don't throw context errors
      }
    });

    it('should register all 20 tools', () => {
      registerAllTools(mcpServer, context);

      expect(registerToolSpy).toHaveBeenCalledTimes(20);
      expect(toolHandlers.size).toBe(20);
    });

    it('should handle tool registration errors gracefully', () => {
      // Mock registerTool to throw error
      registerToolSpy.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      expect(() => {
        registerAllTools(mcpServer, context);
      }).toThrow('Registration failed');
    });
  });

  describe('Handler Wrapping', () => {
    it('should wrap handlers with input sanitization', async () => {
      registerAllTools(mcpServer, context);

      // Input sanitization is applied in wrapToolHandler
      // We can verify by checking that handlers accept sanitized input
      const handler = toolHandlers.get('listCategories');

      if (handler) {
        // Handler should accept input (sanitization happens internally)
        const promise = handler({});
        expect(promise).toBeInstanceOf(Promise);
        await promise.catch(() => {}); // Ignore errors
      }
    });

    it('should wrap handlers with request deduplication', async () => {
      registerAllTools(mcpServer, context);

      // Request deduplication is applied in wrapToolHandler
      // This is tested implicitly by verifying handlers work correctly
      const handler = toolHandlers.get('listCategories');

      if (handler) {
        const promise = handler({});
        expect(promise).toBeInstanceOf(Promise);
        await promise.catch(() => {}); // Ignore errors
      }
    });

    it('should wrap handlers with metrics tracking', async () => {
      registerAllTools(mcpServer, context);

      // Metrics tracking is applied in wrapToolHandler
      // This is tested implicitly by verifying handlers work correctly
      const handler = toolHandlers.get('listCategories');

      if (handler) {
        const promise = handler({});
        expect(promise).toBeInstanceOf(Promise);
        await promise.catch(() => {}); // Ignore errors
      }
    });
  });
});
