/**
 * Cursor-Based Pagination Schemas
 *
 * Production-grade cursor pagination for efficient, scalable API endpoints.
 * Provides type-safe schemas for both request parameters and response metadata.
 *
 * Benefits over offset pagination:
 * - Consistent results even when data changes
 * - Better performance for large datasets
 * - No "page drift" when items are added/removed
 * - Scales to millions of records
 *
 * Usage:
 * - Request: cursorPaginationQuerySchema
 * - Response: cursorPaginationMetaSchema
 *
 * @see https://shopify.dev/api/usage/pagination-graphql
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/pagination
 */

import { z } from 'zod';
import { UI_CONFIG } from '@/src/lib/constants';
import { nonNegativeInt, positiveInt } from './base-numbers';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Pagination limits for cursor-based pagination
 */
export const CURSOR_PAGINATION_LIMITS = {
  MIN_LIMIT: 1,
  DEFAULT_LIMIT: UI_CONFIG.pagination.defaultLimit,
  MAX_LIMIT: UI_CONFIG.pagination.maxLimit,
  MAX_CURSOR_LENGTH: 500, // Base64 encoded cursor max length
} as const;

// ============================================================================
// CURSOR VALIDATION
// ============================================================================

/**
 * Cursor string validator
 * Cursors are typically base64-encoded JSON or simple identifiers
 *
 * Security considerations:
 * - Max length to prevent DoS attacks
 * - Validates base64 or alphanumeric format
 * - Prevents injection attacks
 */
export const cursorString = z
  .string()
  .min(1, 'Cursor cannot be empty')
  .max(CURSOR_PAGINATION_LIMITS.MAX_CURSOR_LENGTH, 'Cursor too long')
  .regex(
    /^[A-Za-z0-9+/=_-]+$/,
    'Invalid cursor format (must be base64 or alphanumeric with safe chars)'
  )
  .refine((cursor) => !cursor.includes('\0'), 'Null bytes not allowed in cursor')
  .refine((cursor) => !cursor.includes('..'), 'Path traversal detected in cursor')
  .describe('Secure cursor string for pagination (base64 or alphanumeric)');

export type CursorString = z.infer<typeof cursorString>;

/**
 * Optional cursor string (for first page requests)
 */
export const optionalCursorString = cursorString.optional();

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Cursor pagination query parameters schema
 * Used for API request validation
 *
 * Query parameters:
 * - cursor: Optional cursor for next page (omit for first page)
 * - limit: Number of items per page (1-100, default 10)
 *
 * Example: ?cursor=eyJpZCI6MTAwfQ==&limit=20
 */
export const cursorPaginationQuerySchema = z
  .object({
    cursor: optionalCursorString.describe('Pagination cursor (omit for first page)'),
    limit: z.coerce
      .number()
      .int('Limit must be an integer')
      .min(
        CURSOR_PAGINATION_LIMITS.MIN_LIMIT,
        `Limit must be at least ${CURSOR_PAGINATION_LIMITS.MIN_LIMIT}`
      )
      .max(
        CURSOR_PAGINATION_LIMITS.MAX_LIMIT,
        `Limit cannot exceed ${CURSOR_PAGINATION_LIMITS.MAX_LIMIT}`
      )
      .default(CURSOR_PAGINATION_LIMITS.DEFAULT_LIMIT)
      .describe(
        `Items per page (${CURSOR_PAGINATION_LIMITS.MIN_LIMIT}-${CURSOR_PAGINATION_LIMITS.MAX_LIMIT}, default: ${CURSOR_PAGINATION_LIMITS.DEFAULT_LIMIT})`
      ),
  })
  .describe('Cursor-based pagination query parameters for API requests');

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

/**
 * Bidirectional cursor pagination query schema
 * Supports both forward and backward pagination
 *
 * Query parameters:
 * - after: Cursor for forward pagination (get items after this cursor)
 * - before: Cursor for backward pagination (get items before this cursor)
 * - first: Number of items for forward pagination (1-100)
 * - last: Number of items for backward pagination (1-100)
 *
 * Note: Only one direction should be specified at a time
 * Example: ?after=abc123&first=20 OR ?before=xyz789&last=20
 */
export const bidirectionalCursorPaginationQuerySchema = z
  .object({
    after: optionalCursorString.describe('Cursor for forward pagination'),
    before: optionalCursorString.describe('Cursor for backward pagination'),
    first: z.coerce
      .number()
      .int('First must be an integer')
      .min(
        CURSOR_PAGINATION_LIMITS.MIN_LIMIT,
        `First must be at least ${CURSOR_PAGINATION_LIMITS.MIN_LIMIT}`
      )
      .max(
        CURSOR_PAGINATION_LIMITS.MAX_LIMIT,
        `First cannot exceed ${CURSOR_PAGINATION_LIMITS.MAX_LIMIT}`
      )
      .optional()
      .describe(
        `Items after cursor (${CURSOR_PAGINATION_LIMITS.MIN_LIMIT}-${CURSOR_PAGINATION_LIMITS.MAX_LIMIT})`
      ),
    last: z.coerce
      .number()
      .int('Last must be an integer')
      .min(
        CURSOR_PAGINATION_LIMITS.MIN_LIMIT,
        `Last must be at least ${CURSOR_PAGINATION_LIMITS.MIN_LIMIT}`
      )
      .max(
        CURSOR_PAGINATION_LIMITS.MAX_LIMIT,
        `Last cannot exceed ${CURSOR_PAGINATION_LIMITS.MAX_LIMIT}`
      )
      .optional()
      .describe(
        `Items before cursor (${CURSOR_PAGINATION_LIMITS.MIN_LIMIT}-${CURSOR_PAGINATION_LIMITS.MAX_LIMIT})`
      ),
  })
  .refine(
    (data) => {
      // Ensure only one pagination direction is specified
      const forwardPagination = data.after !== undefined || data.first !== undefined;
      const backwardPagination = data.before !== undefined || data.last !== undefined;
      return !(forwardPagination && backwardPagination);
    },
    {
      message: 'Cannot specify both forward (after/first) and backward (before/last) pagination',
    }
  )
  .describe('Bidirectional cursor pagination for GraphQL-style APIs');

export type BidirectionalCursorPaginationQuery = z.infer<
  typeof bidirectionalCursorPaginationQuerySchema
>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Page info schema for cursor pagination
 * Indicates if more pages are available
 *
 * Used in: Cursor pagination response metadata
 */
export const pageInfoSchema = z
  .object({
    hasNextPage: z.boolean().describe('Whether more items exist after the current page'),
    hasPreviousPage: z.boolean().describe('Whether more items exist before the current page'),
    startCursor: cursorString.nullable().describe('Cursor of the first item in the current page'),
    endCursor: cursorString.nullable().describe('Cursor of the last item in the current page'),
  })
  .describe('Page information for cursor-based pagination');

export type PageInfo = z.infer<typeof pageInfoSchema>;

/**
 * Cursor pagination metadata schema
 * Used in API responses for cursor-based pagination
 *
 * Response structure:
 * - nextCursor: Cursor for next page (null if no more pages)
 * - hasMore: Whether more items exist after current page
 * - count: Number of items in current page
 * - total: Total number of items (optional, can be expensive to compute)
 */
export const cursorPaginationMetaSchema = z
  .object({
    nextCursor: cursorString.nullable().describe('Cursor for next page (null if no more items)'),
    previousCursor: cursorString
      .nullable()
      .optional()
      .describe('Cursor for previous page (null if no previous items)'),
    hasMore: z.boolean().describe('Whether more items exist after the current page'),
    hasPrevious: z
      .boolean()
      .optional()
      .describe('Whether more items exist before the current page'),
    count: nonNegativeInt.describe('Number of items in current page'),
    total: nonNegativeInt.optional().describe('Total number of items (optional, may be expensive)'),
    limit: positiveInt.describe('Number of items requested per page'),
  })
  .describe('Cursor-based pagination metadata for API responses');

export type CursorPaginationMeta = z.infer<typeof cursorPaginationMetaSchema>;

/**
 * GraphQL-style connection metadata
 * Compatible with Relay cursor specification
 *
 * Used in: GraphQL-compatible APIs, Relay connections
 */
export const connectionMetaSchema = z
  .object({
    pageInfo: pageInfoSchema,
    totalCount: nonNegativeInt
      .optional()
      .describe('Total number of items (optional, expensive to compute)'),
  })
  .describe('GraphQL Relay-style connection metadata');

export type ConnectionMeta = z.infer<typeof connectionMetaSchema>;

// ============================================================================
// EDGE SCHEMA (GraphQL Connection Pattern)
// ============================================================================

/**
 * Generic edge schema for GraphQL-style connections
 * Wraps each item with its cursor
 *
 * Used in: GraphQL connections, Relay pagination
 */
export function createEdgeSchema<T extends z.ZodTypeAny>(nodeSchema: T) {
  return z.object({
    cursor: cursorString.describe('Cursor for this edge'),
    node: nodeSchema.describe('The actual data item'),
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a cursor from a simple identifier
 * Encodes the ID as base64 for security
 *
 * @param id - Item identifier (string or number)
 * @returns Base64-encoded cursor string
 */
export function createCursor(id: string | number): string {
  const cursor = Buffer.from(JSON.stringify({ id })).toString('base64');
  return cursorString.parse(cursor);
}

/**
 * Decode a cursor to extract the identifier
 * Safely decodes base64 cursor with error handling
 *
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded identifier or null if invalid
 */
export function decodeCursor(cursor: string): { id: string | number } | null {
  try {
    // Validate cursor format first
    cursorString.parse(cursor);

    // Decode base64
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');

    // Parse JSON
    const parsed = JSON.parse(decoded) as { id: string | number };

    // Validate structure
    if (!parsed || typeof parsed.id === 'undefined') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Create pagination metadata from query results
 * Simplifies response building
 *
 * @param items - Current page items
 * @param limit - Requested limit
 * @param hasMore - Whether more items exist
 * @param createCursorFn - Function to create cursor from item
 * @returns Complete pagination metadata
 */
export function createPaginationMeta<T>(
  items: T[],
  limit: number,
  hasMore: boolean,
  createCursorFn: (item: T) => string
): CursorPaginationMeta {
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem !== undefined ? createCursorFn(lastItem) : null;

  return cursorPaginationMetaSchema.parse({
    nextCursor,
    hasMore,
    count: items.length,
    limit,
  });
}

/**
 * Validate pagination query with user-friendly errors
 *
 * @param params - Query parameters object
 * @returns Validated pagination query or throws
 */
export function validatePaginationQuery(params: Record<string, unknown>): CursorPaginationQuery {
  return cursorPaginationQuerySchema.parse(params);
}
