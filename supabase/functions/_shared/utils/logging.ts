/**
 * Standardized logging context builders for edge functions
 * Ensures consistent log structure across all functions
 */

export interface BaseLogContext {
  function: string;
  action?: string;
  request_id?: string;
  started_at: string;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Create logContext for email-handler functions
 */
export function createEmailHandlerContext(
  action: string,
  options?: { email?: string; requestId?: string; subscriptionId?: string }
): BaseLogContext {
  return {
    function: 'email-handler',
    action,
    request_id: options?.requestId ?? crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.email && { email: options.email }),
    ...(options?.subscriptionId && { subscription_id: options.subscriptionId }),
  };
}

/**
 * Create logContext for data-api routes
 */
export function createDataApiContext(
  route: string,
  options?: { path?: string; method?: string; resource?: string }
): BaseLogContext {
  return {
    function: 'data-api',
    action: route,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.path && { path: options.path }),
    ...(options?.method && { method: options.method }),
    ...(options?.resource && { resource: options.resource }),
  };
}

/**
 * Create logContext for unified-search
 */
export function createSearchContext(options?: {
  query?: string;
  searchType?: string;
  filters?: Record<string, unknown>;
}): BaseLogContext {
  return {
    function: 'unified-search',
    action: options?.searchType ?? 'search',
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.query && { query: options.query }),
    ...(options?.filters && { filters: options.filters }),
  };
}

/**
 * Create logContext for edge functions (legacy name - used by flux-station and other functions)
 */
export function createNotificationRouterContext(
  action: string,
  options?: {
    jobId?: string;
    entryId?: string;
    slug?: string;
    attempt?: number;
    userId?: string;
    source?: string;
  }
): BaseLogContext {
  return {
    function: 'flux-station',
    action,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.jobId && { job_id: options.jobId }),
    ...(options?.entryId && { entry_id: options.entryId }),
    ...(options?.slug && { slug: options.slug }),
    ...(options?.attempt !== undefined && { attempt: options.attempt }),
    ...(options?.userId && { user_id: options.userId }),
    ...(options?.source && { source: options.source }),
  };
}

/**
 * Create logContext for changelog handler
 */
export function createChangelogHandlerContext(options?: {
  deploymentId?: string;
  branch?: string;
  changelogId?: string;
  slug?: string;
}): BaseLogContext {
  return {
    function: 'changelog-handler',
    action: 'sync',
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.deploymentId && { deployment_id: options.deploymentId }),
    ...(options?.branch && { branch: options.branch }),
    ...(options?.changelogId && { changelog_id: options.changelogId }),
    ...(options?.slug && { slug: options.slug }),
  };
}

/**
 * Create logContext for discord handler
 */
export function createDiscordHandlerContext(
  notificationType: string,
  options?: {
    contentId?: string;
    jobId?: string;
    changelogId?: string;
    category?: string;
    slug?: string;
  }
): BaseLogContext {
  return {
    function: 'discord-handler',
    action: notificationType,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.contentId && { content_id: options.contentId }),
    ...(options?.jobId && { job_id: options.jobId }),
    ...(options?.changelogId && { changelog_id: options.changelogId }),
    ...(options?.category && { category: options.category }),
    ...(options?.slug && { slug: options.slug }),
  };
}

/**
 * Create logContext for notifications service
 */
export function createNotificationsServiceContext(
  action: string,
  options?: { notificationId?: string; userId?: string }
): BaseLogContext {
  return {
    function: 'notifications-service',
    action,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.notificationId && { notification_id: options.notificationId }),
    ...(options?.userId && { user_id: options.userId }),
  };
}

/**
 * Helper to merge context with additional fields
 */
export function withContext(
  base: BaseLogContext,
  additional: Record<string, unknown>
): BaseLogContext {
  return {
    ...base,
    ...additional,
  };
}

/**
 * Helper to add duration to logContext
 */
export function withDuration(base: BaseLogContext, startTime: number): BaseLogContext {
  return {
    ...base,
    duration_ms: Date.now() - startTime,
  };
}

/**
 * Create logContext for shared utility functions
 * Use this for generic utilities that don't belong to a specific function
 */
export function createUtilityContext(
  utilityName: string,
  action: string,
  options?: Record<string, unknown>
): BaseLogContext {
  return {
    function: 'shared-utils',
    action: `${utilityName}.${action}`,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    utility: utilityName,
    ...options,
  };
}

/**
 * Create logContext for transform-api routes
 */
export function createTransformApiContext(
  route: string,
  options?: { path?: string; method?: string }
): BaseLogContext {
  return {
    function: 'transform-api',
    action: route,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.path && { path: options.path }),
    ...(options?.method && { method: options.method }),
  };
}

/**
 * Logging functions - use these instead of console.log/error/warn directly
 * All logging should use logContext for consistent structured logging
 */

/**
 * Log an info-level message
 */
export function logInfo(message: string, logContext: BaseLogContext): void {
  console.log(`[${logContext.function}] ${message}`, {
    ...logContext,
  });
}

/**
 * Log an error-level message
 */
export function logError(message: string, logContext: BaseLogContext, error?: unknown): void {
  const errorData: Record<string, unknown> = {
    ...logContext,
  };

  if (error) {
    errorData.error = error instanceof Error ? error.message : String(error);
  }

  console.error(`[${logContext.function}] ${message}`, errorData);
}

/**
 * Log a warning-level message
 */
export function logWarn(message: string, logContext: BaseLogContext): void {
  console.warn(`[${logContext.function}] ${message}`, {
    ...logContext,
  });
}
