'use client';

/**
 * Toast utilities with hardcoded defaults (client-safe)
 * No server imports, synchronous calls for client components
 *
 * Note: Toast messages use hardcoded defaults for client-side performance.
 * Server components can use toastConfigs from static-configs.ts if needed.
 */

import { toast } from 'sonner';
import { normalizeError } from '../errors.ts';
import type { Database } from '@heyclaude/database-types';

type ToastRaw = ((...args: Parameters<typeof toast>) => void) & {
  success: (...args: Parameters<typeof toast.success>) => void;
  error: (...args: Parameters<typeof toast.error>) => void;
  info: (...args: Parameters<typeof toast.info>) => void;
  warning: (...args: Parameters<typeof toast.warning>) => void;
  loading: (...args: Parameters<typeof toast.loading>) => void;
  dismiss: (...args: Parameters<typeof toast.dismiss>) => ReturnType<typeof toast.dismiss>;
};

const toastRaw: ToastRaw = toast;

/**
 * Hardcoded toast messages (client-safe defaults)
 * These match the static toastConfigs defaults
 */
const TOAST_MESSAGES = {
  profile_updated: 'Profile updated successfully',
  signed_out: 'Signed out successfully',
  submission_created_title: 'Submission Created!',
  submission_created_description: 'Your {contentType} has been submitted for review.',
  template_applied_title: 'Template Applied!',
  template_applied_description: 'Form has been pre-filled. Customize as needed.',
  copied: 'Copied to clipboard!',
  link_copied: 'Link copied to clipboard!',
  code_copied: 'Code copied to clipboard!',
  screenshot_copied: 'Screenshot copied & downloaded!',
  code_download_started: 'Code download started',
  code_download_failed: 'Failed to download code',
  bookmark_added: 'Bookmark added',
  bookmark_removed: 'Bookmark removed',
  changes_saved: 'Changes saved successfully',
  save_failed: 'Failed to save. Please try again.',
  required_fields: 'Please fill in all required fields',
  auth_required: 'Please sign in to continue',
  permission_denied: 'You do not have permission to perform this action',
  submission_error_title: 'Submission Error',
  submission_error_description: 'Failed to submit. Please try again.',
  network_error: 'Network error. Please check your connection and try again.',
  server_error: 'Server error. Please try again later.',
  rate_limited: 'Too many requests. Please wait a moment and try again.',
  screenshot_failed: 'Failed to generate screenshot',
  profile_update_failed: 'Failed to update profile',
  vote_update_failed: 'Failed to update vote',
  coming_soon: 'Coming soon!',
  redirecting: 'Redirecting...',
  unsaved_changes: 'You have unsaved changes',
  slow_connection: 'Slow connection detected. This may take longer than usual.',
  saving: 'Saving...',
  processing: 'Processing...',
} as const;

export const successToasts = {
  profileUpdated: () => toast.success(TOAST_MESSAGES.profile_updated),
  signedOut: () => toast.success(TOAST_MESSAGES.signed_out),
  itemCreated: (type: string) => toast.success(`${type} created successfully`),
  itemUpdated: (type: string) => toast.success(`${type} updated successfully`),
  itemDeleted: (type: string) => toast.success(`${type} deleted successfully`),
  submissionCreated: (contentType: Database['public']['Enums']['content_category']) =>
    toast.success(TOAST_MESSAGES.submission_created_title, {
      description: TOAST_MESSAGES.submission_created_description.replace(
        '{contentType}',
        contentType
      ),
    }),
  templateApplied: () =>
    toast.success(TOAST_MESSAGES.template_applied_title, {
      description: TOAST_MESSAGES.template_applied_description,
    }),
  copied: (item?: string) => {
    const msg = TOAST_MESSAGES.copied;
    return toast.success(item ? `${item} ${msg.toLowerCase()}` : msg);
  },
  linkCopied: () => toast.success(TOAST_MESSAGES.link_copied),
  codeCopied: () => toast.success(TOAST_MESSAGES.code_copied),
  screenshotCopied: () => toast.success(TOAST_MESSAGES.screenshot_copied),
  codeDownloadStarted: () => toast.success(TOAST_MESSAGES.code_download_started),
  savedToLibrary: (count: number, total?: number) =>
    toast.success(
      total
        ? `Saved ${count} of ${total} items to your library`
        : `Saved ${count} ${count === 1 ? 'item' : 'items'} to your library`
    ),
  bookmarkAdded: () => toast.success(TOAST_MESSAGES.bookmark_added),
  bookmarkRemoved: () => toast.success(TOAST_MESSAGES.bookmark_removed),
  changesSaved: () => toast.success(TOAST_MESSAGES.changes_saved),
  actionCompleted: (action: string) => toast.success(`${action} completed successfully`),
} as const;

export const errorToasts = {
  saveFailed: (customMessage?: string) => toast.error(customMessage || TOAST_MESSAGES.save_failed),
  loadFailed: (resource?: string) =>
    toast.error(resource ? `Failed to load ${resource}` : 'Failed to load data'),
  actionFailed: (action: string, customMessage?: string) =>
    toast.error(customMessage || `Failed to ${action}. Please try again.`),
  validation: (message: string) => toast.error(message),
  requiredFields: () => toast.error(TOAST_MESSAGES.required_fields),
  invalidInput: (field?: string) =>
    toast.error(field ? `Invalid ${field}` : 'Please check your input and try again'),
  authRequired: () => toast.error(TOAST_MESSAGES.auth_required),
  authFailed: (message?: string) => toast.error(message || 'Authentication failed'),
  permissionDenied: () => toast.error(TOAST_MESSAGES.permission_denied),
  submissionFailed: (details?: string) =>
    toast.error(TOAST_MESSAGES.submission_error_title, {
      description: details || TOAST_MESSAGES.submission_error_description,
    }),
  networkError: () => toast.error(TOAST_MESSAGES.network_error),
  serverError: (message?: string) => toast.error(message || TOAST_MESSAGES.server_error),
  rateLimited: () => toast.error(TOAST_MESSAGES.rate_limited),
  copyFailed: (item?: string) => toast.error(`Failed to copy${item ? ` ${item}` : ''}`),
  screenshotFailed: () => toast.error(TOAST_MESSAGES.screenshot_failed),
  downloadFailed: () => toast.error(TOAST_MESSAGES.code_download_failed),
  shareFailed: () => toast.error('Failed to share'),
  profileUpdateFailed: () => toast.error(TOAST_MESSAGES.profile_update_failed),
  profileRefreshFailed: () => toast.error('Failed to refresh profile'),
  reviewActionFailed: (action: string) => toast.error(`Failed to ${action} review`),
  voteUpdateFailed: () => toast.error(TOAST_MESSAGES.vote_update_failed),
  fromError: (error: unknown, fallback = 'An error occurred') => {
    const normalized = normalizeError(error, fallback);
    return toast.error(normalized.message);
  },
} as const;

export const infoToasts = {
  comingSoon: (feature?: string) => {
    const msg = TOAST_MESSAGES.coming_soon;
    return toast.info(feature ? `${feature} ${msg.toLowerCase()}` : msg);
  },
  featureUnavailable: (reason?: string) =>
    toast.info(reason || 'This feature is currently unavailable'),
  redirecting: (destination?: string) => {
    const msg = TOAST_MESSAGES.redirecting;
    return toast.info(destination ? `Redirecting to ${destination}...` : msg);
  },
} as const;

export const warningToasts = {
  unsavedChanges: () => toast.warning(TOAST_MESSAGES.unsaved_changes),
  slowConnection: () => toast.warning(TOAST_MESSAGES.slow_connection),
  limitReached: (limit: string) => toast.warning(`${limit} limit reached`),
} as const;

export const loadingToasts = {
  saving: () => toast.loading(TOAST_MESSAGES.saving),
  loading: (action?: string) => toast.loading(action ? `${action}...` : 'Loading...'),
  processing: () => toast.loading(TOAST_MESSAGES.processing),
} as const;

export const toasts = {
  success: successToasts,
  error: errorToasts,
  info: infoToasts,
  warning: warningToasts,
  loading: loadingToasts,
  raw: toastRaw,
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
