/**
 * Tests for MCP Server Factory
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import { createMcpServer } from '@heyclaude/mcp-server/mcp/server';
import {
  createMockLogger,
  createMockUser,
  createMockToken,
  createMockEnv,
  createMockKvCache,
} from '../__tests__/test-utils.ts';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import * as toolsRegistration from '@heyclaude/mcp-server/tools';
import * as resourcesRegistration from '@heyclaude/mcp-server/mcp/resources';
import * as promptsRegistration from '@heyclaude/mcp-server/mcp/prompts';

// Mock the registration functions
jest.mock('@heyclaude/mcp-server/tools', () => ({
  registerAllTools: jest.fn(),
}));

jest.mock('@heyclaude/mcp-server/mcp/resources', () => ({
  registerAllResources: jest.fn(),
}));

jest.mock('@heyclaude/mcp-server/mcp/prompts', () => ({
  registerAllPrompts: jest.fn(),
}));

describe('MCP Server Factory', () => {
  let prismocker: PrismaClient;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    jest.clearAllMocks();
    mockLogger = createMockLogger();
    mockEnv = createMockEnv();
  });

  it('should create MCP server instance', () => {
    const server = createMcpServer({
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken(),
      env: mockEnv,
      logger: mockLogger,
    });

    expect(server).toBeDefined();
  });

  it('should register all tools', () => {
    createMcpServer({
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken(),
      env: mockEnv,
      logger: mockLogger,
    });

    expect(toolsRegistration.registerAllTools).toHaveBeenCalledTimes(1);
    const callArgs = (toolsRegistration.registerAllTools as ReturnType<typeof jest.fn>).mock
      .calls[0];
    expect(callArgs[0]).toBeDefined(); // mcpServer
    expect(callArgs[1]).toBeDefined(); // context
    expect(callArgs[1].prisma).toBe(prismocker);
    expect(callArgs[1].logger).toBe(mockLogger);
  });

  it('should register all resources', () => {
    createMcpServer({
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken(),
      env: mockEnv,
      logger: mockLogger,
    });

    expect(resourcesRegistration.registerAllResources).toHaveBeenCalledTimes(1);
    const callArgs = (resourcesRegistration.registerAllResources as ReturnType<typeof jest.fn>).mock
      .calls[0];
    expect(callArgs[0]).toBeDefined(); // mcpServer
    expect(callArgs[1]).toBeDefined(); // context
  });

  it('should register all prompts', () => {
    createMcpServer({
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken(),
      env: mockEnv,
      logger: mockLogger,
    });

    expect(promptsRegistration.registerAllPrompts).toHaveBeenCalledTimes(1);
    const callArgs = (promptsRegistration.registerAllPrompts as ReturnType<typeof jest.fn>).mock
      .calls[0];
    expect(callArgs[0]).toBeDefined(); // mcpServer
    expect(callArgs[1]).toBeDefined(); // context
  });

  it('should handle null kvCache', () => {
    const server = createMcpServer({
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken(),
      env: mockEnv,
      logger: mockLogger,
      kvCache: null,
    });

    expect(server).toBeDefined();
  });

  it('should handle undefined kvCache (convert to null)', () => {
    const server = createMcpServer({
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken(),
      env: mockEnv,
      logger: mockLogger,
      // kvCache is undefined
    });

    expect(server).toBeDefined();

    // Verify context has kvCache as null
    const callArgs = (toolsRegistration.registerAllTools as ReturnType<typeof jest.fn>).mock
      .calls[0];
    expect(callArgs[1].kvCache).toBeNull();
  });

  it('should pass kvCache when provided', () => {
    const mockKvCache = createMockKvCache();

    createMcpServer({
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken(),
      env: mockEnv,
      logger: mockLogger,
      kvCache: mockKvCache,
    });

    const callArgs = (toolsRegistration.registerAllTools as ReturnType<typeof jest.fn>).mock
      .calls[0];
    expect(callArgs[1].kvCache).toBe(mockKvCache);
  });

  it('should create context with all required fields', () => {
    const user = createMockUser({ id: 'user-123' });
    const token = createMockToken({ access_token: 'token-123' });

    createMcpServer({
      prisma: prismocker,
      user,
      token,
      env: mockEnv,
      logger: mockLogger,
    });

    const callArgs = (toolsRegistration.registerAllTools as ReturnType<typeof jest.fn>).mock
      .calls[0];
    const context = callArgs[1];

    expect(context.prisma).toBe(prismocker);
    expect(context.user).toBe(user);
    expect(context.token).toBe(token);
    expect(context.env).toBe(mockEnv);
    expect(context.logger).toBe(mockLogger);
  });
});
