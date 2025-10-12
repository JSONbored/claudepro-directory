/**
 * Standardized Toast Notification Helpers
 *
 * Provides consistent, type-safe toast notifications across the application.
 * Eliminates duplication of toast messages and ensures UX consistency.
 *
 * **Architecture:**
 * - Centralizes common toast patterns found across 27+ files
 * - Type-safe message definitions prevent typos
 * - Consistent messaging improves user experience
 * - Easier to update messages globally
 *
 * **Usage Statistics (before consolidation):**
 * - Success messages: 40+ instances
 * - Error messages: 50+ instances
 * - Action toasts (with buttons): 10+ instances
 *
 * @module lib/utils/toast-helpers
 */

import { type ExternalToast, toast } from 'sonner';

/**
 * Common success messages
 */
export const ToastMessages = {
  // Copy/Clipboard actions
  COPY_SUCCESS: 'Copied!',
  COPY_LINK_SUCCESS: 'Link copied!',
  COPY_ERROR: 'Failed to copy',

  // Bookmark actions
  BOOKMARK_ADDED: 'Bookmarked!',
  BOOKMARK_REMOVED: 'Bookmark removed',
  BOOKMARK_ERROR: 'Failed to update bookmark',

  // Collection actions
  COLLECTION_CREATED: 'Collection created successfully!',
  COLLECTION_UPDATED: 'Collection updated successfully!',
  COLLECTION_ERROR: 'Failed to save collection',
  COLLECTION_ITEM_ADDED: 'Item added to collection',
  COLLECTION_ITEM_REMOVED: 'Item removed from collection',
  COLLECTION_REORDERED: 'Items reordered',

  // Review actions
  REVIEW_SUBMITTED: 'Review submitted successfully',
  REVIEW_UPDATED: 'Review updated successfully',
  REVIEW_DELETED: 'Review deleted',
  REVIEW_VOTE_SUCCESS: 'Marked as helpful',
  REVIEW_VOTE_REMOVED: 'Vote removed',
  REVIEW_ERROR: 'Failed to submit review',
  REVIEW_DUPLICATE: 'You have already reviewed this content',

  // Auth actions
  SIGN_OUT_SUCCESS: 'Signed out successfully',
  SIGN_OUT_ERROR: 'Sign out failed',
  SIGN_IN_ERROR: 'Sign in failed',
  AUTH_REQUIRED: 'Please sign in to continue',

  // Profile actions
  PROFILE_UPDATED: 'Profile updated successfully',
  PROFILE_ERROR: 'Failed to update profile',

  // Newsletter actions
  NEWSLETTER_SUBSCRIBED: "Welcome! You're now subscribed to our newsletter.",
  NEWSLETTER_ERROR: 'Subscription failed',

  // Form validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  FORM_ERROR: 'Please check your input and try again',

  // Job actions
  JOB_CREATED: 'Job posted successfully!',
  JOB_UPDATED: 'Job updated successfully',
  JOB_DELETED: 'Job deleted successfully',
  JOB_ERROR: 'Failed to save job',

  // Submission actions
  SUBMISSION_CREATED: 'Submission Created!',
  SUBMISSION_ERROR: 'Submission Error',
  TEMPLATE_APPLIED: 'Template Applied!',

  // Generic messages
  SUCCESS: 'Success!',
  ERROR: 'An error occurred',
  LOADING: 'Loading...',
  SAVE_SUCCESS: 'Saved successfully',
  SAVE_ERROR: 'Failed to save',
  DELETE_SUCCESS: 'Deleted successfully',
  DELETE_ERROR: 'Failed to delete',
  UPDATE_SUCCESS: 'Updated successfully',
  UPDATE_ERROR: 'Failed to update',
} as const;

/**
 * Toast helper for successful copy operations
 */
export function showCopySuccess(customMessage?: string, options?: ExternalToast) {
  toast.success(customMessage || ToastMessages.COPY_LINK_SUCCESS, {
    description: 'The link has been copied to your clipboard.',
    ...options,
  });
}

/**
 * Toast helper for failed copy operations
 */
export function showCopyError(customMessage?: string, options?: ExternalToast) {
  toast.error(customMessage || ToastMessages.COPY_ERROR, {
    description: 'Could not copy the link to clipboard.',
    ...options,
  });
}

/**
 * Toast helper for bookmark actions
 */
export function showBookmarkSuccess(isAdded: boolean, options?: ExternalToast) {
  toast.success(isAdded ? ToastMessages.BOOKMARK_ADDED : ToastMessages.BOOKMARK_REMOVED, options);
}

/**
 * Toast helper for bookmark errors
 */
export function showBookmarkError(error?: Error | string, options?: ExternalToast) {
  const message =
    typeof error === 'string' ? error : error?.message || ToastMessages.BOOKMARK_ERROR;
  toast.error(message, options);
}

/**
 * Toast helper for auth required (with sign-in action)
 */
export function showAuthRequiredToast(
  message: string,
  redirectPath?: string,
  options?: ExternalToast
) {
  toast.error(message, {
    action: {
      label: 'Sign In',
      onClick: () => {
        window.location.href = redirectPath
          ? `/login?redirect=${redirectPath}`
          : `/login?redirect=${window.location.pathname}`;
      },
    },
    ...options,
  });
}

/**
 * Toast helper for review actions
 */
export function showReviewSuccess(action: 'submit' | 'update' | 'delete', options?: ExternalToast) {
  const messages = {
    submit: ToastMessages.REVIEW_SUBMITTED,
    update: ToastMessages.REVIEW_UPDATED,
    delete: ToastMessages.REVIEW_DELETED,
  };
  toast.success(messages[action], options);
}

/**
 * Toast helper for review errors
 */
export function showReviewError(error?: Error | string, options?: ExternalToast) {
  const message = typeof error === 'string' ? error : error?.message || ToastMessages.REVIEW_ERROR;
  toast.error(message, options);
}

/**
 * Toast helper for review vote actions
 */
export function showReviewVoteSuccess(hasVoted: boolean, options?: ExternalToast) {
  toast.success(
    hasVoted ? ToastMessages.REVIEW_VOTE_REMOVED : ToastMessages.REVIEW_VOTE_SUCCESS,
    options
  );
}

/**
 * Toast helper for collection actions
 */
export function showCollectionSuccess(
  action: 'create' | 'update' | 'addItem' | 'removeItem' | 'reorder',
  options?: ExternalToast
) {
  const messages = {
    create: ToastMessages.COLLECTION_CREATED,
    update: ToastMessages.COLLECTION_UPDATED,
    addItem: ToastMessages.COLLECTION_ITEM_ADDED,
    removeItem: ToastMessages.COLLECTION_ITEM_REMOVED,
    reorder: ToastMessages.COLLECTION_REORDERED,
  };
  toast.success(messages[action], options);
}

/**
 * Toast helper for collection errors
 */
export function showCollectionError(error?: Error | string, options?: ExternalToast) {
  const message =
    typeof error === 'string' ? error : error?.message || ToastMessages.COLLECTION_ERROR;
  toast.error(message, options);
}

/**
 * Toast helper for profile actions
 */
export function showProfileSuccess(options?: ExternalToast) {
  toast.success(ToastMessages.PROFILE_UPDATED, options);
}

/**
 * Toast helper for profile errors
 */
export function showProfileError(error?: Error | string, options?: ExternalToast) {
  const message = typeof error === 'string' ? error : error?.message || ToastMessages.PROFILE_ERROR;
  toast.error(message, options);
}

/**
 * Toast helper for sign out actions
 */
export function showSignOutSuccess(options?: ExternalToast) {
  toast.success(ToastMessages.SIGN_OUT_SUCCESS, options);
}

/**
 * Toast helper for sign out errors
 */
export function showSignOutError(error?: Error | string, options?: ExternalToast) {
  const message =
    typeof error === 'string' ? error : error?.message || ToastMessages.SIGN_OUT_ERROR;
  toast.error(message, options);
}

/**
 * Toast helper for sign in errors
 */
export function showSignInError(error?: Error | string, options?: ExternalToast) {
  const message = typeof error === 'string' ? error : error?.message || ToastMessages.SIGN_IN_ERROR;
  toast.error(`${ToastMessages.SIGN_IN_ERROR}: ${message}`, options);
}

/**
 * Toast helper for newsletter subscription
 */
export function showNewsletterSuccess(customMessage?: string, options?: ExternalToast) {
  toast.success(customMessage || ToastMessages.NEWSLETTER_SUBSCRIBED, options);
}

/**
 * Toast helper for newsletter errors
 */
export function showNewsletterError(error?: Error | string, options?: ExternalToast) {
  const errorMessage = typeof error === 'string' ? error : error?.message;
  toast.error(ToastMessages.NEWSLETTER_ERROR, {
    description: errorMessage,
    ...options,
  });
}

/**
 * Toast helper for job actions
 */
export function showJobSuccess(action: 'create' | 'update' | 'delete', options?: ExternalToast) {
  const messages = {
    create: ToastMessages.JOB_CREATED,
    update: ToastMessages.JOB_UPDATED,
    delete: ToastMessages.JOB_DELETED,
  };
  toast.success(messages[action], options);
}

/**
 * Toast helper for job errors
 */
export function showJobError(error?: Error | string, options?: ExternalToast) {
  const message = typeof error === 'string' ? error : error?.message || ToastMessages.JOB_ERROR;
  toast.error(message, options);
}

/**
 * Toast helper for submission actions
 */
export function showSubmissionSuccess(action: 'create' | 'template', options?: ExternalToast) {
  const messages = {
    create: ToastMessages.SUBMISSION_CREATED,
    template: ToastMessages.TEMPLATE_APPLIED,
  };
  toast.success(messages[action], options);
}

/**
 * Toast helper for submission errors
 */
export function showSubmissionError(error?: Error | string, options?: ExternalToast) {
  const errorMessage = typeof error === 'string' ? error : error?.message;
  toast.error(ToastMessages.SUBMISSION_ERROR, {
    description: errorMessage,
    ...options,
  });
}

/**
 * Generic toast helpers for common scenarios
 */
export const toastHelpers = {
  success: (message: string, options?: ExternalToast) => toast.success(message, options),
  error: (message: string, options?: ExternalToast) => toast.error(message, options),
  info: (message: string, options?: ExternalToast) => toast.info(message, options),
  warning: (message: string, options?: ExternalToast) => toast.warning(message, options),
  loading: (message: string, options?: ExternalToast) => toast.loading(message, options),
  promise: toast.promise,
} as const;

/**
 * Type-safe toast action helper
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Create a toast with an action button
 */
export function showToastWithAction(
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  action: ToastAction,
  options?: ExternalToast
) {
  const toastFn = toast[type];
  toastFn(message, {
    action,
    ...options,
  });
}
