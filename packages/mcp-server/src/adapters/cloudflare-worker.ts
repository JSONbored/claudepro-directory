/**
 * Cloudflare Worker Adapter
 *
 * Bridges runtime-agnostic MCP server with Cloudflare Workers-specific types.
 * Converts Cloudflare-specific types (ExtendedEnv, Logger) to runtime-agnostic types.
 */

// Cloudflare runtime types for adapter (type-only imports)
// Added as devDependency for type-checking in standalone package
import type { ExtendedEnv } from '@heyclaude/cloudflare-runtime/config/env';
import type { Logger } from '@heyclaude/cloudflare-runtime/logging/pino';
import type {
  RuntimeEnv,
  RuntimeLogger,
  ToolContext,
  McpServerOptions,
  KvNamespace,
} from '../types/runtime.js';
import type { PrismaClient } from '@prisma/client';
import type { User } from '@supabase/supabase-js';

/**
 * Convert Cloudflare ExtendedEnv to runtime-agnostic RuntimeEnv
 */
export function convertEnv(env: ExtendedEnv): RuntimeEnv {
  return env as RuntimeEnv;
}

/**
 * Convert Cloudflare Logger to runtime-agnostic RuntimeLogger
 */
export function convertLogger(logger: Logger): RuntimeLogger {
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(meta || {}, message);
    },
    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      logger.error({ error, ...meta }, message);
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      logger.warn(meta || {}, message);
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      logger.debug(meta || {}, message);
    },
    child: (meta: Record<string, unknown>) => {
      const childLogger = logger.child(meta);
      return convertLogger(childLogger);
    },
  };
}

/**
 * Convert Cloudflare-specific options to runtime-agnostic options
 */
export function convertMcpServerOptions(options: {
  prisma: PrismaClient;
  user: User;
  token: string;
  env: ExtendedEnv;
  logger: Logger;
  kvCache?: KvNamespace | null;
}): McpServerOptions {
  return {
    prisma: options.prisma,
    user: options.user,
    token: options.token,
    env: convertEnv(options.env),
    logger: convertLogger(options.logger),
    kvCache: options.kvCache ?? null,
  };
}

/**
 * Convert runtime-agnostic ToolContext to Cloudflare-specific context
 * (for backward compatibility with existing tool handlers)
 */
export function convertToolContext(context: ToolContext): {
  prisma: PrismaClient;
  user: User;
  token: string;
  env: ExtendedEnv;
  logger: Logger;
} {
  return {
    prisma: context.prisma,
    user: context.user,
    token: context.token,
    env: context.env as ExtendedEnv,
    logger: context.logger as Logger,
  };
}
