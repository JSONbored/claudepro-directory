'use client';

/**
 * useFormSubmit Hook
 *
 * A standardized hook for form submission that consolidates common patterns:
 * - Transition state management (isPending)
 * - Error handling with useLoggedAsync
 * - Toast notifications
 * - Router navigation on success
 * - Consistent logging
 *
 * This hook eliminates ~30-40 lines of duplicated code per form component.
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useTransition } from 'react';

import { toasts } from '../client/toast.ts';

import { useLoggedAsync } from './use-logged-async.ts';

/**
 * Form submit mode
 */
export type FormMode = 'create' | 'edit';

/**
 * Toast messages configuration
 */
export interface FormToastMessages {
  /** Message shown on successful create (default: 'Created successfully') */
  createSuccess?: string;
  /** Message shown on successful edit (default: 'Updated successfully') */
  editSuccess?: string;
  /** Title shown on error (default: 'Operation failed') */
  errorTitle?: string;
}

/**
 * Configuration for useFormSubmit
 */
export interface UseFormSubmitOptions<TResult = unknown> {
  /** Form scope name for logging (e.g., 'CollectionForm', 'CompanyForm') */
  scope: string;
  /** Form mode - affects success messages and logging */
  mode: FormMode;
  /** Toast message overrides */
  messages?: FormToastMessages;
  /** Path to navigate to on success (optional) */
  successRedirect?: string;
  /** Whether to call router.refresh() after success (default: true) */
  refreshOnSuccess?: boolean;
  /** Callback after successful submission */
  onSuccess?: (result: TResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Additional context for logging */
  logContext?: Record<string, string | number | boolean | undefined>;
}

/**
 * Return type from useFormSubmit
 */
export interface UseFormSubmitReturn<TResult> {
  /** Whether the form is currently submitting */
  isPending: boolean;
  /** Submit handler that wraps your async operation */
  handleSubmit: (operation: () => Promise<TResult>) => Promise<void>;
  /** Direct access to the router for custom navigation */
  router: ReturnType<typeof useRouter>;
}

/**
 * Hook for standardized form submission handling.
 *
 * Provides:
 * - Loading state via React transitions
 * - Error handling with structured logging
 * - Toast notifications for success/error
 * - Optional navigation on success
 * - Consistent patterns across all forms
 *
 * @example
 * ```tsx
 * function CollectionForm({ mode, collection }) {
 *   const { isPending, handleSubmit } = useFormSubmit({
 *     scope: 'CollectionForm',
 *     mode,
 *     successRedirect: '/account/library',
 *     messages: {
 *       createSuccess: 'Collection created!',
 *       editSuccess: 'Collection updated!',
 *     },
 *   });
 *
 *   const onSubmit = async (e: FormEvent) => {
 *     e.preventDefault();
 *     await handleSubmit(async () => {
 *       if (mode === 'create') {
 *         return await createCollection(data);
 *       } else {
 *         return await updateCollection(collection.id, data);
 *       }
 *     });
 *   };
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       <Button disabled={isPending}>
 *         {isPending ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
 *       </Button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useFormSubmit<TResult = unknown>(
  options: UseFormSubmitOptions<TResult>
): UseFormSubmitReturn<TResult> {
  const {
    scope,
    mode,
    messages = {},
    successRedirect,
    refreshOnSuccess = true,
    onSuccess,
    onError,
    logContext,
  } = options;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Store last operation for retry functionality
  const lastOperationRef = useRef<(() => Promise<TResult>) | null>(null);

  const runLoggedAsync = useLoggedAsync({
    scope,
    defaultMessage: mode === 'create' ? 'Creation failed' : 'Update failed',
    defaultRethrow: false,
  });

  const handleSubmit = useCallback(
    async (operation: () => Promise<TResult>): Promise<void> => {
      // Store operation for retry
      lastOperationRef.current = operation;
      startTransition(async () => {
        try {
          const result = await runLoggedAsync(operation, {
            message: mode === 'create' ? `${scope} creation failed` : `${scope} update failed`,
            context: {
              mode,
              ...logContext,
            },
          });

          // If runLoggedAsync caught an error and didn't rethrow, result is undefined
          if (result === undefined) {
            return;
          }

          // Success!
          const successMessage =
            mode === 'create'
              ? (messages.createSuccess ?? 'Created successfully')
              : (messages.editSuccess ?? 'Updated successfully');

          toasts.raw.success('Success', { description: successMessage });

          onSuccess?.(result);

          if (successRedirect) {
            router.push(successRedirect);
          }

          if (refreshOnSuccess) {
            router.refresh();
          }
        } catch (error) {
          // Error escaped runLoggedAsync (shouldn't happen with defaultRethrow: false)
          const normalized = normalizeError(
            error,
            messages.errorTitle ?? 'Operation failed'
          );
          // Show error toast with "Retry" button
          // Note: Retry will call the operation again
          toasts.raw.error(messages.errorTitle ?? 'Operation failed', {
            description: normalized.message,
            action: {
              label: 'Retry',
              onClick: () => {
                // Retry by calling the operation again
                handleSubmit(operation).catch(() => {
                  // Error already handled by this catch block
                });
              },
            },
          });
          onError?.(normalized);
        }
      });
    },
    [
      runLoggedAsync,
      mode,
      scope,
      logContext,
      messages,
      onSuccess,
      successRedirect,
      refreshOnSuccess,
      onError,
      router,
    ]
  );

  return {
    isPending,
    handleSubmit,
    router,
  };
}
