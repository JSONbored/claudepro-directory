/**
 * Unified Cached Data Function Factory
 *
 * Eliminates repetitive boilerplate across 96+ wrapper functions by providing
 * a declarative factory that automatically handles:
 * - Cache directives ('use cache' or 'use cache: private')
 * - Cache life profiles
 * - Cache tags
 * - Logging
 * - Error handling
 * - Service instantiation
 * - Result transformation
 *
 * This factory reduces ~5,000+ LOC of boilerplate to declarative configuration.
 */

import type { ServiceKey } from './service-factory.ts';
import { getService } from './service-factory.ts';
import { logger, type LogContext } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * Cache life profile type
 */
export type CacheLifeProfile =
  | 'short'
  | 'medium'
  | 'long'
  | 'userProfile'
  | { stale: number; revalidate: number; expire: number };

/**
 * Cache mode: 'public' uses 'use cache', 'private' uses 'use cache: private'
 */
export type CacheMode = 'public' | 'private';

/**
 * Configuration for creating a cached data function
 */
export interface CachedDataFunctionConfig<TArgs, TReturn> {
  /**
   * Service key from service factory registry
   */
  serviceKey: ServiceKey;

  /**
   * Method name on the service to call
   */
  methodName: string;

  /**
   * Cache mode: 'public' for shared cache, 'private' for user-specific cache
   */
  cacheMode?: CacheMode;

  /**
   * Cache life profile or custom values
   */
  cacheLife: CacheLifeProfile;

  /**
   * Generate cache tags from arguments
   */
  cacheTags: (args: TArgs) => string[];

  /**
   * Module name for logging (e.g., 'data/content/detail')
   */
  module: string;

  /**
   * Operation name for logging (e.g., 'getContentDetailCore')
   */
  operation: string;

  /**
   * Optional validation function - returns false if args are invalid
   */
  validate?: (args: TArgs) => boolean;

  /**
   * Optional validation error message
   */
  validateError?: string;

  /**
   * Transform service method arguments to RPC args format
   * If not provided, args are passed directly to service method
   */
  transformArgs?: (args: TArgs) => unknown;

  /**
   * Transform service result before returning
   * If not provided, result is returned as-is
   * Second parameter (args) is optional and provides access to original arguments
   */
  transformResult?: (result: unknown, args?: TArgs) => TReturn;

  /**
   * Normalize result (e.g., extract first item from array, handle null)
   * If not provided, result is returned as-is
   */
  normalizeResult?: (result: unknown) => TReturn | null;

  /**
   * Custom error handler - if provided, overrides default error handling
   */
  onError?: (error: unknown, args: TArgs) => TReturn | null;

  /**
   * Whether to throw errors or return null (default: return null)
   */
  throwOnError?: boolean;

  /**
   * Additional logging context to include
   * Receives both args and result for comprehensive logging
   */
  logContext?: (args: TArgs, result?: unknown) => LogContext;
}

/**
 * Create a cached data function with automatic cache/logging/error handling
 *
 * @example
 * ```typescript
 * export const getContentDetailCore = createCachedDataFunction({
 *   serviceKey: 'content',
 *   methodName: 'getContentDetailCore',
 *   cacheMode: 'public',
 *   cacheLife: 'medium',
 *   cacheTags: (args) => generateContentTags(args.category, args.slug),
 *   module: 'data/content/detail',
 *   operation: 'getContentDetailCore',
 *   validate: (args) => isValidCategory(args.category),
 *   validateError: 'Invalid category',
 *   transformArgs: (args) => ({
 *     p_category: args.category,
 *     p_slug: args.slug,
 *   }),
 * });
 * ```
 */
export function createCachedDataFunction<TArgs, TReturn>(
  config: CachedDataFunctionConfig<TArgs, TReturn>
): (args: TArgs) => Promise<TReturn | null> {
  const {
    serviceKey,
    methodName,
    cacheMode = 'public',
    cacheLife: cacheLifeProfile,
    cacheTags,
    module,
    operation,
    validate,
    validateError,
    transformArgs,
    transformResult,
    normalizeResult,
    onError,
    throwOnError = false,
    logContext,
  } = config;

  return async (args: TArgs): Promise<TReturn | null> => {
    // Apply cache directive
    if (cacheMode === 'private') {
      'use cache: private';
    } else {
      'use cache';
    }

    // Apply cache life profile
    if (typeof cacheLifeProfile === 'string') {
      cacheLife(cacheLifeProfile);
    } else {
      cacheLife(cacheLifeProfile);
    }

    // Apply cache tags
    const tags = cacheTags(args);
    for (const tag of tags) {
      cacheTag(tag);
    }

    // Validate arguments if validator provided
    if (validate && !validate(args)) {
      const reqLogger = logger.child({
        module,
        operation,
      });
      const normalized = normalizeError(
        validateError || 'Validation failed',
        `${operation}: validation failed`
      );
      reqLogger.error({ err: normalized }, `${operation}: validation failed`);
      return null;
    }

    // Setup logger (initial context from args only)
    const initialContext = logContext ? logContext(args) : {};
    const reqLogger = logger.child({
      module,
      operation,
      ...initialContext,
    });

    try {
      // Get service instance
      const service = await getService(serviceKey);

      // Transform arguments if transformer provided
      const serviceArgs = transformArgs ? transformArgs(args) : args;

      // Call service method
      const serviceRecord = service as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
      const serviceMethod = serviceRecord[methodName];

      if (!serviceMethod || typeof serviceMethod !== 'function') {
        throw new Error(
          `Method '${methodName}' not found on service '${serviceKey}'. ` +
            `Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(service))
              .filter((m) => m !== 'constructor')
              .join(', ')}`
        );
      }

      const result = await serviceMethod.call(service, serviceArgs);

      // Transform result if transformer provided
      let transformedResult: TReturn | null = result as TReturn;
      if (transformResult) {
        transformedResult = transformResult(result, args);
      } else if (normalizeResult) {
        transformedResult = normalizeResult(result);
      }

      // Log success
      const logData: LogContext = {
        hasResult: transformedResult !== null && transformedResult !== undefined,
      };
      if (logContext) {
        Object.assign(logData, logContext(args, transformedResult));
      }
      reqLogger.info(logData, `${operation}: fetched successfully`);

      return transformedResult;
    } catch (error) {
      // Custom error handler
      if (onError) {
        return onError(error, args);
      }

      // Default error handling
      const normalized = normalizeError(error, `${operation} failed`);
      const errorLogData: LogContext = { err: normalized };
      reqLogger.error(errorLogData, `${operation} failed`);

      if (throwOnError) {
        throw normalized;
      }

      return null;
    }
  };
}

/**
 * Helper to create cache tags for content
 */
export function generateContentTags(
  category?: string | null,
  slug?: string | null,
  additionalTags: string[] = []
): string[] {
  const tags: string[] = ['content', ...additionalTags];
  if (category) {
    tags.push(`content-${category}`);
    if (slug) {
      tags.push(`content-${category}-${slug}`);
    }
  } else {
    tags.push('content-all');
  }
  return tags;
}

/**
 * Helper to create cache tags for any resource type
 */
export function generateResourceTags(
  resourceType: string,
  resourceId?: string | null,
  additionalTags: string[] = []
): string[] {
  const tags: string[] = [resourceType, ...additionalTags];
  if (resourceId) {
    tags.push(`${resourceType}-${resourceId}`);
  }
  return tags;
}
