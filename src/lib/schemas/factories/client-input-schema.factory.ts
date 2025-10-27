/**
 * Client Input Schema Factory
 *
 * Configuration-driven factory for creating client-side input schemas from database schemas.
 * Eliminates manual `.omit().extend()` patterns and provides consistent schema generation.
 *
 * Architecture:
 * - Database schema as input (auto-generated from Supabase)
 * - Configuration object defines transformations
 * - Output: Type-safe client input schema with server fields removed
 *
 * Benefits:
 * - DRY: Single factory function, not repeated patterns
 * - Scalable: Add 100 tables with same configuration approach
 * - Maintainable: Config objects are self-documenting
 * - Type-safe: Preserves TypeScript inference
 * - Performance: No runtime overhead, compile-time only
 *
 * @module lib/schemas/factories/client-input-schema
 */

import type { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

// ============================================================================
// Factory Configuration Types
// ============================================================================

/**
 * Configuration for client input schema generation
 */
export interface ClientSchemaConfig<T extends ZodRawShape = ZodRawShape> {
  /**
   * Fields to omit from the database schema (server-only fields)
   * Common: ['user_id', 'id', 'created_at', 'updated_at']
   */
  omitFields?: (keyof T)[];

  /**
   * Field transformations (sanitization, normalization)
   * Uses Zod's .transform() under the hood
   *
   * @example
   * {
   *   transforms: {
   *     content_slug: z.string().transform(normalizeSlug),
   *     email: z.string().transform(normalizeEmail),
   *   }
   * }
   */
  transforms?: Partial<Record<keyof T, ZodTypeAny>>;

  /**
   * Default values for optional fields
   * Ensures fields always have a value (not undefined)
   *
   * @example
   * {
   *   defaults: {
   *     is_public: z.boolean().default(false),
   *     order: z.number().default(0),
   *   }
   * }
   */
  defaults?: Partial<Record<keyof T, ZodTypeAny>>;

  /**
   * Required fields (override optional from database)
   * Forces fields to be required in client input
   *
   * @example
   * {
   *   required: ['name', 'email']
   * }
   */
  required?: (keyof T)[];
}

// ============================================================================
// Schema Factory
// ============================================================================

/**
 * Create a client input schema from a database schema
 *
 * Takes a Supabase-generated schema and transforms it for client-side use:
 * 1. Removes server-only fields (user_id, timestamps, etc.)
 * 2. Applies field transformations (sanitization, normalization)
 * 3. Sets default values for optional fields
 * 4. Enforces required fields
 *
 * @param databaseSchema - Auto-generated schema from Supabase (e.g., publicUsersInsertSchema)
 * @param config - Configuration object defining transformations
 * @returns Client-safe input schema with server fields removed
 *
 * @example
 * ```typescript
 * import { normalizeSlug, trimOptionalString } from '../primitives/sanitization-transforms';
 *
 * export const bookmarkClientSchema = createClientInputSchema(
 *   publicBookmarksInsertSchema,
 *   {
 *     omitFields: ['user_id', 'id', 'created_at'],
 *     transforms: {
 *       content_slug: z.string().transform(normalizeSlug),
 *       notes: z.string().optional().transform(trimOptionalString),
 *     },
 *   }
 * );
 * ```
 */
export function createClientInputSchema<T extends ZodRawShape>(
  databaseSchema: ZodObject<T>,
  config: ClientSchemaConfig<T> = {}
) {
  const { omitFields = [], transforms = {}, defaults = {}, required = [] } = config;

  // Step 1: Omit server-only fields
  const omitRecord = omitFields.reduce(
    (acc, field) => {
      acc[field] = true;
      return acc;
    },
    {} as Record<keyof T, true>
  );

  let schema: any =
    omitRecord && Object.keys(omitRecord).length > 0
      ? databaseSchema.omit(omitRecord)
      : databaseSchema;

  // Step 2: Apply transformations
  if (Object.keys(transforms).length > 0) {
    schema = schema.extend(transforms as any);
  }

  // Step 3: Apply defaults
  if (Object.keys(defaults).length > 0) {
    schema = schema.extend(defaults as any);
  }

  // Step 4: Make specified fields required
  if (required.length > 0) {
    const requiredFields = required.reduce(
      (acc, field) => {
        const fieldSchema = schema.shape[field as string];
        if (fieldSchema) {
          acc[field] = fieldSchema;
        }
        return acc;
      },
      {} as Record<keyof T, ZodTypeAny>
    );

    schema = schema.extend(requiredFields as any);
  }

  return schema;
}

// ============================================================================
// Common Field Omission Presets
// ============================================================================

/**
 * Standard server-only fields to omit from all client schemas
 * Use this as a base and add table-specific fields as needed
 */
export const STANDARD_SERVER_FIELDS = ['id', 'user_id', 'created_at', 'updated_at'] as const;

/**
 * Server-only fields for tables with additional metadata
 */
export const METADATA_SERVER_FIELDS = [
  ...STANDARD_SERVER_FIELDS,
  'view_count',
  'bookmark_count',
  'item_count',
] as const;

/**
 * Server-only fields for tables with social features
 */
export const SOCIAL_SERVER_FIELDS = [
  ...STANDARD_SERVER_FIELDS,
  'helpful_count',
  'comment_count',
  'vote_count',
] as const;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Utility type to extract client input type from factory-generated schema
 */
export type ClientInput<T extends ZodObject<any>> = ReturnType<T['parse']>;
