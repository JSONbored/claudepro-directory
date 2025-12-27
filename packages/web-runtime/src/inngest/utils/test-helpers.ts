/**
 * Inngest Test Helpers for Action Tests
 *
 * Provides utilities for action tests to verify Inngest events are sent correctly
 * and actually execute the corresponding Inngest functions using InngestTestEngine.
 * This creates true integration testing: action → Inngest event → Inngest function execution.
 *
 * **Key Feature:** When an action sends an Inngest event, the corresponding Inngest function
 * is actually executed (via InngestTestEngine), creating true end-to-end integration testing.
 *
 * @module web-runtime/inngest/utils/test-helpers
 */

import { expect, jest } from '@jest/globals';
import type { Inngest } from 'inngest';
import { InngestTestEngine } from '@inngest/test';
import type { InngestFunction } from 'inngest';

/**
 * Registry of event names to Inngest functions
 * This allows us to find and execute the correct function when an event is sent
 */
const EVENT_FUNCTION_REGISTRY = new Map<string, InngestFunction<any, any, any>>();

/**
 * Register an Inngest function for a specific event name
 * This should be called in test setup to register functions that will be triggered
 *
 * @param eventName - The event name that triggers the function (e.g., 'email/contact')
 * @param fn - The Inngest function to execute (e.g., sendContactEmails)
 *
 * @example
 * ```typescript
 * import { sendContactEmails } from '../inngest/functions/email/contact';
 *
 * beforeEach(() => {
 *   registerInngestFunction('email/contact', sendContactEmails);
 * });
 * ```
 */
export function registerInngestFunction(eventName: string, fn: InngestFunction<any, any, any>) {
  EVENT_FUNCTION_REGISTRY.set(eventName, fn);
}

/**
 * Register multiple Inngest functions at once
 * Useful for registering all functions that an action might trigger
 *
 * @param functions - Array of { eventName, function } pairs
 *
 * @example
 * ```typescript
 * import { sendContactEmails } from '../inngest/functions/email/contact';
 * import { sendWelcomeEmail } from '../inngest/functions/email/welcome';
 *
 * beforeEach(() => {
 *   registerInngestFunctions([
 *     { eventName: 'email/contact', fn: sendContactEmails },
 *     { eventName: 'email/welcome', fn: sendWelcomeEmail },
 *   ]);
 * });
 * ```
 */
export function registerInngestFunctions(
  functions: Array<{ eventName: string; fn: InngestFunction<any, any, any> }>
) {
  for (const { eventName, fn } of functions) {
    EVENT_FUNCTION_REGISTRY.set(eventName, fn);
  }
}

/**
 * Create an interceptor for inngest.send() that actually executes Inngest functions
 * This creates true integration: action → Inngest event → Inngest function execution
 *
 * **How it works:**
 * 1. Action calls `inngest.send({ name: 'email/contact', data: {...} })`
 * 2. Interceptor finds the registered function for 'email/contact'
 * 3. Executes the function using InngestTestEngine (same as Inngest function tests)
 * 4. Returns success/error as if Inngest processed it
 *
 * **Benefits:**
 * - ✅ True integration: action tests actually execute Inngest functions
 * - ✅ No real API calls: uses InngestTestEngine (in-memory execution)
 * - ✅ Same test infrastructure: Inngest functions use same mocks as their own tests
 * - ✅ Catches integration bugs: verifies action → function flow works end-to-end
 *
 * @param inngest - The Inngest client instance
 * @returns A Jest spy that intercepts send() and executes functions via InngestTestEngine
 *
 * @example
 * ```typescript
 * import { sendContactEmails } from '../inngest/functions/email/contact';
 * import { createInngestIntegrationSpy } from '../inngest/utils/test-helpers';
 *
 * beforeEach(async () => {
 *   // Register the function that handles events from this action
 *   registerInngestFunction('email/contact', sendContactEmails);
 *
 *   // Create integration spy (intercepts send() and executes functions)
 *   const { inngest } = await import('../inngest/client.ts');
 *   inngestSendSpy = createInngestIntegrationSpy(inngest);
 * });
 *
 * it('should send contact email event', async () => {
 *   await submitContactForm({ ... });
 *
 *   // Verify event was sent (and function was executed)
 *   expectInngestEvent(inngestSendSpy, 'email/contact', {
 *     submissionId: 'sub-123',
 *   });
 *
 *   // Verify function executed (check mocks from Inngest function)
 *   expect(mockSendEmail).toHaveBeenCalled();
 * });
 * ```
 */
export function createInngestIntegrationSpy(inngest: Inngest) {
  // Create spy that intercepts send() calls and executes functions
  const spy = jest.spyOn(inngest, 'send').mockImplementation(async (event) => {
    // Find the function that handles this event
    const fn = EVENT_FUNCTION_REGISTRY.get(event.name);

    if (fn) {
      // Execute the function using InngestTestEngine (same as Inngest function tests)
      // This creates a fresh test engine for each event (prevents state caching)
      const testEngine = new InngestTestEngine({
        function: fn,
      });

      try {
        // Execute the function with the event data
        // This will use the same mocks as the Inngest function tests
        // Provide default step handlers to prevent hanging on step.sleep() and step.waitForEvent()
        const { result, error } = await testEngine.execute({
          events: [
            {
              name: event.name,
              data: event.data as Record<string, unknown>,
            },
          ],
          steps: [
            // Default step handlers for common Inngest patterns
            // step.sleep() - return immediately (no-op)
            {
              id: 'wait-for-report',
              handler: () => {
                // No-op: step completes immediately
              },
            },
            {
              id: 'wait-for-expiration-reminder',
              handler: () => {
                // No-op: step completes immediately
              },
            },
            {
              id: 'delay-tips-email',
              handler: () => {
                // No-op: step completes immediately
              },
            },
            // step.waitForEvent() - return null (timeout)
            {
              id: 'wait-for-view',
              handler: () => {
                // Return null for timeout (no event received)
                return null;
              },
            },
            {
              id: 'wait-for-engagement',
              handler: () => {
                // Return null for timeout (no event received)
                return null;
              },
            },
          ],
        });

        if (error) {
          // Function execution failed - return error (Inngest would retry)
          // Ensure error is an Error object for proper propagation
          const errorToThrow = error instanceof Error ? error : new Error(String(error));
          throw errorToThrow;
        }

        // Function executed successfully - return success (mimics Inngest API response)
        // The actual function result is available via testEngine, but we return
        // a success response to match what Inngest API would return
        return { ids: [`event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`] };
      } catch (err) {
        // Function execution failed - return error
        // This allows action tests to verify error handling
        // Ensure error is an Error object for proper propagation
        const errorToThrow = err instanceof Error ? err : new Error(String(err));
        throw errorToThrow;
      }
    } else {
      // No function registered for this event - just verify it was sent
      // (This is OK - some events might not have functions registered in tests,
      // or the function might be tested separately)
      return { ids: [`event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`] };
    }
  });

  return spy;
}

/**
 * Create a spy on the Inngest client's send method (simple version - just verifies events)
 * Use this if you don't want to execute functions, just verify events are sent
 *
 * @param inngest - The Inngest client instance
 * @returns A Jest spy on the send method
 */
export function createInngestSendSpy(inngest: Inngest) {
  // Use jest.spyOn to spy on the real send method
  // This allows us to verify events are sent while using the real client
  return jest.spyOn(inngest, 'send').mockResolvedValue({ ids: ['event-id'] });
}

/**
 * Clear the Inngest function registry
 * Call this in afterEach to prevent function registry from persisting between tests
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   clearInngestFunctionRegistry();
 * });
 * ```
 */
export function clearInngestFunctionRegistry() {
  EVENT_FUNCTION_REGISTRY.clear();
}

/**
 * Verify an Inngest event was sent with the correct data
 *
 * @param sendSpy - The Jest spy on inngest.send()
 * @param eventName - Expected event name
 * @param eventData - Expected event data (partial match is OK)
 */
export function expectInngestEvent(
  sendSpy: ReturnType<typeof jest.spyOn>,
  eventName: string,
  eventData?: Record<string, unknown>
) {
  expect(sendSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      name: eventName,
      ...(eventData && { data: expect.objectContaining(eventData) }),
    })
  );
}

/**
 * Get all Inngest events that were sent
 *
 * @param sendSpy - The Jest spy on inngest.send()
 * @returns Array of all events that were sent
 */
export function getInngestEvents(sendSpy: ReturnType<typeof jest.spyOn>) {
  return sendSpy.mock.calls.map((call) => call[0]);
}

/**
 * Clear all Inngest event history
 *
 * @param sendSpy - The Jest spy on inngest.send()
 */
export function clearInngestEvents(sendSpy: ReturnType<typeof jest.spyOn>) {
  sendSpy.mockClear();
}
