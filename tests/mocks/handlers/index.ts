/**
 * MSW Request Handlers - Central Registry
 *
 * Aggregates all mock request handlers for API routes, Server Actions,
 * and external services. Provides type-safe, production-grade mocking
 * for unit and integration tests.
 *
 * **Architecture:**
 * - Modular handler organization by feature/domain
 * - Type-safe responses matching actual API contracts
 * - Realistic data fixtures with proper validation
 * - Error scenario handlers for negative testing
 * - Performance simulation (delays, timeouts)
 *
 * **Security:**
 * - No production secrets or credentials
 * - Sanitized test data only
 * - Rate limiting simulation for security tests
 *
 * **Usage:**
 * ```ts
 * import { server } from '@/tests/mocks/server';
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 *
 * @see https://mswjs.io/docs/
 */

import { apiHandlers } from './api-handlers';
import { authHandlers } from './auth-handlers';
import { contentHandlers } from './content-handlers';
import { externalHandlers } from './external-handlers';

/**
 * All request handlers
 * Organized by feature domain for maintainability
 */
export const handlers = [
  ...contentHandlers, // Content API handlers (agents, mcp, commands, etc.)
  ...apiHandlers, // API route handlers
  ...authHandlers, // Authentication/authorization handlers
  ...externalHandlers, // External service handlers (Supabase, Redis, etc.)
];

/**
 * Export individual handler groups for targeted testing
 */
export { apiHandlers, authHandlers, contentHandlers, externalHandlers };
