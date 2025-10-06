import { logger } from '@/src/lib/logger';

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
