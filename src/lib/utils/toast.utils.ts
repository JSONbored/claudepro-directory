/**
 * Centralized toast message utilities for consistent UX
 */

import { toast } from 'sonner';
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
  screenshotCopied: () => toast.success('Screenshot copied & downloaded!'),

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
  screenshotFailed: () => toast.error('Failed to generate screenshot'),
  shareFailed: () => toast.error('Failed to share'),

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

export const infoToasts = {
  comingSoon: (feature?: string) =>
    toast.info(feature ? `${feature} coming soon!` : 'Coming soon!'),
  featureUnavailable: (reason?: string) =>
    toast.info(reason || 'This feature is currently unavailable'),
  redirecting: (destination?: string) =>
    toast.info(destination ? `Redirecting to ${destination}...` : 'Redirecting...'),
} as const;

export const warningToasts = {
  unsavedChanges: () => toast.warning('You have unsaved changes'),
  slowConnection: () => toast.warning('Slow connection detected. This may take longer than usual.'),
  limitReached: (limit: string) => toast.warning(`${limit} limit reached`),
} as const;

export const loadingToasts = {
  saving: () => toast.loading('Saving...'),
  loading: (action?: string) => toast.loading(action ? `${action}...` : 'Loading...'),
  processing: () => toast.loading('Processing...'),
} as const;

export const toasts = {
  success: successToasts,
  error: errorToasts,
  info: infoToasts,
  warning: warningToasts,
  loading: loadingToasts,
  // Direct access to sonner for advanced usage
  raw: toast,
} as const;

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

/**
 * Load toast message configuration from Statsig Dynamic Configs
 * Returns dynamic messages or falls back to hardcoded values
 *
 * Usage:
 * ```ts
 * const config = await loadToastConfig();
 * toast.success(config['toast.copied']);
 * ```
 */
export async function loadToastConfig(): Promise<Record<string, string>> {
  try {
    const { toastConfigs } = await import('@/src/lib/flags');
    const config = await toastConfigs();
    return config as Record<string, string>;
  } catch {
    // Return hardcoded fallbacks
    return {
      'toast.profile_updated': 'Profile updated successfully',
      'toast.signed_out': 'Signed out successfully',
      'toast.submission_created_title': 'Submission Created!',
      'toast.submission_created_description': 'Your {contentType} has been submitted for review.',
      'toast.template_applied_title': 'Template Applied!',
      'toast.template_applied_description': 'Form has been pre-filled. Customize as needed.',
      'toast.copied': 'Copied to clipboard!',
      'toast.link_copied': 'Link copied to clipboard!',
      'toast.code_copied': 'Code copied to clipboard!',
      'toast.screenshot_copied': 'Screenshot copied & downloaded!',
      'toast.bookmark_added': 'Bookmark added',
      'toast.bookmark_removed': 'Bookmark removed',
      'toast.changes_saved': 'Changes saved successfully',
      'toast.save_failed': 'Failed to save. Please try again.',
      'toast.required_fields': 'Please fill in all required fields',
      'toast.auth_required': 'Please sign in to continue',
      'toast.permission_denied': 'You do not have permission to perform this action',
      'toast.submission_error_title': 'Submission Error',
      'toast.submission_error_description': 'Failed to submit. Please try again.',
      'toast.network_error': 'Network error. Please check your connection and try again.',
      'toast.server_error': 'Server error. Please try again later.',
      'toast.rate_limited': 'Too many requests. Please wait a moment and try again.',
      'toast.screenshot_failed': 'Failed to generate screenshot',
      'toast.profile_update_failed': 'Failed to update profile',
      'toast.vote_update_failed': 'Failed to update vote',
      'toast.coming_soon': 'Coming soon!',
      'toast.redirecting': 'Redirecting...',
      'toast.unsaved_changes': 'You have unsaved changes',
      'toast.slow_connection': 'Slow connection detected. This may take longer than usual.',
      'toast.saving': 'Saving...',
      'toast.processing': 'Processing...',
    };
  }
}
