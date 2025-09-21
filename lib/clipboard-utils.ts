import { logger } from '@/lib/logger';

/**
 * Clipboard utilities
 */

/**
 * Copies text to clipboard with error handling
 * @param text - The text to copy to clipboard
 * @param context - Optional context for error logging
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(
  text: string,
  context?: { component?: string; action?: string }
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    logger.error(
      'Failed to copy to clipboard',
      err instanceof Error ? err : new Error(String(err)),
      {
        component: context?.component || 'Unknown',
        action: context?.action || 'copy',
        textLength: text.length,
      }
    );
    return false;
  }
}

/**
 * Hook for clipboard operations with state management
 * @param text - The text to copy
 * @param options - Configuration options
 * @returns Object with copy function and state
 */
export function createClipboardHandler(
  text: string,
  options: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    resetDelay?: number;
    context?: { component?: string; action?: string };
  } = {}
) {
  const { onSuccess, onError, context } = options;

  return async () => {
    const success = await copyToClipboard(text, context);

    if (success) {
      onSuccess?.();
    } else {
      onError?.(new Error('Failed to copy to clipboard'));
    }

    return success;
  };
}
