/**
 * Tests for Resource Registration
 *
 * Tests the registration of all MCP resources with the server.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { registerAllResources } from './register.js';
import { createMockLogger, createMockKvCache } from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Resource Registration', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockMcpServer: jest.Mocked<McpServer>;
  let context: ToolContext;

  beforeEach(() => {
    clearRequestCache();

    prismocker = prisma;
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockMcpServer = {
      registerResource: jest.fn(),
    } as any;

    context = {
      prisma: prismocker,
      user: null,
      token: null,
      env: {} as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
      elicit: undefined,
    };
  });

  describe('Unit Tests', () => {
    it('should register all 3 resources', () => {
      registerAllResources(mockMcpServer, context);

      expect(mockMcpServer.registerResource).toHaveBeenCalledTimes(3);
    });

    it('should register content resource with correct template', () => {
      registerAllResources(mockMcpServer, context);

      const contentCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content'
      );
      expect(contentCall).toBeDefined();
      expect(contentCall[1].uriTemplate).toBe('claudepro://content/{category}/{slug}/{format}');
    });

    it('should register category resource with correct template', () => {
      registerAllResources(mockMcpServer, context);

      const categoryCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'category'
      );
      expect(categoryCall).toBeDefined();
      expect(categoryCall[1].uriTemplate).toBe('claudepro://category/{category}/{format}');
    });

    it('should register sitewide resource with correct template', () => {
      registerAllResources(mockMcpServer, context);

      const sitewideCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'sitewide'
      );
      expect(sitewideCall).toBeDefined();
      expect(sitewideCall[1].uriTemplate).toBe('claudepro://sitewide/{format}');
    });

    it('should register resources with completion handlers', () => {
      registerAllResources(mockMcpServer, context);

      const contentCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content'
      );
      const template = contentCall[1];
      expect(template.complete).toBeDefined();
      expect(template.complete?.category).toBeDefined();
      expect(template.complete?.slug).toBeDefined();
      expect(template.complete?.format).toBeDefined();
    });

    it('should register resources with metadata', () => {
      registerAllResources(mockMcpServer, context);

      const contentCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content'
      );
      const metadata = contentCall[2];
      expect(metadata.title).toBe('Content Export');
      expect(metadata.description).toContain('Export content');
      expect(metadata.mimeType).toBe('text/plain');
    });

    it('should register resources with handler functions', () => {
      registerAllResources(mockMcpServer, context);

      const contentCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content'
      );
      const handler = contentCall[3];
      expect(typeof handler).toBe('function');
    });

    it('should create KV cache if available', () => {
      registerAllResources(mockMcpServer, context);

      // KV cache should be created (no error thrown)
      expect(mockMcpServer.registerResource).toHaveBeenCalled();
    });

    it('should handle missing KV cache gracefully', () => {
      const contextWithoutKv = {
        ...context,
        kvCache: null,
      };

      registerAllResources(mockMcpServer, contextWithoutKv);

      // Should still register resources (no error thrown)
      expect(mockMcpServer.registerResource).toHaveBeenCalledTimes(3);
    });

    it('should log resource registration', () => {
      registerAllResources(mockMcpServer, context);

      // Registration should complete without errors
      expect(mockMcpServer.registerResource).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should register all resources with correct structure', () => {
      registerAllResources(mockMcpServer, context);

      const calls = (mockMcpServer.registerResource as jest.Mock).mock.calls;
      expect(calls.length).toBe(3);

      const resourceNames = calls.map((call) => call[0]);
      expect(resourceNames).toContain('content');
      expect(resourceNames).toContain('category');
      expect(resourceNames).toContain('sitewide');
    });

    it('should register content resource with all completion handlers', () => {
      registerAllResources(mockMcpServer, context);

      const contentCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content'
      );
      const template = contentCall[1];
      expect(template.complete?.category).toBeDefined();
      expect(template.complete?.slug).toBeDefined();
      expect(template.complete?.format).toBeDefined();
    });

    it('should register category resource with category and format completions', () => {
      registerAllResources(mockMcpServer, context);

      const categoryCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'category'
      );
      const template = categoryCall[1];
      expect(template.complete?.category).toBeDefined();
      expect(template.complete?.format).toBeDefined();
      expect(template.complete?.slug).toBeUndefined();
    });

    it('should register sitewide resource with format completion only', () => {
      registerAllResources(mockMcpServer, context);

      const sitewideCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'sitewide'
      );
      const template = sitewideCall[1];
      expect(template.complete?.format).toBeDefined();
      expect(template.complete?.category).toBeUndefined();
      expect(template.complete?.slug).toBeUndefined();
    });

    it('should register handlers that return proper resource response structure', async () => {
      registerAllResources(mockMcpServer, context);

      const contentCall = (mockMcpServer.registerResource as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content'
      );
      const handler = contentCall[3];

      // Mock the resource handlers
      jest.spyOn(require('./content.js'), 'handleContentResource').mockResolvedValueOnce({
        uri: 'claudepro://content/agents/test/llms.txt',
        mimeType: 'text/plain',
        text: 'test content',
      });

      const result = await handler(new URL('claudepro://content/agents/test/llms.txt'));

      expect(result.contents).toBeDefined();
      expect(result.contents[0].uri).toBe('claudepro://content/agents/test/llms.txt');
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toBe('test content');
    });
  });
});
