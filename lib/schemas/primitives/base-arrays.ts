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

import { z } from 'zod';
import { mediumString, nonEmptyString, shortString, urlString } from './base-strings';

/**
 * Basic string array validator
 * Used for: Any array of strings without constraints
 * Common in: General lists, collections
 */
export const stringArray = z.array(z.string()).describe('Array of strings without constraints');

/**
 * Non-empty string array validator
 * Used for: Arrays where empty strings are not allowed
 * Common in: Tags, keywords, requirements, features
 */
export const nonEmptyStringArray = z
  .array(nonEmptyString)
  .describe('Array of non-empty strings for tags and keywords');

/**
 * Tag array validator (with default empty array)
 * Used for: Content tags, categories, keywords
 * Common in: All content schemas (agents, mcp, rules, commands, hooks, guides)
 */
export const tagArray = z
  .array(z.string())
  .default([])
  .describe('Content tags array with empty default');

/**
 * Small tag array (max 10 items)
 * Used for: Limited tag sets, small keyword lists
 * Common in: Metadata, SEO keywords, focused categorization
 */
export const smallTagArray = z
  .array(shortString)
  .max(10)
  .describe('Small tag collection (max 10 items)');

/**
 * Medium tag array (max 20 items)
 * Used for: Standard tag collections
 * Common in: Content tags, feature lists
 */
export const mediumTagArray = z
  .array(shortString)
  .max(20)
  .describe('Standard tag collection (max 20 items)');

/**
 * Large tag array (max 50 items)
 * Used for: Extensive feature lists, capabilities
 * Common in: Features, use cases, permissions
 */
export const largeTagArray = z
  .array(mediumString)
  .max(50)
  .describe('Large collection for extensive features and capabilities (max 50 items)');

/**
 * URL array validator
 * Used for: Lists of links, image sources
 * Common in: Social sharing, image galleries, documentation links
 */
export const urlArray = z.array(urlString).describe('Array of valid URLs for links and images');

/**
 * Small URL array (max 4 items)
 * Used for: Limited link collections (e.g., OpenGraph images)
 * Common in: SEO metadata, social media images
 */
export const smallUrlArray = z
  .array(urlString)
  .max(4)
  .describe('Small URL collection for OpenGraph images (max 4 items)');

/**
 * Required tag array (minimum 1 item)
 * Used for: Mandatory tagging, required categorization
 * Common in: Content schemas where tags are required
 */
export const requiredTagArray = z
  .array(nonEmptyString)
  .min(1)
  .describe('Required tag array with minimum 1 item');

/**
 * Short string array (items max 100 chars)
 * Used for: Titles, names, labels in arrays
 * Common in: Step titles, feature names, quick references
 */
export const shortStringArray = z
  .array(shortString)
  .describe('Array of short strings for titles and labels (max 100 chars each)');

/**
 * Medium string array (items max 500 chars)
 * Used for: Descriptions, summaries, instructions
 * Common in: Installation steps, features, use cases, requirements
 */
export const mediumStringArray = z
  .array(mediumString)
  .describe('Array of medium strings for descriptions and instructions (max 500 chars each)');

/**
 * Limited medium string array (max 20 items)
 * Used for: Constrained lists of descriptions
 * Common in: Requirements, security guidelines, permissions
 */
export const limitedMediumStringArray = z
  .array(mediumString)
  .max(20)
  .describe('Constrained list of medium strings (max 20 items)');

/**
 * Steps array (max 50 items)
 * Used for: Installation steps, process steps, instructions
 * Common in: Installation configurations, step-by-step guides
 */
export const stepsArray = z
  .array(mediumString)
  .max(50)
  .describe('Installation or process steps (max 50 items)');

/**
 * Examples array (max 10 items)
 * Used for: Code examples, usage examples
 * Common in: Documentation, command examples, rule examples
 */
export const examplesArray = z
  .array(z.string().max(1000))
  .max(10)
  .describe('Code or usage examples (max 10 items, 1000 chars each)');

/**
 * Authors array (max 10 items)
 * Used for: Content authors, contributors
 * Common in: SEO metadata, OpenGraph data
 */
export const authorsArray = z
  .array(shortString)
  .max(10)
  .describe('Content authors or contributors (max 10 items)');

/**
 * Optional string array
 * Used for: Optional lists, optional features
 * Common in: Optional metadata, optional configurations
 */
export const optionalStringArray = z
  .array(z.string())
  .optional()
  .describe('Optional array of strings');

/**
 * Optional tag array
 * Used for: Optional tagging, optional categorization
 * Common in: Secondary tags, optional keywords
 */
export const optionalTagArray = z
  .array(z.string())
  .default([])
  .optional()
  .describe('Optional tag array with empty default');

/**
 * Small array of short strings (max 10 items, max 100 chars each)
 * Used for: Compact lists like badges, labels, small features
 * Common in: UI components, metadata badges
 */
export const compactStringArray = z
  .array(shortString)
  .max(10)
  .describe('Compact list for badges and labels (max 10 items, 100 chars each)');

/**
 * Large content array (max 50 items, up to 500 chars each)
 * Used for: Extensive lists like all features, full capabilities
 * Common in: Complete feature sets, all use cases
 */
export const largeContentArray = z
  .array(mediumString)
  .max(50)
  .describe('Large content collection for complete feature sets (max 50 items, 500 chars each)');
