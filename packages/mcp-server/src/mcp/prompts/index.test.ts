/**
 * Tests for Prompt Registration
 *
 * Tests that all prompts are properly registered with correct schemas.
 * This is a registration verification test.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { registerAllPrompts } from './index.js';
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

describe('Prompt Registration', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let mcpServer: McpServer;
  let registerPromptSpy: jest.SpiedFunction<any>;

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

    // Create a mock MCP server
    mcpServer = {
      registerPrompt: jest.fn(),
    } as any;
    registerPromptSpy = jest.spyOn(mcpServer, 'registerPrompt');
  });

  describe('Prompt Registration Verification', () => {
    it('should register all prompts', () => {
      registerAllPrompts(mcpServer, context);

      // Verify registerPrompt was called (at least once)
      expect(registerPromptSpy).toHaveBeenCalled();
    });

    it('should register prompts with correct schemas', () => {
      registerAllPrompts(mcpServer, context);

      const calls = registerPromptSpy.mock.calls;

      // Verify all prompts have required properties
      for (const call of calls) {
        expect(call[0]?.name).toBeDefined();
        expect(typeof call[0]?.name).toBe('string');
        expect(call[0]?.description).toBeDefined();
        expect(typeof call[0]?.description).toBe('string');

        // Prompts may have argumentSchema
        if (call[0]?.argumentSchema) {
          expect(typeof call[0]?.argumentSchema).toBe('object');
        }
      }
    });

    it('should register prompts with callable handlers', () => {
      registerAllPrompts(mcpServer, context);

      const calls = registerPromptSpy.mock.calls;

      // Verify all prompts have callable handlers
      for (const call of calls) {
        if (call[0]?.handler) {
          expect(typeof call[0]?.handler).toBe('function');
        }
      }
    });
  });
});
