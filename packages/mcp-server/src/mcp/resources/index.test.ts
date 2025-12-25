/**
 * Tests for Resource Registration
 *
 * Tests that all resources are properly registered with correct templates and completion handlers.
 * This is a registration verification test.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { registerAllResources } from './index.js';
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

describe('Resource Registration', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let mcpServer: McpServer;
  let registerResourceTemplateSpy: jest.SpiedFunction<any>;
  let registerResourceUriHandlerSpy: jest.SpiedFunction<any>;

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
      registerResourceTemplate: jest.fn(),
      registerResourceUriHandler: jest.fn(),
    } as any;
    registerResourceTemplateSpy = jest.spyOn(mcpServer, 'registerResourceTemplate');
    registerResourceUriHandlerSpy = jest.spyOn(mcpServer, 'registerResourceUriHandler');
  });

  describe('Resource Registration Verification', () => {
    it('should register all 3 resources', () => {
      registerAllResources(mcpServer, context);

      // Verify registerResourceTemplate was called 3 times (one for each resource)
      expect(registerResourceTemplateSpy).toHaveBeenCalledTimes(3);
    });

    it('should register content resource', () => {
      registerAllResources(mcpServer, context);

      const calls = registerResourceTemplateSpy.mock.calls;
      const contentCall = calls.find(
        (call) => call[0]?.uri === 'claudepro://content/{category}/{slug}/{format}'
      );

      expect(contentCall).toBeDefined();
      expect(contentCall?.[0]?.uri).toBe('claudepro://content/{category}/{slug}/{format}');
      expect(contentCall?.[0]?.name).toBeDefined();
      expect(contentCall?.[0]?.description).toBeDefined();
    });

    it('should register category resource', () => {
      registerAllResources(mcpServer, context);

      const calls = registerResourceTemplateSpy.mock.calls;
      const categoryCall = calls.find(
        (call) => call[0]?.uri === 'claudepro://category/{category}/{format}'
      );

      expect(categoryCall).toBeDefined();
      expect(categoryCall?.[0]?.uri).toBe('claudepro://category/{category}/{format}');
      expect(categoryCall?.[0]?.name).toBeDefined();
      expect(categoryCall?.[0]?.description).toBeDefined();
    });

    it('should register sitewide resource', () => {
      registerAllResources(mcpServer, context);

      const calls = registerResourceTemplateSpy.mock.calls;
      const sitewideCall = calls.find((call) => call[0]?.uri === 'claudepro://sitewide/{format}');

      expect(sitewideCall).toBeDefined();
      expect(sitewideCall?.[0]?.uri).toBe('claudepro://sitewide/{format}');
      expect(sitewideCall?.[0]?.name).toBeDefined();
      expect(sitewideCall?.[0]?.description).toBeDefined();
    });

    it('should register completion handlers', () => {
      registerAllResources(mcpServer, context);

      // Verify registerResourceUriHandler was called for completion handlers
      expect(registerResourceUriHandlerSpy).toHaveBeenCalled();
    });

    it('should register resources with correct templates', () => {
      registerAllResources(mcpServer, context);

      const calls = registerResourceTemplateSpy.mock.calls;

      // Verify all resources have required template properties
      for (const call of calls) {
        expect(call[0]?.uri).toBeDefined();
        expect(typeof call[0]?.uri).toBe('string');
        expect(call[0]?.name).toBeDefined();
        expect(typeof call[0]?.name).toBe('string');
        expect(call[0]?.description).toBeDefined();
        expect(typeof call[0]?.description).toBe('string');
      }
    });
  });
});
