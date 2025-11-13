/** Toast utilities consuming Statsig toastConfigs */

import { toast } from 'sonner';
import { toastConfigs } from '@/src/lib/flags';

/** Load toast config once and cache */
let configCache: Record<string, string> | null = null;

async function getConfig(): Promise<Record<string, string>> {
  if (!configCache) {
    try {
      configCache = (await toastConfigs()) as Record<string, string>;
    } catch {
      configCache = {}; // Empty fallback, let Statsig defaults handle it
    }
  }
  return configCache;
}

export const successToasts = {
  profileUpdated: async () => {
    const config = await getConfig();
    return toast.success(config['toast.profile_updated']);
  },
  signedOut: async () => {
    const config = await getConfig();
    return toast.success(config['toast.signed_out']);
  },
  itemCreated: async (type: string) => toast.success(`${type} created successfully`),
  itemUpdated: async (type: string) => toast.success(`${type} updated successfully`),
  itemDeleted: async (type: string) => toast.success(`${type} deleted successfully`),
  submissionCreated: async (contentType: string) => {
    const config = await getConfig();
    return toast.success(config['toast.submission_created_title'], {
      description:
        config['toast.submission_created_description']?.replace('{contentType}', contentType) ||
        `Your ${contentType} has been submitted for review.`,
    });
  },
  templateApplied: async () => {
    const config = await getConfig();
    return toast.success(config['toast.template_applied_title'], {
      description: config['toast.template_applied_description'],
    });
  },
  copied: async (item?: string) => {
    const config = await getConfig();
    const msg = config['toast.copied'] || 'Copied to clipboard!';
    return toast.success(item ? `${item} ${msg.toLowerCase()}` : msg);
  },
  linkCopied: async () => {
    const config = await getConfig();
    return toast.success(config['toast.link_copied']);
  },
  codeCopied: async () => {
    const config = await getConfig();
    return toast.success(config['toast.code_copied']);
  },
  screenshotCopied: async () => {
    const config = await getConfig();
    return toast.success(config['toast.screenshot_copied']);
  },
  savedToLibrary: async (count: number, total?: number) =>
    toast.success(
      total
        ? `Saved ${count} of ${total} items to your library`
        : `Saved ${count} ${count === 1 ? 'item' : 'items'} to your library`
    ),
  bookmarkAdded: async () => {
    const config = await getConfig();
    return toast.success(config['toast.bookmark_added']);
  },
  bookmarkRemoved: async () => {
    const config = await getConfig();
    return toast.success(config['toast.bookmark_removed']);
  },
  changesSaved: async () => {
    const config = await getConfig();
    return toast.success(config['toast.changes_saved']);
  },
  actionCompleted: async (action: string) => toast.success(`${action} completed successfully`),
} as const;

export const errorToasts = {
  saveFailed: async (customMessage?: string) => {
    if (customMessage) return toast.error(customMessage);
    const config = await getConfig();
    return toast.error(config['toast.save_failed']);
  },
  loadFailed: async (resource?: string) =>
    toast.error(resource ? `Failed to load ${resource}` : 'Failed to load data'),
  actionFailed: async (action: string, customMessage?: string) =>
    toast.error(customMessage || `Failed to ${action}. Please try again.`),
  validation: async (message: string) => toast.error(message),
  requiredFields: async () => {
    const config = await getConfig();
    return toast.error(config['toast.required_fields']);
  },
  invalidInput: async (field?: string) =>
    toast.error(field ? `Invalid ${field}` : 'Please check your input and try again'),
  authRequired: async () => {
    const config = await getConfig();
    return toast.error(config['toast.auth_required']);
  },
  authFailed: async (message?: string) => toast.error(message || 'Authentication failed'),
  permissionDenied: async () => {
    const config = await getConfig();
    return toast.error(config['toast.permission_denied']);
  },
  submissionFailed: async (details?: string) => {
    const config = await getConfig();
    return toast.error(config['toast.submission_error_title'], {
      description: details || config['toast.submission_error_description'],
    });
  },
  networkError: async () => {
    const config = await getConfig();
    return toast.error(config['toast.network_error']);
  },
  serverError: async (message?: string) => {
    if (message) return toast.error(message);
    const config = await getConfig();
    return toast.error(config['toast.server_error']);
  },
  rateLimited: async () => {
    const config = await getConfig();
    return toast.error(config['toast.rate_limited']);
  },
  copyFailed: async (item?: string) => toast.error(`Failed to copy${item ? ` ${item}` : ''}`),
  screenshotFailed: async () => {
    const config = await getConfig();
    return toast.error(config['toast.screenshot_failed']);
  },
  shareFailed: async () => toast.error('Failed to share'),
  profileUpdateFailed: async () => {
    const config = await getConfig();
    return toast.error(config['toast.profile_update_failed']);
  },
  profileRefreshFailed: async () => toast.error('Failed to refresh profile'),
  reviewActionFailed: async (action: string) => toast.error(`Failed to ${action} review`),
  voteUpdateFailed: async () => {
    const config = await getConfig();
    return toast.error(config['toast.vote_update_failed']);
  },
  fromError: (error: unknown, fallback = 'An error occurred') =>
    toast.error(error instanceof Error ? error.message : fallback),
} as const;

export const infoToasts = {
  comingSoon: async (feature?: string) => {
    const config = await getConfig();
    const msg = config['toast.coming_soon'] || 'Coming soon!';
    return toast.info(feature ? `${feature} ${msg.toLowerCase()}` : msg);
  },
  featureUnavailable: async (reason?: string) =>
    toast.info(reason || 'This feature is currently unavailable'),
  redirecting: async (destination?: string) => {
    const config = await getConfig();
    const msg = config['toast.redirecting'];
    return toast.info(destination ? `Redirecting to ${destination}...` : msg);
  },
} as const;

export const warningToasts = {
  unsavedChanges: async () => {
    const config = await getConfig();
    return toast.warning(config['toast.unsaved_changes']);
  },
  slowConnection: async () => {
    const config = await getConfig();
    return toast.warning(config['toast.slow_connection']);
  },
  limitReached: async (limit: string) => toast.warning(`${limit} limit reached`),
} as const;

export const loadingToasts = {
  saving: async () => {
    const config = await getConfig();
    return toast.loading(config['toast.saving']);
  },
  loading: async (action?: string) => toast.loading(action ? `${action}...` : 'Loading...'),
  processing: async () => {
    const config = await getConfig();
    return toast.loading(config['toast.processing']);
  },
} as const;

export const toasts = {
  success: successToasts,
  error: errorToasts,
  info: infoToasts,
  warning: warningToasts,
  loading: loadingToasts,
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
