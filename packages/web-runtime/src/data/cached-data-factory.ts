/**
 * Unified Data Function Factory
 *
 * Eliminates repetitive boilerplate across 96+ wrapper functions by providing
 * a declarative factory that automatically handles:
 * - Logging
 * - Error handling
 * - Service instantiation
 * - Result transformation
 *
 * This factory reduces ~5,000+ LOC of boilerplate to declarative configuration.
 *
 * ARCHITECTURAL DECISION: No caching in data layer
 * - Pages control caching with 'use cache' directive
 * - Data functions are simple async functions (no 'use cache')
 * - Pages apply cacheTag() and cacheLife() within their 'use cache' context
 * - This prevents serialization errors and simplifies the architecture
 *
 * NOTE: This file uses 'server-only' (not 'use server') because:
 * - These are server-only data fetching functions
 * - 'server-only' ensures these functions are never imported in client components
 * - Helper functions (generateContentTags, generateResourceTags) are in content-helpers.ts
 */

import 'server-only';

import { normalizeError } from '../errors.ts';
import { type LogContext, logger } from '../logger.ts';

import { type ServiceKey } from './service-factory.ts';
import { getService } from './service-factory.ts';

/**
 * Map to store function configurations for data functions
 * Uses string key to avoid closure capture and ensure stable references
 * This prevents "Functions cannot be passed directly to Client Components" errors.
 */
const dataFunctionConfigs = new Map<
  string,
  {
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }
>();

/****************
*
 * Shared implementation function (extracted to module level to avoid closure capture)
 * This function is called by data functions via Map lookup, not closure capture
 * 
 * NOTE: This function only handles data fetching, logging, and error handling.
 * Caching is handled at the page level with 'use cache' directive.
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.serviceKey
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.methodName
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.module
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.operation
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.validate
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.validateError
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.transformArgs
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.transformResult
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.normalizeResult
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.onError
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.throwOnError
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig.logContext
 * @param {unknown} args
 * @returns {Promise<unknown>} Return value description
  * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
 * @param {{
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  }} fnConfig Parameter description
*/
async function executeDataFunction(
  fnConfig: {
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  },
  args: unknown
): Promise<null | unknown> {
  // Validate arguments if validator provided
  if (fnConfig.validate && !fnConfig.validate(args)) {
    const reqLogger = logger.child({
      module: fnConfig.module,
      operation: fnConfig.operation,
    });
    const normalized = normalizeError(
      fnConfig.validateError || 'Validation failed',
      `${fnConfig.operation}: validation failed`
    );
    reqLogger.error({ err: normalized }, `${fnConfig.operation}: validation failed`);
    return null;
  }

  // Setup logger (initial context from args only)
  const initialContext = fnConfig.logContext ? fnConfig.logContext(args) : {};
  const reqLogger = logger.child({
    module: fnConfig.module,
    operation: fnConfig.operation,
    ...initialContext,
  });

  try {
    // Get service instance
    const service = await getService(fnConfig.serviceKey);

    // Transform arguments if transformer provided
    const serviceArgs = fnConfig.transformArgs ? fnConfig.transformArgs(args) : args;

    // Dynamic method access on service instances
    // Services are stored in a Map<ServiceKey, ServiceTypeMap[ServiceKey]> where ServiceTypeMap
    // is a union of all service types. TypeScript can't verify that a specific service has a
    // specific method name at compile time, so we access methods dynamically with proper type narrowing.
    // The runtime check below (typeof serviceMethod !== 'function') ensures safety.
    // Use 'unknown' first to avoid unsafe type assertions, then narrow with runtime check
    const serviceRecord = service;
    const serviceMethods = serviceRecord as unknown as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;
    const serviceMethod = serviceMethods[fnConfig.methodName];

    if (!serviceMethod || typeof serviceMethod !== 'function') {
      throw new Error(
        `Method '${fnConfig.methodName}' not found on service '${fnConfig.serviceKey}'. ` +
          `Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(service))
            .filter((m) => m !== 'constructor')
            .join(', ')}`
      );
    }

    const promiseResult = serviceMethod.call(service, serviceArgs);
    const result = await promiseResult;

    // Transform result if transformer provided
    let transformedResult: null | unknown = result;
    if (fnConfig.transformResult) {
      transformedResult = fnConfig.transformResult(result, args);
    } else if (fnConfig.normalizeResult) {
      transformedResult = fnConfig.normalizeResult(result);
    }

    // Log success
    const logData: LogContext = {
      hasResult: transformedResult !== null && transformedResult !== undefined,
    };
    if (fnConfig.logContext) {
      Object.assign(logData, fnConfig.logContext(args, transformedResult));
    }
    reqLogger.info(logData, `${fnConfig.operation}: fetched successfully`);

    return transformedResult;
  } catch (error) {
    // Custom error handler
    if (fnConfig.onError) {
      const onErrorResult = fnConfig.onError(error, args);
      return onErrorResult;
    }

    // Default error handling
    const normalized = normalizeError(error, `${fnConfig.operation} failed`);
    const errorLogData: LogContext = { err: normalized };
    reqLogger.error(errorLogData, `${fnConfig.operation} failed`);

    if (fnConfig.throwOnError) {
      throw normalized;
    }

    return null;
  }
}

/**
 * Configuration for creating a data function
 */
export interface DataFunctionConfig<TArgs, TReturn> {
  /**
   * Additional logging context to include
   * Receives both args and result for comprehensive logging
   */
  logContext?: (args: TArgs, result?: unknown) => LogContext;

  /**
   * Method name on the service to call
   */
  methodName: string;

  /**
   * Module name for logging (e.g., 'data/content/detail')
   */
  module: string;

  /**
   * Normalize result (e.g., extract first item from array, handle null)
   * If not provided, result is returned as-is
   */
  normalizeResult?: (result: unknown) => null | TReturn;

  /**
   * Custom error handler - if provided, overrides default error handling
   */
  onError?: (error: unknown, args: TArgs) => null | TReturn;

  /**
   * Operation name for logging (e.g., 'getContentDetailCore')
   */
  operation: string;

  /**
   * Service key from service factory registry
   */
  serviceKey: ServiceKey;

  /**
   * Whether to throw errors or return null (default: return null)
   */
  throwOnError?: boolean;

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
   * Optional validation function - returns false if args are invalid
   */
  validate?: (args: TArgs) => boolean;

  /**
   * Optional validation error message
   */
  validateError?: string;
}

/**
 * Create a data function with automatic logging/error handling
 *
 * @param config
 * @example
 * ```typescript
 * export const getContentDetailCore = createDataFunction({
 *   serviceKey: 'content',
 *   methodName: 'getContentDetailCore',
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
export function createDataFunction<TArgs, TReturn>(
  config: DataFunctionConfig<TArgs, TReturn>
): (args: TArgs) => Promise<null | TReturn> {
  // Prepare config (with unknown types to avoid closure capture)
  const fnConfig: {
    logContext?: (args: unknown, result?: unknown) => LogContext;
    methodName: string;
    module: string;
    normalizeResult?: (result: unknown) => null | unknown;
    onError?: (error: unknown, args: unknown) => null | unknown;
    operation: string;
    serviceKey: ServiceKey;
    throwOnError: boolean;
    transformArgs?: (args: unknown) => unknown;
    transformResult?: (result: unknown, args?: unknown) => unknown;
    validate?: (args: unknown) => boolean;
    validateError?: string;
  } = {
    methodName: config.methodName,
    module: config.module,
    operation: config.operation,
    serviceKey: config.serviceKey,
    throwOnError: config.throwOnError ?? false,
  };

  // Add optional properties only if they exist (for exactOptionalPropertyTypes compatibility)
  if (config.validate) {
    fnConfig.validate = config.validate as (args: unknown) => boolean;
  }
  if (config.validateError) {
    fnConfig.validateError = config.validateError;
  }
  if (config.transformArgs) {
    fnConfig.transformArgs = config.transformArgs as (args: unknown) => unknown;
  }
  if (config.transformResult) {
    fnConfig.transformResult = config.transformResult as (
      result: unknown,
      args?: unknown
    ) => unknown;
  }
  if (config.normalizeResult) {
    fnConfig.normalizeResult = config.normalizeResult as (result: unknown) => null | unknown;
  }
  if (config.onError) {
    fnConfig.onError = config.onError as (error: unknown, args: unknown) => null | unknown;
  }
  if (config.logContext) {
    fnConfig.logContext = config.logContext as (args: unknown, result?: unknown) => LogContext;
  }

  // Create a unique string key to use as the identifier (stable reference, not captured in closure)
  const functionId = `data-function-${config.module}-${config.operation}`;

  // Create the data function without capturing config in closure
  // This prevents "Functions cannot be passed directly to Client Components" errors
  const dataFunction = async (args: unknown): Promise<null | unknown> => {
    // Retrieve configuration from Map at runtime using stable string key (not captured in closure)
    const storedConfig = dataFunctionConfigs.get(functionId);
    if (!storedConfig) {
      throw new Error(`Data function configuration not found for ${config.operation}`);
    }

    const result = await executeDataFunction(storedConfig, args);

    return result;
  };

  // Store configuration in Map using string key (stable reference)
  dataFunctionConfigs.set(functionId, fnConfig);

  // Return function with original generic types (cast to match expected signature)
  return dataFunction as (args: TArgs) => Promise<null | TReturn>;
}

/**
 * @deprecated Use createDataFunction instead. This alias is kept for backward compatibility during migration.
 */
export const createCachedDataFunction = createDataFunction;

/**
 * @deprecated Use DataFunctionConfig instead. This type is kept for backward compatibility during migration.
 */
export type CachedDataFunctionConfig<TArgs, TReturn> = DataFunctionConfig<TArgs, TReturn> & {
  /**
   * @deprecated Cache life is unused - pages control caching
   */
  cacheLife?:
    | 'long'
    | 'medium'
    | 'short'
    | 'userProfile'
    | { expire: number; revalidate: number; stale: number };
  /**
   * @deprecated Cache mode is unused - pages control caching
   */
  cacheMode?: 'private' | 'public';
  /**
   * @deprecated Cache tags are unused - pages apply tags within 'use cache' context
   */
  cacheTags?: (args: TArgs) => string[];
};

// Helper functions (generateContentTags, generateResourceTags) are in content-helpers.ts
// They are pure utility functions that return arrays and don't need 'use server' directive.
