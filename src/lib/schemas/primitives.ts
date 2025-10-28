/**
 * Base Validation Primitives
 *
 * Centralized validators to eliminate duplication across schemas.
 * Consolidates: base-strings, base-numbers, base-arrays, ui-component-primitives, performance-primitives
 *
 * Usage Statistics (before consolidation):
 * - z.string().min(1): 111+ instances
 * - z.string().max(N): 177+ instances
 * - z.string().url(): 61+ instances
 * - z.number().int(): 50+ instances
 * - z.array(z.string()): 65+ instances
 *
 * Production Standards:
 * - All exports properly typed
 * - JSDoc with use cases
 * - Security-first validation
 */

import { z } from 'zod';
import { SECURITY_CONFIG } from '@/src/lib/constants/security';

// ============================================================================
// STRING PRIMITIVES
// ============================================================================

/**
 * Non-empty string validator
 * Used for: Required text fields, names, titles, descriptions
 * Replaces: z.string().min(1) (111+ instances)
 */
export const nonEmptyString = z.string().min(1).describe('Required non-empty text field');

/**
 * Short string validator (1-100 chars)
 * Used for: Titles, names, labels, tags, badges
 * Common in: UI components, metadata, categories
 */
export const shortString = z
  .string()
  .min(1)
  .max(100)
  .describe('Short text field for titles, names, and labels (1-100 chars)');

/**
 * Medium string validator (1-500 chars)
 * Used for: Descriptions, summaries, error messages, steps
 * Common in: Content schemas, installation instructions
 */
export const mediumString = z
  .string()
  .min(1)
  .max(500)
  .describe('Medium text field for descriptions and summaries (1-500 chars)');

/**
 * Long string validator (1-2000 chars)
 * Used for: Full content, detailed descriptions, documentation
 * Common in: Content body fields, guides, solutions
 */
export const longString = z
  .string()
  .min(1)
  .max(2000)
  .describe('Long text field for detailed content and documentation (1-2000 chars)');

/**
 * Extra long string validator (1-5000 chars)
 * Used for: Extended content, FAQs, answers, full documentation
 * Common in: Guide content, comprehensive descriptions
 */
export const extraLongString = z
  .string()
  .min(1)
  .max(5000)
  .describe('Extra long text field for extended content and FAQs (1-5000 chars)');

/**
 * URL string validator
 * Used for: Links, image sources, documentation URLs, GitHub URLs
 * Replaces: z.string().url() (61+ instances)
 * Common in: All content schemas, metadata, social sharing
 */
export const urlString = z.string().url().describe('Valid URL string for links and resources');

/**
 * ISO date string validator
 * Used for: Date fields (dateAdded, dateModified, lastUpdated, etc.)
 * Common in: All content schemas, timestamps, metadata
 */
export const isoDateString = z.string().describe('ISO date string for date fields');

/**
 * ISO datetime string validator (strict)
 * Used for: Precise timestamps with time component
 * Common in: Analytics, cache entries, trending items
 */
export const isoDatetimeString = z
  .string()
  .datetime()
  .describe('Strict ISO datetime string with time component');

/**
 * Slug string validator
 * Pattern: lowercase alphanumeric + hyphens (no consecutive hyphens)
 * Used for: URL-safe identifiers, content slugs, routing
 * Single source of truth for slug validation across the codebase
 */
export const slugString = z
  .string()
  .min(1, 'Slug cannot be empty')
  .max(100, 'Slug too long (max 100 characters)')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Invalid slug: use lowercase letters, numbers, and single hyphens'
  )
  .transform((val) => val.toLowerCase())
  .describe(
    'URL-safe slug identifier (lowercase alphanumeric with hyphens, no consecutive hyphens)'
  );

/**
 * Optional URL string
 * Used for: Optional link fields
 * Common in: Documentation links, GitHub URLs, image sources
 */
export const optionalUrlString = z
  .string()
  .url()
  .optional()
  .describe('Optional URL field for links');

/**
 * Code/command string validator (1-1000 chars)
 * Used for: Code snippets, shell commands, configuration strings
 * Common in: Installation steps, examples, scripts
 */
export const codeString = z
  .string()
  .min(1)
  .max(1000)
  .describe('Code snippet or command string (1-1000 chars)');

/**
 * Very long code/content string validator (1-10000 chars)
 * Used for: Full code examples, large configuration blocks
 * Common in: Code examples, full scripts, large content blocks
 */
export const veryLongCodeString = z
  .string()
  .min(1)
  .max(10000)
  .describe('Large code block or configuration (1-10000 chars)');

/**
 * Ultra long content string validator (1-50000 chars)
 * Used for: Complete MDX content, full documentation, large schemas
 * Common in: Guide content, full documentation pages
 */
export const ultraLongString = z
  .string()
  .min(1)
  .max(50000)
  .describe('Complete MDX content or full documentation (1-50000 chars)');

/**
 * Massive content string validator (1-1000000 chars / 1MB)
 * Used for: Hook script content, extremely large content blocks
 * Common in: Hook configurations, massive data structures
 */
export const massiveString = z
  .string()
  .max(1000000)
  .describe('Extremely large content block up to 1MB (hook scripts, massive data)');

/**
 * GitHub URL validator with strict hostname validation
 *
 * Validates URLs to ensure they point to github.com or www.github.com.
 * Uses SECURITY_CONFIG.trustedHostnames.github for security.
 *
 * Used for: Repository links, source code URLs, project references
 * Common in: Agent schemas, command schemas, rule schemas
 *
 * **Security:** Only allows whitelisted GitHub hostnames to prevent phishing
 * **Replaces:** Duplicate validation logic in command.schema.ts and rule.schema.ts (32 lines)
 *
 * @example
 * ```typescript
 * // Valid
 * githubUrl.parse('https://github.com/anthropics/claude-code')
 * githubUrl.parse('https://www.github.com/org/repo')
 *
 * // Invalid - throws ZodError
 * githubUrl.parse('https://github.evil.com/fake')
 * githubUrl.parse('https://guthub.com/typo')
 * ```
 */
export const githubUrl = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        return SECURITY_CONFIG.trustedHostnames.github.includes(
          urlObj.hostname as 'github.com' | 'www.github.com'
        );
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid GitHub URL (github.com or www.github.com)' }
  )
  .describe('Validated GitHub repository URL (github.com or www.github.com only)');

/**
 * Optional GitHub URL validator
 * Optional variant of githubUrl for fields where GitHub link is not required
 *
 * Used for: Optional repository links, optional source references
 * Common in: Content schemas where GitHub URL is optional metadata
 */
export const optionalGithubUrl = githubUrl.optional();

// ============================================================================
// NUMBER PRIMITIVES
// ============================================================================

/**
 * Positive integer validator
 * Used for: Counts, IDs, token limits, timeouts
 * Common in: Configuration, API limits, pagination
 */
export const positiveInt = z
  .number()
  .int()
  .positive()
  .describe('Positive integer for counts, IDs, and limits');

/**
 * Non-negative integer validator (includes 0)
 * Used for: Counters, offsets, error counts, resource counts
 * Common in: Pagination, analytics, performance metrics
 */
export const nonNegativeInt = z
  .number()
  .int()
  .min(0)
  .describe('Non-negative integer including zero for counters and offsets');

/**
 * Percentage validator (0-100)
 * Used for: Popularity scores, progress, ratings
 * Common in: Content metadata, analytics, metrics
 */
export const percentage = z
  .number()
  .min(0)
  .max(100)
  .describe('Percentage value from 0-100 for scores and progress');

/**
 * Temperature validator (0-2) for AI models
 * Used for: AI model temperature configuration
 * Common in: Agent, command, rule configurations
 */
export const aiTemperature = z
  .number()
  .min(0)
  .max(2)
  .describe('AI model temperature parameter (0-2)');

/**
 * Timeout validator (100-300000ms / 0.1s-5min)
 * Used for: Hook timeouts, request timeouts
 * Common in: Hook configurations, API calls
 */
export const timeoutMs = z
  .number()
  .int()
  .min(100)
  .max(300000)
  .describe('Timeout in milliseconds (100ms-5min)');

/**
 * Image dimension validator (200-2000px)
 * Used for: Image width/height in OpenGraph, metadata
 * Common in: SEO schemas, image metadata
 */
export const imageDimension = z
  .number()
  .int()
  .min(200)
  .max(2000)
  .describe('Image dimension in pixels (200-2000px)');

/**
 * View count validator (non-negative integer)
 * Used for: Page views, content views, engagement metrics
 * Common in: Analytics, trending content
 */
export const viewCount = z
  .number()
  .int()
  .min(0)
  .describe('View count for page views and engagement metrics');

/**
 * Optional positive integer
 * Used for: Optional configuration values, optional limits
 * Common in: AI configuration, pagination, optional settings
 */
export const optionalPositiveInt = z
  .number()
  .int()
  .positive()
  .optional()
  .describe('Optional positive integer for configuration values');

// ============================================================================
// ARRAY PRIMITIVES
// ============================================================================

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
 * Required tag array (minimum 1 item)
 * Used for: Mandatory tagging, required categorization
 * Common in: Content schemas where tags are required
 */
export const requiredTagArray = z
  .array(nonEmptyString)
  .min(1)
  .describe('Required tag array with minimum 1 item');

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
 * Examples array (max 10 items)
 * Used for: Code examples, usage examples
 * Common in: Documentation, command examples, rule examples
 */
export const examplesArray = z
  .array(z.string().max(1000))
  .max(10)
  .describe('Code or usage examples (max 10 items, 1000 chars each)');

/**
 * Large content array (max 50 items, up to 500 chars each)
 * Used for: Extensive lists like all features, full capabilities
 * Common in: Complete feature sets, all use cases
 */
export const largeContentArray = z
  .array(mediumString)
  .max(50)
  .describe('Large content collection for complete feature sets (max 50 items, 500 chars each)');

// ============================================================================
// UI COMPONENT PRIMITIVES
// ============================================================================

/**
 * Component title string (1-200 chars)
 * Used in: Accordions, step guides, tabs, code groups, comparison tables, etc.
 * Usage count: 8+ UI components
 */
export const componentTitleString = z.string().min(1).max(200);

/**
 * Component label string (1-50 chars)
 * Used in: Tab labels, quick reference items, metric labels, feature badges
 * Usage count: 6+ UI components
 */
export const componentLabelString = z.string().min(1).max(50);

/**
 * Component description string (max 300 chars, optional)
 * Used in: All major UI components for additional context
 * Usage count: 12+ UI components
 */
export const componentDescriptionString = z.string().max(300).optional();

/**
 * Component value string (max 50 chars)
 * Used in: Tags, values, metrics, winners, badges
 * Usage count: 11+ UI components
 */
export const componentValueString = z.string().max(50);

/**
 * Component time string (max 20 chars, optional)
 * Used in: Step guides, time estimates, durations
 * Usage count: 2+ UI components
 */
export const componentTimeString = z.string().max(20).optional();

// ============================================================================
// PERFORMANCE & ERROR PRIMITIVES
// ============================================================================

/**
 * Stack trace length limit
 */
export const MAX_STACK_TRACE_LENGTH = 5000;

/**
 * Error type validator
 * Used for: Error categorization, error tracking
 * Common in: Error monitoring, error-handler.ts
 */
const errorType = nonEmptyString
  .max(100)
  .transform((val) => val.replace(/[^\w\s-]/g, ''))
  .describe('Error type identifier for categorization and tracking');

/**
 * Error severity validator
 * Used for: Error priority, incident management
 * Common in: Error tracking, monitoring systems
 */
const errorSeverity = z
  .enum(['low', 'medium', 'high', 'critical'])
  .default('medium')
  .describe('Error severity level for incident priority management');

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ComponentTitleString = z.infer<typeof componentTitleString>;
export type ComponentLabelString = z.infer<typeof componentLabelString>;
export type ComponentDescriptionString = z.infer<typeof componentDescriptionString>;
export type ComponentValueString = z.infer<typeof componentValueString>;
export type ComponentTimeString = z.infer<typeof componentTimeString>;
export type ErrorType = z.infer<typeof errorType>;
export type ErrorSeverity = z.infer<typeof errorSeverity>;
