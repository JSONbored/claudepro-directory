/**
 * Tests for Cloudflare Worker Adapter
 *
 * Tests the adapter that bridges runtime-agnostic MCP server with Cloudflare Workers-specific types.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @prisma/client to use PrismockerClient from __mocks__/@prisma/client.ts
// This must be called before any imports that use PrismaClient
// Vitest will hoist this call to the top of the file
vi.mock('@prisma/client');

import {
  convertEnv,
  convertLogger,
  convertMcpServerOptions,
  convertToolContext,
} from '../../../../packages/mcp-server/src/adapters/cloudflare-worker.js';
import { createMockUser, createMockToken, createMockEnv, createMockLogger, createMockKvCache } from '../fixtures/test-utils.js';
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

    vi.clearAllMocks();
  });

  describe('convertEnv', () => {
    it('should convert ExtendedEnv to RuntimeEnv', () => {
      const env = createMockEnv({ NODE_ENV: 'production', SUPABASE_URL: 'https://test.supabase.co' });
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
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn(() => ({
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          child: vi.fn(),
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
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn(() => ({
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          child: vi.fn(),
        })),
      };

      const runtimeLogger = convertLogger(cloudflareLogger as any);
      runtimeLogger.info('Test message', { key: 'value' });

      expect(cloudflareLogger.info).toHaveBeenCalledWith({ key: 'value' }, 'Test message');
    });

    it('should call Cloudflare logger.info with empty object when no meta provided', () => {
      const cloudflareLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn(() => ({
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          child: vi.fn(),
        })),
      };

      const runtimeLogger = convertLogger(cloudflareLogger as any);
      runtimeLogger.info('Test message');

      expect(cloudflareLogger.info).toHaveBeenCalledWith({}, 'Test message');
    });

    it('should call Cloudflare logger.error with error in meta', () => {
      const cloudflareLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn(() => ({
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          child: vi.fn(),
        })),
      };

      const runtimeLogger = convertLogger(cloudflareLogger as any);
      const testError = new Error('Test error');
      runtimeLogger.error('Error message', testError, { key: 'value' });

      expect(cloudflareLogger.error).toHaveBeenCalledWith({ error: testError, key: 'value' }, 'Error message');
    });

    it('should create child logger', () => {
      const childLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn(),
      };

      const cloudflareLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
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

