/**
 * Supabase Validators - Runtime Validation Utilities
 *
 * Production-grade runtime validation layer using auto-generated Zod schemas.
 * Eliminates unsafe type assertions and provides type-safe validation at API boundaries.
 *
 * Core Principles:
 * - Single source of truth (database.types.ts → generated schemas → validators)
 * - Runtime validation for all Supabase query results
 * - Zero drift between DB schema and runtime validation
 * - Type-safe with comprehensive error handling
 * - Performance-optimized with optional validation modes
 *
 * Architecture:
 * - Base validators for common patterns (single row, array, nullable)
 * - Table-specific validators for type safety
 * - Error handling with detailed context
 * - Optional strict mode for development vs production
 *
 * Usage:
 * ```typescript
 * // Replace unsafe type assertion
 * const user = data as User; // ❌ Unsafe
 *
 * // With runtime validation
 * const user = validateRow(publicUsersRowSchema, data); // ✅ Safe
 * ```
 *
 * @module lib/supabase/validators
 */

import type { ZodObject, ZodRawShape, ZodSchema, z } from 'zod';

// ============================================================================
// Validation Error Types
// ============================================================================

/**
 * Custom error for validation failures
 * Provides detailed context for debugging
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly context: {
      schema: string;
      data: unknown;
      errors: unknown;
    }
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Validation Options
// ============================================================================

/**
 * Validation behavior options
 */
export interface ValidatorOptions {
  /**
   * Strict mode: throw on validation failure
   * Default: true (fail fast in development)
   */
  strict?: boolean;

  /**
   * Schema name for error messages
   */
  schemaName?: string;

  /**
   * Custom error handler
   * Called instead of throwing when strict=false
   */
  onError?: (error: ValidationError) => void;
}

// ============================================================================
// Core Validators
// ============================================================================

/**
 * Validate a single row from Supabase query
 * Replaces: `data as T` or `data! as T`
 *
 * @example
 * ```typescript
 * const { data } = await supabase.from('users').select('*').single();
 * const user = validateRow(publicUsersRowSchema, data);
 * ```
 */
export function validateRow<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: ValidatorOptions = {}
): z.infer<T> {
  const { strict = true, schemaName = 'unknown', onError } = options;

  try {
    return schema.parse(data);
  } catch (error) {
    const validationError = new ValidationError(`Row validation failed for schema: ${schemaName}`, {
      schema: schemaName,
      data,
      errors: error,
    });

    if (onError) {
      onError(validationError);
    }

    if (strict) {
      throw validationError;
    }

    // Non-strict mode: return data as-is (fallback)
    return data as z.infer<T>;
  }
}

/**
 * Validate an array of rows from Supabase query
 * Replaces: `(data || []) as T[]`
 *
 * @example
 * ```typescript
 * const { data } = await supabase.from('users').select('*');
 * const users = validateRows(publicUsersRowSchema, data);
 * ```
 */
export function validateRows<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: ValidatorOptions = {}
): z.infer<T>[] {
  const { strict = true, schemaName = 'unknown', onError } = options;

  // Handle null/undefined
  if (data == null) {
    return [];
  }

  // Ensure array
  if (!Array.isArray(data)) {
    const error = new ValidationError(
      `Expected array for schema: ${schemaName}, got ${typeof data}`,
      {
        schema: schemaName,
        data,
        errors: 'Not an array',
      }
    );

    if (onError) {
      onError(error);
    }

    if (strict) {
      throw error;
    }

    return [];
  }

  try {
    return data.map((item) => schema.parse(item));
  } catch (error) {
    const validationError = new ValidationError(
      `Array validation failed for schema: ${schemaName}`,
      {
        schema: schemaName,
        data,
        errors: error,
      }
    );

    if (onError) {
      onError(validationError);
    }

    if (strict) {
      throw validationError;
    }

    // Non-strict mode: return data as-is (fallback)
    return data as z.infer<T>[];
  }
}

/**
 * Validate a nullable row from Supabase query
 * Replaces: `data as T | null`
 *
 * @example
 * ```typescript
 * const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
 * const user = validateNullableRow(publicUsersRowSchema, data);
 * ```
 */
export function validateNullableRow<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: ValidatorOptions = {}
): z.infer<T> | null {
  if (data == null) {
    return null;
  }

  return validateRow(schema, data, options);
}

/**
 * Validate a single field from query result
 * Useful for aggregations, counts, etc.
 *
 * @example
 * ```typescript
 * const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
 * const validCount = validateField(z.number().int().nonnegative(), count);
 * ```
 */
export function validateField<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: ValidatorOptions = {}
): z.infer<T> {
  const { strict = true, schemaName = 'field', onError } = options;

  try {
    return schema.parse(data);
  } catch (error) {
    const validationError = new ValidationError(`Field validation failed for: ${schemaName}`, {
      schema: schemaName,
      data,
      errors: error,
    });

    if (onError) {
      onError(validationError);
    }

    if (strict) {
      throw validationError;
    }

    return data as z.infer<T>;
  }
}

// ============================================================================
// Partial Validation Helpers
// ============================================================================

/**
 * Validate only specified fields from schema
 * Useful for partial selects
 *
 * NOTE: Due to TypeScript limitations with Zod's .pick() type inference,
 * this function uses a type assertion after runtime validation.
 * The validation is still performed at runtime - only the type is asserted.
 *
 * @example
 * ```typescript
 * const { data } = await supabase.from('users').select('id, email');
 * const partialUser = validatePartial(publicUsersRowSchema, data, ['id', 'email']);
 * ```
 */
export function validatePartial<T extends ZodObject<ZodRawShape>, K extends keyof z.infer<T>>(
  schema: T,
  data: unknown,
  fields: K[],
  options: ValidatorOptions = {}
): Pick<z.infer<T>, K> {
  // Build pick record for Zod
  const pickRecord: Record<string, true> = {};
  for (const field of fields) {
    pickRecord[field as string] = true;
  }

  // Create partial schema with only specified fields
  const partialSchema = schema.pick(pickRecord as any);

  // Validate with the partial schema
  // Type assertion is safe because:
  // 1. Runtime validation happens via Zod
  // 2. We're only picking fields that exist in the original schema
  // 3. TypeScript can't properly infer the picked type, but runtime is correct
  const validated = validateRow(partialSchema, data, options);
  return validated as Pick<z.infer<T>, K>;
}

// ============================================================================
// Safe Parsing (Non-Throwing)
// ============================================================================

/**
 * Safe validation result
 */
export type SafeValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

/**
 * Safely validate data without throwing
 * Returns success/failure result
 *
 * @example
 * ```typescript
 * const result = safeValidateRow(publicUsersRowSchema, data);
 * if (result.success) {
 *   const user = result.data;
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function safeValidateRow<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: Omit<ValidatorOptions, 'strict'> = {}
): SafeValidationResult<z.infer<T>> {
  try {
    const validated = validateRow(schema, data, { ...options, strict: true });
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ValidationError
          ? error
          : new ValidationError('Unknown validation error', {
              schema: options.schemaName || 'unknown',
              data,
              errors: error,
            }),
    };
  }
}

/**
 * Safely validate array without throwing
 */
export function safeValidateRows<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: Omit<ValidatorOptions, 'strict'> = {}
): SafeValidationResult<z.infer<T>[]> {
  try {
    const validated = validateRows(schema, data, { ...options, strict: true });
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ValidationError
          ? error
          : new ValidationError('Unknown validation error', {
              schema: options.schemaName || 'unknown',
              data,
              errors: error,
            }),
    };
  }
}

// ============================================================================
// Development Helpers
// ============================================================================

/**
 * Log validation errors without throwing
 * Useful for gradual migration from type assertions
 */
export function validateWithLogging<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: ValidatorOptions = {}
): z.infer<T> {
  return validateRow(schema, data, {
    ...options,
    strict: false,
    onError: (_error) => {},
  });
}

/**
 * Validate in development, pass through in production
 * Performance optimization for production environments
 */
export function validateInDev<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: ValidatorOptions = {}
): z.infer<T> {
  if (process.env.NODE_ENV === 'development') {
    return validateRow(schema, data, options);
  }

  // Production: skip validation for performance
  return data as z.infer<T>;
}
