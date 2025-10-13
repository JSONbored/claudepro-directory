/**
 * MSW Test Server Setup
 *
 * Configures Mock Service Worker for Node.js test environment (Vitest).
 * Intercepts HTTP requests during tests to provide deterministic,
 * fast, and offline-capable testing.
 *
 * **Architecture:**
 * - Uses MSW v2 with Node.js adapter
 * - Handlers organized by domain (content, API, auth, external)
 * - Supports runtime handler override for specific test scenarios
 * - Comprehensive error simulation for negative testing
 *
 * **Performance:**
 * - No real network calls = 10-100x faster tests
 * - Deterministic responses = no flaky tests
 * - Parallel test execution without conflicts
 *
 * **Security:**
 * - Prevents accidental production API calls during tests
 * - No real credentials or API keys needed
 * - Isolated test environment
 *
 * **Usage:**
 * ```ts
 * // In tests/setup.tsx or individual test files
 * import { server } from '@/tests/mocks/server';
 *
 * beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 *
 * **Override Handlers:**
 * ```ts
 * test('should handle API error', async () => {
 *   server.use(
 *     http.get('http://localhost:3000/api/agents.json', () => {
 *       return HttpResponse.json({ error: 'Server error' }, { status: 500 });
 *     })
 *   );
 *
 *   // Test error handling...
 * });
 * ```
 *
 * @see https://mswjs.io/docs/api/setup-server
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server Instance
 *
 * Configured for Node.js environment (Vitest, Jest).
 * Starts before tests, resets after each test, closes after all tests.
 */
export const server = setupServer(...handlers);

/**
 * Export handlers for test-specific overrides
 */
export { handlers } from './handlers';
export { apiErrorHandlers, cronHandlers } from './handlers/api-handlers';
export { authErrorHandlers } from './handlers/auth-handlers';
export { contentErrorHandlers } from './handlers/content-handlers';
export { externalErrorHandlers } from './handlers/external-handlers';
