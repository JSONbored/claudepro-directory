/**
 * Validation Schemas
 * Production-grade schemas for input validation and type safety
 * Replaces the old legitimate.types.ts with proper Zod schemas
 */

import { z } from 'zod';

/**
 * Unvalidated Input Schema
 * For server actions, API endpoints, and form handlers
 * Must be validated with specific schemas before use
 */
export const unvalidatedInputSchema = z.unknown();
export type UnvalidatedInput = z.infer<typeof unvalidatedInputSchema>;

/**
 * Caught Error Schema
 * For errors in try-catch blocks
 * JavaScript can throw anything, so we use unknown
 */
export const caughtErrorSchema = z.unknown();
export type CaughtError = z.infer<typeof caughtErrorSchema>;

/**
 * Spreadable Props Schema
 * For React component props that need spreading
 * Used for MDX components and polymorphic components
 */
export const spreadablePropsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()])
);
export type SpreadableProps = z.infer<typeof spreadablePropsSchema>;

/**
 * Effect Cleanup Schema
 * Optional React effect cleanup functions
 */
export const effectCleanupSchema = z.union([z.function(), z.undefined()]);
export type EffectCleanup = z.infer<typeof effectCleanupSchema>;

/**
 * Unvalidated JSON Schema
 * JSON.parse results before validation
 */
export const unvalidatedJSONSchema = z.unknown();
export type UnvalidatedJSON = z.infer<typeof unvalidatedJSONSchema>;

/**
 * External API Response Schema
 * External data that must be validated
 */
export const externalAPIResponseSchema = z.unknown();
export type ExternalAPIResponse = z.infer<typeof externalAPIResponseSchema>;

/**
 * Conditional Render Schema
 * Optional React render result
 */
export const conditionalRenderSchema = z.union([
  z.null(),
  z.string(),
  z.number(),
  z.boolean(),
  z
    .object({})
    .passthrough(), // ReactElement
]);
export type ConditionalRender = z.infer<typeof conditionalRenderSchema>;

/**
 * Browser Global Schema
 * Properties that may not exist in SSR
 */
export const browserGlobalSchema = z.union([
  z.object({
    window: z.object({}).passthrough(),
    document: z.object({}).passthrough(),
  }),
  z.undefined(),
]);
export type BrowserGlobal = z.infer<typeof browserGlobalSchema>;

/**
 * Form Data Schema
 * For validating form submissions
 */
export const formDataSchema = z.instanceof(FormData);
export type ValidatedFormData = z.infer<typeof formDataSchema>;

/**
 * Server Action Input Schema
 * Base schema for server action inputs
 */
export const serverActionInputSchema = z.union([formDataSchema, z.record(z.string(), z.unknown())]);
export type ServerActionInput = z.infer<typeof serverActionInputSchema>;

/**
 * API Response Schema
 * Standard API response structure
 */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});
export type APIResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Validation Result Schema
 * Result of Zod validation
 */
export const validationResultSchema = z.union([
  z.object({
    success: z.literal(true),
    data: z.unknown(),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      issues: z.array(
        z.object({
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
        })
      ),
    }),
  }),
]);
export type ValidationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Utility Type Schemas
 * Common utility types for the application using proper Zod patterns
 */

// Helper function to make any schema nullable
export const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable();

// Helper function to make any schema optional
export const optional = <T extends z.ZodTypeAny>(schema: T) => schema.optional();

// Helper function to make any schema nullable and optional
export const nullish = <T extends z.ZodTypeAny>(schema: T) => schema.nullish();

// Promise schema helper
export const promiseSchema = <T extends z.ZodTypeAny>(schema: T) => z.promise(schema);

// Async function return type helper
export const asyncReturnSchema = <T extends z.ZodTypeAny>(_schema: T) => z.function();
