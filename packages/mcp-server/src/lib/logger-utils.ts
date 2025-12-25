/**
 * Simple Logger Utility
 *
 * Provides a basic console logger implementation for runtime-agnostic code.
 * For Cloudflare Workers, use createLogger from @heyclaude/cloudflare-runtime.
 * For Node.js, use a proper logger like Pino.
 */

import type { RuntimeLogger } from '../types/runtime.js';

/**
 * Create a simple console-based logger
 *
 * @param name - Logger name (optional)
 * @returns RuntimeLogger instance
 */
export function createSimpleLogger(name?: string): RuntimeLogger {
  const prefix = name ? `[${name}]` : '';

  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.log(`${prefix} ${message}`, meta ? JSON.stringify(meta) : '');
    },
    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      console.error(`${prefix} ${message}`, error, meta ? JSON.stringify(meta) : '');
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(`${prefix} ${message}`, meta ? JSON.stringify(meta) : '');
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      console.debug(`${prefix} ${message}`, meta ? JSON.stringify(meta) : '');
    },
    child: (_meta: Record<string, unknown>) => {
      // Simple logger doesn't support child loggers with context
      // Return a new logger instance (context is ignored for simplicity)
      return createSimpleLogger(name);
    },
  };
}
