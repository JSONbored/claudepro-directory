/**
 * Test Utilities for MCP Server Tests
 * 
 * Provides mock factories and utilities for testing MCP server components.
 */

import { vi } from 'vitest';

/**
 * Create a mock logger for testing
 * 
 * @returns Mock logger with standard methods
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => createMockLogger()),
  };
}

/**
 * Create a mock user object for testing
 * 
 * @param overrides - Partial user data to override defaults
 * @returns Mock user object
 */
export function createMockUser(overrides?: {
  id?: string;
  email?: string;
  [key: string]: unknown;
}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides,
  };
}

/**
 * Create a mock token object for testing
 * 
 * @param overrides - Partial token data to override defaults
 * @returns Mock token object
 */
export function createMockToken(overrides?: {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  [key: string]: unknown;
}) {
  return {
    access_token: 'test-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    ...overrides,
  };
}

/**
 * Create a mock KV cache for testing
 * 
 * @returns Mock KV cache with get/put/delete methods
 */
export function createMockKvCache() {
  const cache = new Map<string, { value: string; expirationTtl?: number }>();
  
  return {
    get: vi.fn(async (key: string) => {
      const entry = cache.get(key);
      return entry?.value ?? null;
    }),
    put: vi.fn(async (key: string, value: string, options?: { expirationTtl?: number }) => {
      cache.set(key, { value, expirationTtl: options?.expirationTtl });
    }),
    delete: vi.fn(async (key: string) => {
      cache.delete(key);
    }),
  };
}

/**
 * Create a mock environment object for testing
 * 
 * @param overrides - Partial env data to override defaults
 * @returns Mock environment object
 */
export function createMockEnv(overrides?: Record<string, unknown>) {
  return {
    NODE_ENV: 'test',
    ...overrides,
  };
}

