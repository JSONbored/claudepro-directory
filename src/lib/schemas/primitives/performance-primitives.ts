/**
 * Performance & Timing Validation Primitives
 *
 * Minimal error tracking schemas that are actually used.
 * Most performance/timing validators were removed as they were unused.
 */

import { z } from "zod";
import { nonEmptyString } from "./base-strings";

/**
 * Error type validator
 * Used for: Error categorization, error tracking
 * Common in: Error monitoring, error-handler.ts
 */
const errorType = nonEmptyString
  .max(100)
  .transform((val) => val.replace(/[^\w\s-]/g, ""))
  .describe("Error type identifier for categorization and tracking");

/**
 * Error severity validator
 * Used for: Error priority, incident management
 * Common in: Error tracking, monitoring systems
 */
const errorSeverity = z
  .enum(["low", "medium", "high", "critical"])
  .default("medium")
  .describe("Error severity level for incident priority management");

/**
 * Stack trace length limit
 */
export const MAX_STACK_TRACE_LENGTH = 5000;

/**
 * Type exports
 */
export type ErrorType = z.infer<typeof errorType>;
export type ErrorSeverity = z.infer<typeof errorSeverity>;
