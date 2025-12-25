/**
 * Tests for Prompt Registration
 *
 * Tests the registration of all MCP prompts with the server.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { registerAllPrompts } from './register.js';
import { createMockLogger } from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Prompt Registration', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockMcpServer: jest.Mocked<McpServer>;
  let context: ToolContext;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockMcpServer = {
      registerPrompt: jest.fn(),
    } as any;

    context = {
      prisma: {} as any,
      user: null,
      token: null,
      env: {} as any,
      logger: mockLogger,
      kvCache: null,
      elicit: undefined,
    };
  });

  describe('Unit Tests', () => {
    it('should register all 8 prompts', () => {
      registerAllPrompts(mockMcpServer, context);

      expect(mockMcpServer.registerPrompt).toHaveBeenCalledTimes(8);
    });

    it('should register submit-content-guide prompt', () => {
      registerAllPrompts(mockMcpServer, context);

      const call = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'submit-content-guide'
      );
      expect(call).toBeDefined();
      expect(call[1].title).toBe('Submit Content Guide');
      expect(call[1].description).toContain('submitting new content');
    });

    it('should register format-content-for-platform prompt', () => {
      registerAllPrompts(mockMcpServer, context);

      const call = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'format-content-for-platform'
      );
      expect(call).toBeDefined();
      expect(call[1].title).toBe('Format Content for Platform');
    });

    it('should register search-optimization-tips prompt', () => {
      registerAllPrompts(mockMcpServer, context);

      const call = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'search-optimization-tips'
      );
      expect(call).toBeDefined();
      expect(call[1].title).toBe('Search Optimization Tips');
    });

    it('should register content-discovery-guide prompt', () => {
      registerAllPrompts(mockMcpServer, context);

      const call = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content-discovery-guide'
      );
      expect(call).toBeDefined();
      expect(call[1].title).toBe('Content Discovery Guide');
    });

    it('should register mcp-server-setup-guide prompt', () => {
      registerAllPrompts(mockMcpServer, context);

      const call = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'mcp-server-setup-guide'
      );
      expect(call).toBeDefined();
      expect(call[1].title).toBe('MCP Server Setup Guide');
    });

    it('should register content-submission-best-practices prompt', () => {
      registerAllPrompts(mockMcpServer, context);

      const call = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content-submission-best-practices'
      );
      expect(call).toBeDefined();
      expect(call[1].title).toBe('Content Submission Best Practices');
    });

    it('should register tool-usage-guide prompt', () => {
      registerAllPrompts(mockMcpServer, context);

      const call = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'tool-usage-guide'
      );
      expect(call).toBeDefined();
      expect(call[1].title).toBe('Tool Usage Guide');
    });

    it('should register resource-access-guide prompt', () => {
      registerAllPrompts(mockMcpServer, context);

      const call = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'resource-access-guide'
      );
      expect(call).toBeDefined();
      expect(call[1].title).toBe('Resource Access Guide');
    });

    it('should register prompts with correct argument schemas', () => {
      registerAllPrompts(mockMcpServer, context);

      const submitCall = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'submit-content-guide'
      );
      expect(submitCall[1].argsSchema).toBeDefined();
      expect(submitCall[1].argsSchema.category).toBeDefined();
      expect(submitCall[1].argsSchema.submission_type).toBeDefined();
    });

    it('should register prompts with handler functions', () => {
      registerAllPrompts(mockMcpServer, context);

      const submitCall = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'submit-content-guide'
      );
      const handler = submitCall[2];
      expect(typeof handler).toBe('function');
    });

    it('should log prompt registration', () => {
      registerAllPrompts(mockMcpServer, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Registered all MCP prompts',
        expect.objectContaining({
          promptCount: 8,
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should register all prompts with correct structure', () => {
      registerAllPrompts(mockMcpServer, context);

      const calls = (mockMcpServer.registerPrompt as jest.Mock).mock.calls;
      expect(calls.length).toBe(8);

      const promptNames = calls.map((call) => call[0]);
      expect(promptNames).toContain('submit-content-guide');
      expect(promptNames).toContain('format-content-for-platform');
      expect(promptNames).toContain('search-optimization-tips');
      expect(promptNames).toContain('content-discovery-guide');
      expect(promptNames).toContain('mcp-server-setup-guide');
      expect(promptNames).toContain('content-submission-best-practices');
      expect(promptNames).toContain('tool-usage-guide');
      expect(promptNames).toContain('resource-access-guide');
    });

    it('should execute prompt handlers and return messages', async () => {
      registerAllPrompts(mockMcpServer, context);

      const submitCall = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'submit-content-guide'
      );
      const handler = submitCall[2];

      const result = await handler({ category: 'agents' });

      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.type).toBe('text');
      expect(result.messages[0].content.text).toContain('agents');
    });

    it('should handle prompt arguments correctly', async () => {
      registerAllPrompts(mockMcpServer, context);

      const platformCall = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'format-content-for-platform'
      );
      const handler = platformCall[2];

      const result = await handler({ platform: 'claude-code', content_type: 'rules' });

      expect(result.messages[0].content.text).toContain('Claude Code');
      expect(result.messages[0].content.text).toContain('rules');
    });

    it('should handle prompts with no arguments', async () => {
      registerAllPrompts(mockMcpServer, context);

      const discoveryCall = (mockMcpServer.registerPrompt as jest.Mock).mock.calls.find(
        (call) => call[0] === 'content-discovery-guide'
      );
      const handler = discoveryCall[2];

      const result = await handler({});

      expect(result.messages[0].content.text).toBeDefined();
      expect(result.messages[0].content.text.length).toBeGreaterThan(0);
    });
  });
});
