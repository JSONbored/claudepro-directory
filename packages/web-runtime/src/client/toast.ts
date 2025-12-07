'use client';

/**
 * Toast utilities with hardcoded defaults (client-safe)
 * No server imports, synchronous calls for client components
 *
 * Note: Toast messages use hardcoded defaults for client-side performance.
 * Server components can use toastConfigs from static-configs.ts if needed.
 *
 * Features:
 * - Pino logging integration for observability
 * - RequestId correlation for debugging
 * - Error instrumentation for error toasts
 */

import { toast } from 'sonner';
import { normalizeError } from '../errors.ts';
import { logClientInfo, logClientError, generateRequestId } from '../logging/client.ts';
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
  profileUpdated: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'profileUpdated',
      message: TOAST_MESSAGES.profile_updated,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.profile_updated);
  },
  signedOut: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'signedOut',
      message: TOAST_MESSAGES.signed_out,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.signed_out);
  },
  itemCreated: (type: string) => {
    const requestId = generateRequestId();
    const message = `${type} created successfully`;
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'itemCreated',
      message,
      type: 'success',
      itemType: type,
      requestId,
    });
    return toast.success(message);
  },
  itemUpdated: (type: string) => {
    const requestId = generateRequestId();
    const message = `${type} updated successfully`;
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'itemUpdated',
      message,
      type: 'success',
      itemType: type,
      requestId,
    });
    return toast.success(message);
  },
  itemDeleted: (type: string) => {
    const requestId = generateRequestId();
    const message = `${type} deleted successfully`;
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'itemDeleted',
      message,
      type: 'success',
      itemType: type,
      requestId,
    });
    return toast.success(message);
  },
  submissionCreated: (contentType: Database['public']['Enums']['content_category']) => {
    const requestId = generateRequestId();
    const message = TOAST_MESSAGES.submission_created_title;
    const description = TOAST_MESSAGES.submission_created_description.replace(
      '{contentType}',
      contentType
    );
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'submissionCreated',
      message,
      description,
      type: 'success',
      contentType,
      requestId,
    });
    return toast.success(message, { description });
  },
  templateApplied: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'templateApplied',
      message: TOAST_MESSAGES.template_applied_title,
      description: TOAST_MESSAGES.template_applied_description,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.template_applied_title, {
      description: TOAST_MESSAGES.template_applied_description,
    });
  },
  copied: (item?: string) => {
    const requestId = generateRequestId();
    const msg = TOAST_MESSAGES.copied;
    const message = item ? `${item} ${msg.toLowerCase()}` : msg;
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'copied',
      message,
      type: 'success',
      ...(item && { item }),
      requestId,
    });
    return toast.success(message);
  },
  linkCopied: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'linkCopied',
      message: TOAST_MESSAGES.link_copied,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.link_copied);
  },
  codeCopied: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'codeCopied',
      message: TOAST_MESSAGES.code_copied,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.code_copied);
  },
  screenshotCopied: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'screenshotCopied',
      message: TOAST_MESSAGES.screenshot_copied,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.screenshot_copied);
  },
  codeDownloadStarted: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'codeDownloadStarted',
      message: TOAST_MESSAGES.code_download_started,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.code_download_started);
  },
  savedToLibrary: (count: number, total?: number) => {
    const requestId = generateRequestId();
    const message = total
      ? `Saved ${count} of ${total} items to your library`
      : `Saved ${count} ${count === 1 ? 'item' : 'items'} to your library`;
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'savedToLibrary',
      message,
      type: 'success',
      count,
      ...(total && { total }),
      requestId,
    });
    return toast.success(message);
  },
  bookmarkAdded: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'bookmarkAdded',
      message: TOAST_MESSAGES.bookmark_added,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.bookmark_added);
  },
  bookmarkRemoved: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'bookmarkRemoved',
      message: TOAST_MESSAGES.bookmark_removed,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.bookmark_removed);
  },
  changesSaved: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'changesSaved',
      message: TOAST_MESSAGES.changes_saved,
      type: 'success',
      requestId,
    });
    return toast.success(TOAST_MESSAGES.changes_saved);
  },
  actionCompleted: (action: string) => {
    const requestId = generateRequestId();
    const message = `${action} completed successfully`;
    logClientInfo('Toast: success', 'toast.success', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'actionCompleted',
      message,
      type: 'success',
      completedAction: action,
      requestId,
    });
    return toast.success(message);
  },
} as const;

export const errorToasts = {
  saveFailed: (customMessage?: string) => {
    const requestId = generateRequestId();
    const message = customMessage || TOAST_MESSAGES.save_failed;
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'saveFailed',
      message,
      type: 'error',
      requestId,
    });
    return toast.error(message);
  },
  loadFailed: (resource?: string) => {
    const requestId = generateRequestId();
    const message = resource ? `Failed to load ${resource}` : 'Failed to load data';
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'loadFailed',
      message,
      type: 'error',
      ...(resource && { resource }),
      requestId,
    });
    return toast.error(message);
  },
  actionFailed: (action: string, customMessage?: string) => {
    const requestId = generateRequestId();
    const message = customMessage || `Failed to ${action}. Please try again.`;
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'actionFailed',
      message,
      type: 'error',
      failedAction: action,
      requestId,
    });
    return toast.error(message);
  },
  validation: (message: string) => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'validation',
      message,
      type: 'error',
      requestId,
    });
    return toast.error(message);
  },
  requiredFields: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'requiredFields',
      message: TOAST_MESSAGES.required_fields,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.required_fields);
  },
  invalidInput: (field?: string) => {
    const requestId = generateRequestId();
    const message = field ? `Invalid ${field}` : 'Please check your input and try again';
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'invalidInput',
      message,
      type: 'error',
      ...(field && { field }),
      requestId,
    });
    return toast.error(message);
  },
  authRequired: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'authRequired',
      message: TOAST_MESSAGES.auth_required,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.auth_required);
  },
  authFailed: (message?: string) => {
    const requestId = generateRequestId();
    const errorMessage = message || 'Authentication failed';
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'authFailed',
      message: errorMessage,
      type: 'error',
      requestId,
    });
    return toast.error(errorMessage);
  },
  permissionDenied: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'permissionDenied',
      message: TOAST_MESSAGES.permission_denied,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.permission_denied);
  },
  submissionFailed: (details?: string) => {
    const requestId = generateRequestId();
    const description = details || TOAST_MESSAGES.submission_error_description;
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'submissionFailed',
      message: TOAST_MESSAGES.submission_error_title,
      description,
      type: 'error',
      ...(details && { details }),
      requestId,
    });
    return toast.error(TOAST_MESSAGES.submission_error_title, { description });
  },
  networkError: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'networkError',
      message: TOAST_MESSAGES.network_error,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.network_error);
  },
  serverError: (message?: string) => {
    const requestId = generateRequestId();
    const errorMessage = message || TOAST_MESSAGES.server_error;
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'serverError',
      message: errorMessage,
      type: 'error',
      requestId,
    });
    return toast.error(errorMessage);
  },
  rateLimited: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'rateLimited',
      message: TOAST_MESSAGES.rate_limited,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.rate_limited);
  },
  copyFailed: (item?: string) => {
    const requestId = generateRequestId();
    const message = `Failed to copy${item ? ` ${item}` : ''}`;
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'copyFailed',
      message,
      type: 'error',
      ...(item && { item }),
      requestId,
    });
    return toast.error(message);
  },
  screenshotFailed: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'screenshotFailed',
      message: TOAST_MESSAGES.screenshot_failed,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.screenshot_failed);
  },
  downloadFailed: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'downloadFailed',
      message: TOAST_MESSAGES.code_download_failed,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.code_download_failed);
  },
  shareFailed: () => {
    const requestId = generateRequestId();
    const message = 'Failed to share';
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'shareFailed',
      message,
      type: 'error',
      requestId,
    });
    return toast.error(message);
  },
  profileUpdateFailed: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'profileUpdateFailed',
      message: TOAST_MESSAGES.profile_update_failed,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.profile_update_failed);
  },
  profileRefreshFailed: () => {
    const requestId = generateRequestId();
    const message = 'Failed to refresh profile';
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'profileRefreshFailed',
      message,
      type: 'error',
      requestId,
    });
    return toast.error(message);
  },
  reviewActionFailed: (action: string) => {
    const requestId = generateRequestId();
    const message = `Failed to ${action} review`;
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'reviewActionFailed',
      message,
      type: 'error',
      failedAction: action,
      requestId,
    });
    return toast.error(message);
  },
  voteUpdateFailed: () => {
    const requestId = generateRequestId();
    logClientError('Toast: error', undefined, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'voteUpdateFailed',
      message: TOAST_MESSAGES.vote_update_failed,
      type: 'error',
      requestId,
    });
    return toast.error(TOAST_MESSAGES.vote_update_failed);
  },
  fromError: (error: unknown, fallback = 'An error occurred') => {
    const requestId = generateRequestId();
    const normalized = normalizeError(error, fallback);
    logClientError('Toast: error', error, 'toast.error', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'fromError',
      message: normalized.message,
      type: 'error',
      requestId,
    });
    return toast.error(normalized.message);
  },
} as const;

export const infoToasts = {
  comingSoon: (feature?: string) => {
    const requestId = generateRequestId();
    const msg = TOAST_MESSAGES.coming_soon;
    const message = feature ? `${feature} ${msg.toLowerCase()}` : msg;
    logClientInfo('Toast: info', 'toast.info', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'comingSoon',
      message,
      type: 'info',
      ...(feature && { feature }),
      requestId,
    });
    return toast.info(message);
  },
  featureUnavailable: (reason?: string) => {
    const requestId = generateRequestId();
    const message = reason || 'This feature is currently unavailable';
    logClientInfo('Toast: info', 'toast.info', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'featureUnavailable',
      message,
      type: 'info',
      ...(reason && { reason }),
      requestId,
    });
    return toast.info(message);
  },
  redirecting: (destination?: string) => {
    const requestId = generateRequestId();
    const msg = TOAST_MESSAGES.redirecting;
    const message = destination ? `Redirecting to ${destination}...` : msg;
    logClientInfo('Toast: info', 'toast.info', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'redirecting',
      message,
      type: 'info',
      ...(destination && { destination }),
      requestId,
    });
    return toast.info(message);
  },
} as const;

export const warningToasts = {
  unsavedChanges: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: warning', 'toast.warning', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'unsavedChanges',
      message: TOAST_MESSAGES.unsaved_changes,
      type: 'warning',
      requestId,
    });
    return toast.warning(TOAST_MESSAGES.unsaved_changes);
  },
  slowConnection: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: warning', 'toast.warning', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'slowConnection',
      message: TOAST_MESSAGES.slow_connection,
      type: 'warning',
      requestId,
    });
    return toast.warning(TOAST_MESSAGES.slow_connection);
  },
  limitReached: (limit: string) => {
    const requestId = generateRequestId();
    const message = `${limit} limit reached`;
    logClientInfo('Toast: warning', 'toast.warning', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'limitReached',
      message,
      type: 'warning',
      limit,
      requestId,
    });
    return toast.warning(message);
  },
} as const;

export const loadingToasts = {
  saving: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: loading', 'toast.loading', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'saving',
      message: TOAST_MESSAGES.saving,
      type: 'loading',
      requestId,
    });
    return toast.loading(TOAST_MESSAGES.saving);
  },
  loading: (action?: string) => {
    const requestId = generateRequestId();
    const message = action ? `${action}...` : 'Loading...';
    logClientInfo('Toast: loading', 'toast.loading', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'loading',
      message,
      type: 'loading',
      ...(action && { loadingAction: action }),
      requestId,
    });
    return toast.loading(message);
  },
  processing: () => {
    const requestId = generateRequestId();
    logClientInfo('Toast: loading', 'toast.loading', {
      component: 'toasts',
      module: 'packages/web-runtime/src/client/toast',
      action: 'processing',
      message: TOAST_MESSAGES.processing,
      type: 'loading',
      requestId,
    });
    return toast.loading(TOAST_MESSAGES.processing);
  },
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
