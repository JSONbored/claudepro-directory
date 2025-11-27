/**
 * Homepage Error Tracking Utilities
 * 
 * Provides standardized error tracking for homepage components with structured logging.
 * Follows existing patterns: logger, normalizeError, generateRequestId
 * 
 * Usage:
 * ```typescript
 * import { trackHomepageSectionError, trackRPCFailure } from '@heyclaude/web-runtime/utils/homepage-error-tracking';
 * 
 * try {
 *   const data = await getHomepageData();
 * } catch (error) {
 *   trackRPCFailure('get_homepage_optimized', error, { categoryIds });
 * }
 * ```
 */

import { logger, toLogContextValue } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { generateRequestId } from './request-context.ts';

export type HomepageSection = 
  | 'hero' 
  | 'stats' 
  | 'featured' 
  | 'search' 
  | 'jobs' 
  | 'all-content'
  | 'top-contributors'
  | 'search-facets';

/**
 * Track errors in homepage sections with structured logging
 * 
 * @param section - The homepage section where the error occurred
 * @param operation - Specific operation that failed (e.g., 'fetch-data', 'render')
 * @param error - The error that occurred
 * @param context - Additional context for debugging
 */
export function trackHomepageSectionError(
  section: HomepageSection,
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const normalized = normalizeError(error, `${section}: ${operation} failed`);
  const requestId = generateRequestId();
  
  logger.error(`Homepage.${section}: ${operation} failed`, normalized, {
    requestId,
    operation: `homepage.${section}`,
    section,
    ...(context ?? {}),
  });
}

/**
 * Track RPC/database call failures specifically
 * 
 * @param rpcName - Name of the RPC function that failed
 * @param error - The error that occurred
 * @param context - Additional context (categoryIds, params, etc.)
 */
export function trackRPCFailure(
  rpcName: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const normalized = normalizeError(error, `RPC ${rpcName} failed`);
  const requestId = generateRequestId();
  
  // Use dbQuery serializer for consistent database query formatting
  // Convert dbQuery object to LogContextValue-compatible structure
  const dbQueryContext: Record<string, unknown> = {
    rpcName,
    ...(context && Object.keys(context).length > 0 ? { args: toLogContextValue(context) } : {}),
  };
  logger.error(`Homepage RPC failure: ${rpcName}`, normalized, {
    requestId,
    operation: 'homepage.rpc',
    dbQuery: toLogContextValue(dbQueryContext),
  });
}

/**
 * Track missing data issues (when expected data is not present)
 * 
 * @param section - The homepage section
 * @param dataType - Type of data that's missing (e.g., 'stats', 'categoryData')
 * @param context - Additional context about what's missing
 */
export function trackMissingData(
  section: HomepageSection,
  dataType: string,
  context?: Record<string, unknown>
): void {
  const requestId = generateRequestId();
  
  logger.warn(`Homepage.${section}: Missing ${dataType}`, undefined, {
    requestId,
    operation: `homepage.${section}`,
    section,
    dataType,
    ...(context ?? {}),
  });
}

/**
 * Track validation failures (when data structure is invalid)
 * 
 * @param section - The homepage section
 * @param validationIssue - Description of the validation issue
 * @param context - Additional context about the invalid data
 */
export function trackValidationFailure(
  section: HomepageSection,
  validationIssue: string,
  context?: Record<string, unknown>
): void {
  const requestId = generateRequestId();
  
  logger.warn(`Homepage.${section}: Validation failed - ${validationIssue}`, undefined, {
    requestId,
    operation: `homepage.${section}`,
    section,
    validationIssue,
    ...(context ?? {}),
  });
}
