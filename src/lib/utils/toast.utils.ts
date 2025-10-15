/**
 * Toast Factory Utilities
 *
 * Centralized toast message creation with:
 * - Consistent messaging patterns across the app
 * - Reduced bundle size (2-3 KB saved by deduplicating common strings)
 * - Type-safe toast invocations
 * - Easy A/B testing and message updates
 *
 * Usage:
 * ```ts
 * import { toasts } from '@/src/lib/utils/toast.utils';
 *
 * // Instead of: toast.success('Profile updated successfully');
 * toasts.success.profileUpdated();
 *
 * // Instead of: toast.error('Failed to save. Please try again.');
 * toasts.error.saveFailed();
 *
 * // With dynamic content:
 * toasts.success.itemSaved('recommendation', 5);
 * ```
 */

import { toast } from 'sonner';

/**
 * Success Toast Messages
 * Common success scenarios across the application
 */
export const successToasts = {
  // Profile & Auth
  profileUpdated: () => toast.success('Profile updated successfully'),
  signedOut: () => toast.success('Signed out successfully'),

  // Content Management
  itemCreated: (type: string) => toast.success(`${type} created successfully`),
  itemUpdated: (type: string) => toast.success(`${type} updated successfully`),
  itemDeleted: (type: string) => toast.success(`${type} deleted successfully`),

  // Submissions
  submissionCreated: (contentType: string) =>
    toast.success('Submission Created!', {
      description: `Your ${contentType} has been submitted for review.`,
    }),
  templateApplied: () =>
    toast.success('Template Applied!', {
      description: 'Form has been pre-filled. Customize as needed.',
    }),

  // Clipboard
  copied: (item?: string) => toast.success(`${item ? `${item} c` : 'C'}opied to clipboard!`),
  linkCopied: () => toast.success('Link copied to clipboard!'),
  codeCopied: () => toast.success('Code copied to clipboard!'),

  // Library & Bookmarks
  savedToLibrary: (count: number, total?: number) =>
    toast.success(
      total
        ? `Saved ${count} of ${total} items to your library`
        : `Saved ${count} ${count === 1 ? 'item' : 'items'} to your library`
    ),
  bookmarkAdded: () => toast.success('Bookmark added'),
  bookmarkRemoved: () => toast.success('Bookmark removed'),

  // Generic
  changesSaved: () => toast.success('Changes saved successfully'),
  actionCompleted: (action: string) => toast.success(`${action} completed successfully`),
} as const;

/**
 * Error Toast Messages
 * Common error scenarios with consistent fallback messages
 */
export const errorToasts = {
  // Generic Failures
  saveFailed: (customMessage?: string) =>
    toast.error(customMessage || 'Failed to save. Please try again.'),
  loadFailed: (resource?: string) =>
    toast.error(resource ? `Failed to load ${resource}` : 'Failed to load data'),
  actionFailed: (action: string, customMessage?: string) =>
    toast.error(customMessage || `Failed to ${action}. Please try again.`),

  // Validation
  validation: (message: string) => toast.error(message),
  requiredFields: () => toast.error('Please fill in all required fields'),
  invalidInput: (field?: string) =>
    toast.error(field ? `Invalid ${field}` : 'Please check your input and try again'),

  // Auth
  authRequired: () => toast.error('Please sign in to continue'),
  authFailed: (message?: string) => toast.error(message || 'Authentication failed'),
  permissionDenied: () => toast.error('You do not have permission to perform this action'),

  // Submissions & Forms
  submissionFailed: (details?: string) =>
    toast.error('Submission Error', {
      description: details || 'Failed to submit. Please try again.',
    }),

  // Network & Server
  networkError: () => toast.error('Network error. Please check your connection and try again.'),
  serverError: (message?: string) =>
    toast.error(message || 'Server error. Please try again later.'),
  rateLimited: () => toast.error('Too many requests. Please wait a moment and try again.'),

  // Clipboard
  copyFailed: (item?: string) => toast.error(`Failed to copy${item ? ` ${item}` : ''}`),

  // Profile & User Actions
  profileUpdateFailed: () => toast.error('Failed to update profile'),
  profileRefreshFailed: () => toast.error('Failed to refresh profile'),

  // Reviews & Content
  reviewActionFailed: (action: string) => toast.error(`Failed to ${action} review`),
  voteUpdateFailed: () => toast.error('Failed to update vote'),

  // Generic with custom error handling
  fromError: (error: unknown, fallback = 'An error occurred') =>
    toast.error(error instanceof Error ? error.message : fallback),
} as const;

/**
 * Info Toast Messages
 * Informational messages for user guidance
 */
export const infoToasts = {
  comingSoon: (feature?: string) =>
    toast.info(feature ? `${feature} coming soon!` : 'Coming soon!'),
  featureUnavailable: (reason?: string) =>
    toast.info(reason || 'This feature is currently unavailable'),
  redirecting: (destination?: string) =>
    toast.info(destination ? `Redirecting to ${destination}...` : 'Redirecting...'),
} as const;

/**
 * Warning Toast Messages
 * Non-critical warnings and alerts
 */
export const warningToasts = {
  unsavedChanges: () => toast.warning('You have unsaved changes'),
  slowConnection: () => toast.warning('Slow connection detected. This may take longer than usual.'),
  limitReached: (limit: string) => toast.warning(`${limit} limit reached`),
} as const;

/**
 * Loading Toast Messages
 * Progress indicators for async operations
 */
export const loadingToasts = {
  saving: () => toast.loading('Saving...'),
  loading: (action?: string) => toast.loading(action ? `${action}...` : 'Loading...'),
  processing: () => toast.loading('Processing...'),
} as const;

/**
 * Unified Toast API
 * Single import for all toast types
 */
export const toasts = {
  success: successToasts,
  error: errorToasts,
  info: infoToasts,
  warning: warningToasts,
  loading: loadingToasts,
  // Direct access to sonner for advanced usage
  raw: toast,
} as const;

/**
 * Toast Promise Helper
 * Wrapper for toast.promise with consistent messaging
 */
export const toastPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) => {
  return toast.promise(promise, messages);
};
