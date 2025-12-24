/**
 * Hook Integration Helpers
 *
 * Provides utilities for testing React hooks with real server actions end-to-end.
 * This enables true integration testing: Hook → Action → RPC → Database (Prismocker).
 *
 * **Key Feature:** Intercepts `fetch` calls from `useAction` (next-safe-action/hooks)
 * and routes them to real server action functions, creating true end-to-end integration.
 *
 * @module web-runtime/hooks/__helpers__/integration-helpers
 */

import type { SafeActionResult } from '@jsonbored/safemocker';

/**
 * Registry of action functions for integration testing
 * Maps action function references to their implementations
 * 
 * Note: Since we can't easily match HTTP requests to specific actions,
 * we try all registered actions until one succeeds. This works because:
 * 1. Actions validate their input schemas
 * 2. Only the correct action will succeed with the given input
 * 3. Wrong actions will throw validation errors (which we catch and continue)
 */
const ACTION_REGISTRY = new Set<Function>();

/**
 * Register a server action for integration testing
 *
 * When `useAction` makes an HTTP request, the interceptor will try calling
 * all registered actions until one succeeds (based on input validation).
 *
 * @param action - The server action function to register
 *
 * @example
 * ```typescript
 * import { addBookmark } from '@heyclaude/web-runtime/actions/bookmarks';
 *
 * beforeEach(() => {
 *   registerActionForIntegration(addBookmark);
 * });
 * ```
 */
export function registerActionForIntegration(action: Function) {
  ACTION_REGISTRY.add(action);
}

/**
 * Register multiple server actions at once
 *
 * @param actions - Array of action functions to register
 *
 * @example
 * ```typescript
 * import { addBookmark, removeBookmark } from '@heyclaude/web-runtime/actions/bookmarks';
 *
 * beforeEach(() => {
 *   registerActionsForIntegration([addBookmark, removeBookmark]);
 * });
 * ```
 */
export function registerActionsForIntegration(actions: Function[]) {
  for (const action of actions) {
    ACTION_REGISTRY.add(action);
  }
}

/**
 * Clear the action registry
 * Call this in afterEach to prevent action registry from persisting between tests
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   clearActionRegistry();
 * });
 * ```
 */
export function clearActionRegistry() {
  ACTION_REGISTRY.clear();
}

/**
 * Create a fetch interceptor that routes server action calls to real action functions
 *
 * **How it works:**
 * 1. `useAction` from `next-safe-action/hooks` makes HTTP POST requests to server actions
 * 2. This interceptor intercepts those `fetch` calls
 * 3. Tries calling each registered action with the request body
 * 4. Returns the first successful result (actions validate input, so only correct one succeeds)
 * 5. Returns the `SafeActionResult` structure that `useAction` expects
 *
 * **Benefits:**
 * - ✅ True integration: hook tests actually execute server actions
 * - ✅ No real HTTP calls: routes to real functions directly
 * - ✅ Same test infrastructure: actions use same mocks (Prismocker, Safemocker) as their own tests
 * - ✅ Catches integration bugs: verifies hook → action flow works end-to-end
 *
 * **Usage:**
 * ```typescript
 * import { addBookmark } from '@heyclaude/web-runtime/actions/bookmarks';
 * import { setupActionIntegration } from '../__helpers__/integration-helpers';
 *
 * beforeEach(() => {
 *   // Register actions that will be called by hooks
 *   registerActionForIntegration(addBookmark);
 *
 *   // Set up fetch interceptor
 *   fetchSpy = setupActionIntegration();
 * });
 *
 * afterEach(() => {
 *   // Clean up
 *   fetchSpy.mockRestore();
 *   clearActionRegistry();
 * });
 * ```
 *
 * @returns A Jest spy on `global.fetch` that intercepts and routes action calls
 */
export function setupActionIntegration(): ReturnType<typeof jest.spyOn> {
  // Store original fetch
  const originalFetch = global.fetch;

  // Create spy that intercepts fetch calls
  const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || 'GET';
    
    // Parse request body
    let requestBody: unknown = undefined;
    if (init?.body) {
      try {
        requestBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      } catch {
        // If body isn't JSON, leave it as-is
        requestBody = init.body;
      }
    }

    // Check if this is a server action call (POST request)
    if (method === 'POST') {
      // Try each registered action until one succeeds
      // Actions validate their input schemas, so only the correct action will succeed
      const errors: Error[] = [];
      
      for (const action of ACTION_REGISTRY) {
        try {
          // Call the real action function with the request body
          // The body from next-safe-action contains the input data
          const result = await (action as (input: unknown) => Promise<SafeActionResult<unknown>>)(requestBody);
          
          // Return the result in the format next-safe-action expects
          // next-safe-action expects a Response with JSON body containing SafeActionResult
          return new Response(
            JSON.stringify(result),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (error) {
          // This action didn't match (validation error or other error)
          // Store the error and try the next action
          errors.push(error instanceof Error ? error : new Error(String(error)));
          continue;
        }
      }

      // No action matched - return error response
      // This helps identify when an action isn't registered
      return new Response(
        JSON.stringify({
          serverError: `No registered action matched the request. Tried ${ACTION_REGISTRY.size} action(s). Errors: ${errors.map(e => e.message).join('; ')}`,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // For non-POST requests, use original fetch (or return error in test environment)
    // In test environment, we might want to mock all fetch calls
    if (typeof originalFetch === 'function') {
      return originalFetch(input as RequestInfo, init as RequestInit);
    }
    
    // Fallback: return error for unhandled requests
    return new Response(
      JSON.stringify({ serverError: 'Unhandled fetch request in test environment' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });

  return fetchSpy;
}

/**
 * Verify an action was called via the hook
 *
 * @param fetchSpy - The Jest spy on `global.fetch` from `setupActionIntegration()`
 * @param actionInput - Expected input to the action (partial match is OK)
 * @returns Whether the action was called with matching input
 *
 * @example
 * ```typescript
 * it('should call addBookmark action', async () => {
 *   await act(async () => {
 *     await result.current.executeAsync({ content_slug: 'test', content_type: 'mcp' });
 *   });
 *
 *   expectActionCalled(fetchSpy, { content_slug: 'test', content_type: 'mcp' });
 * });
 * ```
 */
export function expectActionCalled(
  fetchSpy: ReturnType<typeof jest.spyOn>,
  actionInput?: Record<string, unknown>
): void {
  expect(fetchSpy).toHaveBeenCalled();
  
  if (actionInput) {
    // Check if any call matches the expected input
    const matchingCall = fetchSpy.mock.calls.find((call) => {
      const init = call[1] as RequestInit | undefined;
      if (!init?.body) return false;
      
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      return Object.entries(actionInput).every(([key, value]) => body[key] === value);
    });
    
    expect(matchingCall).toBeDefined();
  }
}

/**
 * Get all action calls made via the hook
 *
 * @param fetchSpy - The Jest spy on `global.fetch` from `setupActionIntegration()`
 * @returns Array of action inputs that were called
 */
export function getActionCalls(fetchSpy: ReturnType<typeof jest.spyOn>): unknown[] {
  return fetchSpy.mock.calls
    .map((call) => {
      const init = call[1] as RequestInit | undefined;
      if (!init?.body) return null;
      return typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    })
    .filter((body): body is unknown => body !== null);
}

/**
 * Clear all action call history
 *
 * @param fetchSpy - The Jest spy on `global.fetch` from `setupActionIntegration()`
 */
export function clearActionCalls(fetchSpy: ReturnType<typeof jest.spyOn>): void {
  fetchSpy.mockClear();
}

