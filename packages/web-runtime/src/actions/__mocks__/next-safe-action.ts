/**
 * Jest Mock for next-safe-action
 *
 * This mock uses safemocker to provide a fully functional mock of next-safe-action
 * that works in Jest environments where ESM modules cannot be directly imported.
 *
 * This file is automatically used by Jest when next-safe-action is imported.
 *
 * IMPORTANT: This file follows safemocker's exact pattern from their __mocks__/next-safe-action.ts
 * See: https://github.com/JSONbored/safemocker/blob/main/__mocks__/next-safe-action.ts
 */

import { createCompleteActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';

// Define metadata schema matching real usage
const actionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z
    .enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation', 'mfa'])
    .optional(),
});

// Create complete action clients with all middleware
const {
  actionClient: baseActionClient,
  rateLimitedAction,
  authedAction,
  optionalAuthAction,
} = createCompleteActionClient(actionMetadataSchema, {
  defaultServerError: 'Something went wrong',
  isProduction: false,
  auth: {
    enabled: true,
    testUserId: 'test-user-id',
    testUserEmail: 'test@example.com',
    testAuthToken: 'test-token',
  },
});

// Add initial middleware that adds userAgent and startTime (matching real safe-action.ts)
baseActionClient.use(async ({ next }) => {
  return next({
    ctx: {
      userAgent: 'test-user-agent',
      startTime: performance.now(),
    },
  }); // Correct: next-safe-action format { ctx: newContext }
});

// Export createSafeActionClient factory
export function createSafeActionClient(config?: {
  defineMetadataSchema?: () => z.ZodType;
  handleServerError?: (error: unknown) => string;
}) {
  // handleServerError is called when errors occur, not during initialization
  // Use a default error message for initialization
  // The handleServerError callback will be used when actual errors happen
  const client = createCompleteActionClient(
    config?.defineMetadataSchema?.() || actionMetadataSchema,
    {
      defaultServerError: 'Something went wrong',
      isProduction: false,
      auth: {
        enabled: true,
        testUserId: 'test-user-id',
        testUserEmail: 'test@example.com',
        testAuthToken: 'test-token',
      },
    }
  ).actionClient;

  // Add initial middleware
  client.use(async ({ next }) => {
    return next({
      ctx: {
        userAgent: 'test-user-agent',
        startTime: performance.now(),
      },
    }); // Correct: next-safe-action format { ctx: newContext }
  });

  return client;
}

// Export constants
export const DEFAULT_SERVER_ERROR_MESSAGE = 'Something went wrong';

// Export pre-configured actions (for convenience, matching real safe-action.ts pattern)
// These are the actions that will be used when safe-action.ts imports from next-safe-action
// The real safe-action.ts will chain additional middleware on top of these

// Note: The real safe-action.ts will call .use() on these, so we need to export
// the base clients that can be chained
export { authedAction, optionalAuthAction, rateLimitedAction };
