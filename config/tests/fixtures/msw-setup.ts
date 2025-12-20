/**
 * MSW (Mock Service Worker) Setup for API Mocking
 *
 * Provides MSW setup for both Playwright and Vitest tests.
 * Allows network-level API mocking without a server.
 *
 * @module config/tests/fixtures/msw-setup
 */

import { http, HttpResponse, type HttpHandler } from 'msw';
import { setupServer } from 'msw/node';
import { setupWorker } from 'msw/browser';

/**
 * Common API response handlers for testing
 *
 * These can be extended or overridden in individual test files.
 */
export const defaultHandlers: HttpHandler[] = [
  // Add default handlers here
  // Example:
  // http.get('/api/status', () => {
  //   return HttpResponse.json({ status: 'ok' });
  // }),
];

/**
 * Setup MSW server for Node.js tests (Vitest)
 *
 * @param handlers - Additional handlers to use (merged with defaultHandlers)
 * @returns MSW server instance
 *
 * @example
 * ```typescript
 * import { setupMswServer } from '@/config/tests/fixtures/msw-setup';
 *
 * const server = setupMswServer([
 *   http.get('/api/users', () => HttpResponse.json({ users: [] })),
 * ]);
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 */
export function setupMswServer(handlers: HttpHandler[] = []) {
  return setupServer(...defaultHandlers, ...handlers);
}

/**
 * Setup MSW worker for browser tests (Playwright)
 *
 * @param handlers - Additional handlers to use (merged with defaultHandlers)
 * @returns MSW worker instance
 *
 * @example
 * ```typescript
 * import { setupMswWorker } from '@/config/tests/fixtures/msw-setup';
 *
 * test.beforeAll(async () => {
 *   const worker = setupMswWorker([
 *     http.get('/api/users', () => HttpResponse.json({ users: [] })),
 *   ]);
 *   await worker.start();
 * });
 * ```
 */
export function setupMswWorker(handlers: HttpHandler[] = []) {
  return setupWorker(...defaultHandlers, ...handlers);
}

/**
 * Common API response factories
 */
export const apiResponses = {
  success: <T>(data: T) => HttpResponse.json(data, { status: 200 }),
  created: <T>(data: T) => HttpResponse.json(data, { status: 201 }),
  notFound: () => HttpResponse.json({ error: 'Not found' }, { status: 404 }),
  unauthorized: () => HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  badRequest: (message?: string) =>
    HttpResponse.json({ error: message || 'Bad request' }, { status: 400 }),
  serverError: (message?: string) =>
    HttpResponse.json({ error: message || 'Internal server error' }, { status: 500 }),
};

// Re-export MSW utilities for convenience
export { http, HttpResponse } from 'msw';
export type { HttpHandler } from 'msw';
