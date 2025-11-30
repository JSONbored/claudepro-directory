/**
 * Type-safe wrapper for next-safe-action's useAction hook
 *
 * This wrapper addresses a type inference issue between next-safe-action v8 and Zod v4
 * where TypeScript loses precise schema type information when actions are re-exported
 * through barrel files.
 *
 * @example
 * ```tsx
 * import { useSafeAction } from '@heyclaude/web-runtime/hooks';
 * import { myAction } from '@heyclaude/web-runtime/actions';
 *
 * function MyComponent() {
 *   const { executeAsync, result } = useSafeAction(myAction);
 *   // Types are properly inferred
 * }
 * ```
 */
'use client';

import { useAction } from 'next-safe-action/hooks';

/**
 * Extract the return data type from an action's Promise return type.
 * Handles the SafeActionResult structure { data?: T, serverError?: string, validationErrors?: ... }
 */
type ExtractActionData<T> = T extends (...args: infer _Args) => Promise<infer R>
  ? R extends { data?: infer D }
    ? D
    : unknown
  : unknown;

/**
 * Extract the input type from an action function (first argument type)
 */
type ExtractActionInput<T> = T extends (input: infer I, ...args: infer _Rest) => Promise<infer _R>
  ? I
  : unknown;

/**
 * Callbacks for action lifecycle events.
 * Exported for documentation purposes - the actual parameter uses `any` due to
 * type inference limitations with next-safe-action's HookCallbacks type.
 */
export interface SafeActionCallbacks<TInput, TData> {
  onSuccess?: (args: { data?: TData; input: TInput }) => void;
  onError?: (args: {
    error: { serverError?: string; validationErrors?: unknown };
    input: TInput;
  }) => void;
  onSettled?: (args: {
    result: { data?: TData; serverError?: string };
    input: TInput;
  }) => void;
  onExecute?: (args: { input: TInput }) => void;
}

/**
 * Hook return type that preserves the action's input and output types.
 * Matches next-safe-action's useAction return shape including fetchError for transport errors.
 */
interface UseSafeActionReturn<TInput, TData> {
  execute: (input: TInput) => void;
  executeAsync: (input: TInput) => Promise<{
    data?: TData;
    serverError?: string;
    fetchError?: string;
    // Kept loose to match client-level validation error configuration
    validationErrors?: unknown;
  }>;
  input: TInput | undefined;
  result: {
    data?: TData;
    serverError?: string;
    fetchError?: string;
    // Kept loose to match client-level validation error configuration
    validationErrors?: unknown;
  };
  reset: () => void;
  status: 'idle' | 'executing' | 'transitioning' | 'hasSucceeded' | 'hasErrored' | 'hasNavigated';
  isIdle: boolean;
  isExecuting: boolean;
  isTransitioning: boolean;
  isPending: boolean;
  hasSucceeded: boolean;
  hasErrored: boolean;
  hasNavigated: boolean;
}

/**
 * Type-safe client-compatible wrapper around `useAction` that preserves runtime behavior while fixing
 * TypeScript inference issues when Zod v4 schemas are re-exported through barrel files.
 *
 * Uses a type assertion to avoid incorrect StandardSchema type inference; runtime behavior is
 * identical to `useAction`.
 *
 * ⚠️ Client-Compatible
 *
 * @param {TAction} action - The action function to wrap; must be a function that returns a `Promise`
 *                           whose resolved value may include an optional `data` property.
 * @param {any} callbacks - Optional lifecycle callbacks forwarded to `useAction`.
 * @returns {UseSafeActionReturn<ExtractActionInput<TAction>, ExtractActionData<TAction>>} The hook
 *          return object exposing `execute`, `executeAsync`, `input`, `result`, `reset`, `status`,
 *          and boolean status flags.
 */
export function useSafeAction<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TAction extends (...args: any[]) => Promise<any>,
>(
  action: TAction,
  // Note: We use `any` here because SafeActionCallbacks<TInput, TData> is incompatible
  // with next-safe-action's HookCallbacks type due to exactOptionalPropertyTypes.
  // See SafeActionCallbacks for the expected shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callbacks?: any
): UseSafeActionReturn<ExtractActionInput<TAction>, ExtractActionData<TAction>> {
  // Use type assertion to bypass the StandardSchemaV1 inference issue
  // Runtime behavior is identical to useAction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useAction(action as any, callbacks) as any;
}

// Re-export the original useAction for cases where direct usage is needed
export { useAction };