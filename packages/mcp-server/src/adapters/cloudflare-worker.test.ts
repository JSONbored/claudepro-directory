/**
 * Tests for Cloudflare Worker Adapter
 *
 * Tests the adapter that bridges runtime-agnostic MCP server with Cloudflare Workers-specific types.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import {
  convertEnv,
  convertLogger,
  convertMcpServerOptions,
  convertToolContext,
} from '@heyclaude/mcp-server/adapters/cloudflare-worker';
import {
  createMockUser,
  createMockToken,
  createMockEnv,
  createMockLogger,
  createMockKvCache,
} from '../__tests__/test-utils.ts';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

describe('Cloudflare Worker Adapter', () => {
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    jest.clearAllMocks();
  });

  describe('convertEnv', () => {
    it('should convert ExtendedEnv to RuntimeEnv', () => {
      const env = createMockEnv({
        NODE_ENV: 'production',
        SUPABASE_URL: 'https://test.supabase.co',
      });
      const result = convertEnv(env as any);
      expect(result).toBe(env);
    });

    it('should preserve all env properties', () => {
      const env = createMockEnv({
        NODE_ENV: 'development',
        SUPABASE_URL: 'https://test.supabase.co',
        CUSTOM_KEY: 'custom-value',
      });
      const result = convertEnv(env as any);
      expect(result).toEqual(env);
    });
  });

  describe('convertLogger', () => {
    it('should convert Cloudflare Logger to RuntimeLogger', () => {
      const cloudflareLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        child: vi.fn(() => ({
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          child: jest.fn(),
        })),
      };

      const runtimeLogger = convertLogger(cloudflareLogger as any);

      expect(runtimeLogger).toBeDefined();
      expect(typeof runtimeLogger.info).toBe('function');
      expect(typeof runtimeLogger.error).toBe('function');
      expect(typeof runtimeLogger.warn).toBe('function');
      expect(typeof runtimeLogger.debug).toBe('function');
      expect(typeof runtimeLogger.child).toBe('function');
    });

    it('should call Cloudflare logger.info with object-first API', () => {
      const cloudflareLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        child: vi.fn(() => ({
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          child: jest.fn(),
        })),
      };

      const runtimeLogger = convertLogger(cloudflareLogger as any);
      runtimeLogger.info('Test message', { key: 'value' });

      expect(cloudflareLogger.info).toHaveBeenCalledWith({ key: 'value' }, 'Test message');
    });

    it('should call Cloudflare logger.info with empty object when no meta provided', () => {
      const cloudflareLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        child: vi.fn(() => ({
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          child: jest.fn(),
        })),
      };

      const runtimeLogger = convertLogger(cloudflareLogger as any);
      runtimeLogger.info('Test message');

      expect(cloudflareLogger.info).toHaveBeenCalledWith({}, 'Test message');
    });

    it('should call Cloudflare logger.error with error in meta', () => {
      const cloudflareLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        child: vi.fn(() => ({
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          child: jest.fn(),
        })),
      };

      const runtimeLogger = convertLogger(cloudflareLogger as any);
      const testError = new Error('Test error');
      runtimeLogger.error('Error message', testError, { key: 'value' });

      expect(cloudflareLogger.error).toHaveBeenCalledWith(
        { error: testError, key: 'value' },
        'Error message'
      );
    });

    it('should create child logger', () => {
      const childLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        child: jest.fn(),
      };

      const cloudflareLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        child: vi.fn(() => childLogger),
      };

      const runtimeLogger = convertLogger(cloudflareLogger as any);
      const child = runtimeLogger.child({ requestId: 'test-id' });

      expect(cloudflareLogger.child).toHaveBeenCalledWith({ requestId: 'test-id' });
      expect(child).toBeDefined();
      expect(typeof child.info).toBe('function');
    });
  });

  describe('convertMcpServerOptions', () => {
    it('should convert Cloudflare options to runtime-agnostic options', () => {
      const user = createMockUser();
      const token = createMockToken();
      const env = createMockEnv();
      const logger = createMockLogger();
      const kvCache = createMockKvCache();

      const cloudflareOptions = {
        prisma: prismocker,
        user,
        token: token.access_token,
        env: env as any,
        logger: logger as any,
        kvCache,
      };

      const result = convertMcpServerOptions(cloudflareOptions);

      expect(result.prisma).toBe(prismocker);
      expect(result.user).toBe(user);
      expect(result.token).toBe(token.access_token);
      expect(result.env).toBeDefined();
      expect(result.logger).toBeDefined();
      expect(result.kvCache).toBe(kvCache);
    });

    it('should handle undefined kvCache', () => {
      const user = createMockUser();
      const token = createMockToken();
      const env = createMockEnv();
      const logger = createMockLogger();

      const cloudflareOptions = {
        prisma: prismocker,
        user,
        token: token.access_token,
        env: env as any,
        logger: logger as any,
        kvCache: undefined,
      };

      const result = convertMcpServerOptions(cloudflareOptions);

      expect(result.kvCache).toBeNull();
    });

    it('should handle null kvCache', () => {
      const user = createMockUser();
      const token = createMockToken();
      const env = createMockEnv();
      const logger = createMockLogger();

      const cloudflareOptions = {
        prisma: prismocker,
        user,
        token: token.access_token,
        env: env as any,
        logger: logger as any,
        kvCache: null,
      };

      const result = convertMcpServerOptions(cloudflareOptions);

      expect(result.kvCache).toBeNull();
    });
  });

  describe('convertToolContext', () => {
    it('should convert runtime-agnostic ToolContext to Cloudflare-specific context', () => {
      const user = createMockUser();
      const token = createMockToken();
      const env = createMockEnv();
      const logger = createMockLogger();

      const toolContext = {
        prisma: prismocker,
        user,
        token: token.access_token,
        env: env as any,
        logger: logger as any,
        kvCache: null,
      };

      const result = convertToolContext(toolContext as any);

      expect(result.prisma).toBe(prismocker);
      expect(result.user).toBe(user);
      expect(result.token).toBe(token.access_token);
      expect(result.env).toBeDefined();
      expect(result.logger).toBeDefined();
    });

    it('should preserve all context properties', () => {
      const user = createMockUser();
      const token = createMockToken();
      const env = createMockEnv();
      const logger = createMockLogger();

      const toolContext = {
        prisma: prismocker,
        user,
        token: token.access_token,
        env: env as any,
        logger: logger as any,
        kvCache: null,
      };

      const result = convertToolContext(toolContext as any);

      expect(result).toEqual({
        prisma: prismocker,
        user,
        token: token.access_token,
        env: toolContext.env,
        logger: toolContext.logger,
      });
    });
  });
});
