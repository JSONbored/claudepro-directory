/**
 * Runtime-Agnostic Type Definitions
 *
 * Abstract interfaces that work across different runtime environments
 * (Cloudflare Workers, Node.js, etc.)
 */

import type { PrismaClient } from '@prisma/client';
import type { User } from '@supabase/supabase-js';

/**
 * Abstract environment interface
 * Runtime-specific implementations will extend this
 */
export interface RuntimeEnv {
  [key: string]: unknown;
}

/**
 * Abstract logger interface
 * Runtime-specific implementations will implement this
 */
export interface RuntimeLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  child(meta: Record<string, unknown>): RuntimeLogger;
}

/**
 * Tool handler context (runtime-agnostic)
 */
export interface ToolContext {
  prisma: PrismaClient;
  user: User;
  token: string;
  env: RuntimeEnv;
  logger: RuntimeLogger;
}

/**
 * MCP Server configuration options (runtime-agnostic)
 */
export interface McpServerOptions {
  prisma: PrismaClient;
  user: User;
  token: string;
  env: RuntimeEnv;
  logger: RuntimeLogger;
}

