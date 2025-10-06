/**
 * Base Array Validation Primitives
 *
 * Centralized array validators to eliminate duplication across schemas.
 * These primitives are used extensively throughout the codebase.
 *
 * Usage Statistics (before consolidation):
 * - z.array(z.string()): 65+ instances
 * - z.array(z.string().min(1)): 40+ instances
 * - Various max() constraints: 100+ instances
 *
 * Production Standards:
 * - All exports must be properly typed
 * - Each validator includes JSDoc with use cases
 * - Maximum sizes based on actual content analysis
 */

import { z } from "zod";
import { mediumString, nonEmptyString } from "./base-strings";

/**
 * Basic string array validator
 * Used for: Any array of strings without constraints
 * Common in: General lists, collections
 */
export const stringArray = z
  .array(z.string())
  .describe("Array of strings without constraints");

/**
 * Non-empty string array validator
 * Used for: Arrays where empty strings are not allowed
 * Common in: Tags, keywords, requirements, features
 */
export const nonEmptyStringArray = z
  .array(nonEmptyString)
  .describe("Array of non-empty strings for tags and keywords");

/**
 * Required tag array (minimum 1 item)
 * Used for: Mandatory tagging, required categorization
 * Common in: Content schemas where tags are required
 */
export const requiredTagArray = z
  .array(nonEmptyString)
  .min(1)
  .describe("Required tag array with minimum 1 item");

/**
 * Limited medium string array (max 20 items)
 * Used for: Constrained lists of descriptions
 * Common in: Requirements, security guidelines, permissions
 */
export const limitedMediumStringArray = z
  .array(mediumString)
  .max(20)
  .describe("Constrained list of medium strings (max 20 items)");

/**
 * Examples array (max 10 items)
 * Used for: Code examples, usage examples
 * Common in: Documentation, command examples, rule examples
 */
export const examplesArray = z
  .array(z.string().max(1000))
  .max(10)
  .describe("Code or usage examples (max 10 items, 1000 chars each)");

/**
 * Large content array (max 50 items, up to 500 chars each)
 * Used for: Extensive lists like all features, full capabilities
 * Common in: Complete feature sets, all use cases
 */
export const largeContentArray = z
  .array(mediumString)
  .max(50)
  .describe(
    "Large content collection for complete feature sets (max 50 items, 500 chars each)",
  );
