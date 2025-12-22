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
 * KV namespace interface (runtime-agnostic)
 */
export interface KvNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Elicitation request schema
 * MCP elicitations support primitive types only (string, number, boolean, enum)
 */
export interface ElicitationRequest {
  type: 'string' | 'number' | 'boolean';
  description: string;
  enum?: readonly string[];
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
  /** Optional KV cache for resource caching (Cloudflare Workers only) */
  kvCache?: KvNamespace | null;
  /**
   * Optional elicitation method for requesting user input during tool execution
   * If not provided, tools should provide guidance messages instead
   */
  elicit?: (request: ElicitationRequest) => Promise<string | number | boolean | null>;
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
  /** Optional KV cache for resource caching (Cloudflare Workers only) */
  kvCache?: KvNamespace | null;
}

