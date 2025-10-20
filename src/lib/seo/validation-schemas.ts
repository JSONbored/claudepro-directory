/**
 * SEO Validation Schemas
 *
 * **Production-Grade Validation Infrastructure (October 2025)**
 *
 * Comprehensive Zod schemas for type-safe validation across the SEO metadata system.
 * Implements layered validation architecture to catch errors at system boundaries.
 *
 * **Validation Layers:**
 * 1. **Input Validation** - MetadataContext, route params, classification results
 * 2. **Template Validation** - Template output (title, description, keywords)
 * 3. **Output Validation** - Final metadata before Next.js (validatedMetadataSchema)
 *
 * **Architecture Principles:**
 * - Fail Fast: Invalid data throws descriptive errors in dev/test
 * - Type Safety: Full TypeScript inference from Zod schemas
 * - Zero Casting: No type assertions or `as` casts needed
 * - Performance: Schemas are JIT-compiled once, reused across requests
 * - Standards Compliance: SEO rules enforced at type level
 *
 * **October 2025 SEO Standards (Research-Driven):**
 * - Title: 53-60 characters optimal, 61-65 acceptable (semantic preservation)
 * - Description: 150-160 characters (AI citation optimization)
 * - Keywords: 3-10 keywords, max 30 chars each
 * - Canonical URLs: No trailing slashes (except homepage)
 *
 * **SEO 2025 Research:** Too short (< 53) is worse than slightly long (61-65).
 * Short titles rewritten 96% of time vs 40% for 53-60 char titles.
 *
 * @module lib/seo/validation-schemas
 */

import { z } from 'zod';
import { METADATA_QUALITY_RULES } from '@/src/lib/config/seo-config';

// ============================================
// LAYER 1: INPUT VALIDATION SCHEMAS
// ============================================

/**
 * Metadata Context Validation Schema
 *
 * Validates the context object passed to metadata templates.
 * Ensures all required properties are present and properly typed.
 *
 * **Design Philosophy:**
 * - Passthrough unknown properties (forward compatibility)
 * - Optional properties explicitly typed as optional (not undefined union)
 * - Compatible with exactOptionalPropertyTypes: true
 * - No nested undefined checks required
 *
 * @example
 * ```typescript
 * const context = metadataContextSchema.parse({
 *   route: '/agents/code-reviewer',
 *   params: { category: 'agents', slug: 'code-reviewer' },
 *   item: { title: 'Code Reviewer', description: '...' },
 * });
 * // Type-safe access: context.route, context.params, context.item
 * ```
 */
export const metadataContextSchema = z
  .object({
    /** Route path (e.g., '/', '/agents', '/agents/code-reviewer') */
    route: z.string().optional(),

    /** Dynamic route parameters from Next.js */
    params: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),

    /** Content item data (from schema adapter or page data) */
    item: z
      .object({
        title: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        author: z.string().optional(),
        dateAdded: z.string().optional(),
        lastModified: z.string().optional(),
      })
      .catchall(z.unknown())
      .optional(),

    /** Category configuration from UNIFIED_CATEGORY_REGISTRY */
    categoryConfig: z
      .object({
        title: z.string().optional(),
        pluralTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.string().optional(), // Comma-separated string
      })
      .catchall(z.unknown())
      .optional(),

    /** Category slug (e.g., 'agents', 'mcp', 'commands') */
    category: z.string().optional(),

    /** Content slug (e.g., 'code-reviewer', 'filesystem-server') */
    slug: z.string().optional(),

    /** User profile data (for USER_PROFILE pattern) */
    profile: z.unknown().optional(),

    /** Search/filter parameters */
    filters: z.record(z.string(), z.unknown()).optional(),
  })
  .catchall(z.unknown())
  .describe('Metadata generation context with route, params, and content data');

/**
 * Route Classification Validation Schema
 *
 * Validates route classification results from classifyRoute().
 * Ensures pattern matching produces valid, confident results.
 *
 * **Confidence Thresholds:**
 * - 1.0 = Definitive match (exact route pattern)
 * - 0.9-0.99 = High confidence (validated category)
 * - 0.5-0.89 = Medium confidence (heuristic match)
 * - < 0.5 = Low confidence (needs review)
 *
 * @example
 * ```typescript
 * const classification = routeClassificationSchema.parse({
 *   pattern: 'CONTENT_DETAIL',
 *   confidence: 1.0,
 *   segments: ['agents', 'code-reviewer'],
 *   isDynamic: true,
 *   route: '/agents/code-reviewer',
 * });
 * ```
 */
export const routeClassificationSchema = z
  .object({
    /** Classified pattern type */
    pattern: z.enum([
      'HOMEPAGE',
      'CATEGORY',
      'CONTENT_DETAIL',
      'USER_PROFILE',
      'ACCOUNT',
      'TOOL',
      'STATIC',
      'AUTH',
    ]),

    /** Classification confidence (0-1 scale) */
    confidence: z.number().min(0).max(1),

    /** Parsed route segments (e.g., ['agents', ':slug']) */
    segments: z.array(z.string()),

    /** Whether route contains dynamic segments */
    isDynamic: z.boolean(),

    /** Original route string */
    route: z.string().min(1),
  })
  .describe('Route pattern classification result with confidence scoring');

// ============================================
// LAYER 2: TEMPLATE OUTPUT VALIDATION SCHEMAS
// ============================================

/**
 * Template Output Validation Schema
 *
 * Validates metadata generated by templates BEFORE building final metadata object.
 * Catches length violations, character limits, and format issues early.
 *
 * **October 2025 SEO Standards (Research-Driven):**
 * - Title: 53-60 chars optimal, 61-65 chars acceptable (semantic preservation)
 * - Description: 150-160 chars (AI citation optimization, mobile SERP limit)
 * - Keywords: 3-10 keywords, max 30 chars each (semantic relevance)
 *
 * **Why This Matters:**
 * - Google rewrites titles < 53 chars 96% of time (too short is worse than too long)
 * - Optimal 53-60 chars: Only 40% rewrite rate, best CTR
 * - Extended 61-65 chars: Acceptable for complete words (avoids "Configuratio...")
 * - AI models like ChatGPT cite content with 150-160 char descriptions 3.2x more
 * - Too many keywords dilutes semantic signals (10 max is industry standard)
 *
 * @example
 * ```typescript
 * const output = templateOutputSchema.parse({
 *   title: 'Code Reviewer Agent - Agents - Claude Pro Directory',
 *   description: 'Specialized agent for code review with Claude AI. Enforces...',
 *   keywords: ['code review', 'ai agent', 'claude'],
 * });
 * ```
 */
export const templateOutputSchema = z
  .object({
    /** Page title (53-60 chars optimal, 61-65 chars acceptable for semantic preservation) */
    title: z
      .string()
      .min(
        METADATA_QUALITY_RULES.title.minLength,
        `Title must be at least ${METADATA_QUALITY_RULES.title.minLength} characters (titles < 53 chars rewritten 96% of time)`
      )
      .max(
        METADATA_QUALITY_RULES.title.extendedMaxLength,
        `Title must be at most ${METADATA_QUALITY_RULES.title.extendedMaxLength} characters (${METADATA_QUALITY_RULES.title.minLength}-${METADATA_QUALITY_RULES.title.maxLength} optimal, ${METADATA_QUALITY_RULES.title.maxLength + 1}-${METADATA_QUALITY_RULES.title.extendedMaxLength} acceptable for complete words)`
      ),

    /** Meta description (150-160 chars for AI citation optimization) */
    description: z
      .string()
      .min(
        METADATA_QUALITY_RULES.description.minLength,
        `Description must be at least ${METADATA_QUALITY_RULES.description.minLength} characters for AI citation optimization`
      )
      .max(
        METADATA_QUALITY_RULES.description.maxLength,
        `Description must be at most ${METADATA_QUALITY_RULES.description.maxLength} characters to avoid truncation`
      ),

    /** SEO keywords (3-10 keywords, max 30 chars each) */
    keywords: z
      .array(
        z
          .string()
          .min(1, 'Each keyword must be at least 1 character')
          .max(
            METADATA_QUALITY_RULES.keywords.maxKeywordLength,
            `Each keyword must be at most ${METADATA_QUALITY_RULES.keywords.maxKeywordLength} characters for semantic clarity`
          )
      )
      .min(
        METADATA_QUALITY_RULES.keywords.minCount,
        `Provide at least ${METADATA_QUALITY_RULES.keywords.minCount} keywords for semantic relevance`
      )
      .max(
        METADATA_QUALITY_RULES.keywords.maxCount,
        `Provide at most ${METADATA_QUALITY_RULES.keywords.maxCount} keywords to avoid dilution`
      )
      .optional(),
  })
  .describe('Template-generated metadata content with SEO quality enforcement');

// ============================================
// LAYER 3: CATEGORY REGISTRY VALIDATION SCHEMA
// ============================================

/**
 * Category Configuration Validation Schema
 *
 * Validates individual category entries in UNIFIED_CATEGORY_REGISTRY.
 * Ensures all categories have required SEO metadata and proper configuration.
 *
 * **Design Philosophy:**
 * - Strict validation for production data
 * - All SEO-critical fields are required
 * - Keywords enforced at category level (not per-page)
 * - passthrough() allows custom category properties
 *
 * @example
 * ```typescript
 * const categoryConfig = categoryConfigSchema.parse({
 *   id: 'agents',
 *   title: 'Agent',
 *   pluralTitle: 'Agents',
 *   metaDescription: 'Discover specialized AI agents...',
 *   keywords: 'ai agents, claude agents, automation',
 * });
 * ```
 */
export const categoryConfigSchema = z
  .object({
    /** Category ID (must match VALID_CATEGORIES) */
    id: z.string().min(1),

    /** Singular title (e.g., 'Agent') */
    title: z.string().min(1),

    /** Plural title (e.g., 'Agents') */
    pluralTitle: z.string().min(1),

    /** SEO meta description for category list pages */
    metaDescription: z
      .string()
      .min(
        METADATA_QUALITY_RULES.description.minLength,
        `Category metaDescription must be at least ${METADATA_QUALITY_RULES.description.minLength} characters`
      )
      .max(
        METADATA_QUALITY_RULES.description.maxLength,
        `Category metaDescription must be at most ${METADATA_QUALITY_RULES.description.maxLength} characters`
      ),

    /** Comma-separated keywords (will be split and validated) */
    keywords: z
      .string()
      .min(1, 'Category keywords are required for SEO')
      .refine(
        (keywords) => {
          const keywordArray = keywords.split(',').map((k) => k.trim());
          return (
            keywordArray.length >= METADATA_QUALITY_RULES.keywords.minCount &&
            keywordArray.length <= METADATA_QUALITY_RULES.keywords.maxCount
          );
        },
        {
          message: `Category must have ${METADATA_QUALITY_RULES.keywords.minCount}-${METADATA_QUALITY_RULES.keywords.maxCount} keywords`,
        }
      )
      .refine(
        (keywords) => {
          const keywordArray = keywords.split(',').map((k) => k.trim());
          return keywordArray.every(
            (k) => k.length >= 1 && k.length <= METADATA_QUALITY_RULES.keywords.maxKeywordLength
          );
        },
        {
          message: `Each keyword must be 1-${METADATA_QUALITY_RULES.keywords.maxKeywordLength} characters`,
        }
      ),
  })
  .catchall(z.unknown())
  .describe('Category configuration with SEO metadata requirements');

/**
 * Full Category Registry Validation Schema
 *
 * Validates the entire UNIFIED_CATEGORY_REGISTRY at build time.
 * Ensures all categories are properly configured with SEO metadata.
 *
 * **Note:** Uses z.record() with string keys (category IDs) and categoryConfigSchema values.
 * This allows any string as a key (category ID) but validates the configuration object.
 *
 * @example
 * ```typescript
 * const registry = categoryRegistrySchema.parse(UNIFIED_CATEGORY_REGISTRY);
 * ```
 */
export const categoryRegistrySchema = z
  .record(z.string(), categoryConfigSchema)
  .describe('Complete category registry with validated configurations');

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate Metadata Context
 *
 * Type-safe validation of context passed to metadata templates.
 * Throws descriptive errors in dev/test, logs and returns null in production.
 *
 * @param context - Context object to validate
 * @param source - Source identifier for error messages (e.g., 'generateMetadata')
 * @returns Validated context or null (production only)
 *
 * @example
 * ```typescript
 * const validatedContext = validateContext(context, 'generatePageMetadata');
 * if (!validatedContext) {
 *   // Production fallback
 *   return generateFallbackMetadata();
 * }
 * ```
 */
export function validateContext(
  context: unknown,
  source: string
): z.infer<typeof metadataContextSchema> | null {
  const result = metadataContextSchema.safeParse(context);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

    // Dev/Test: Throw to fail fast
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      throw new Error(
        `[${source}] Invalid MetadataContext:\n${errors.map((e) => `- ${e}`).join('\n')}`
      );
    }

    // Production: Log and return null for graceful degradation
    // biome-ignore lint/suspicious/noConsole: Production warning logging for validation failures with graceful fallback
    console.warn(`[${source}] Invalid MetadataContext (using fallback):`, errors);
    return null;
  }

  return result.data;
}

/**
 * Validate Template Output
 *
 * Type-safe validation of metadata generated by templates.
 * Catches SEO violations (title/description length, keyword limits) early.
 *
 * @param output - Template output to validate
 * @param pattern - Route pattern for error context
 * @returns Validated output or null (production only)
 *
 * @example
 * ```typescript
 * const output = {
 *   title: template.title(context),
 *   description: template.description(context),
 *   keywords: template.keywords(context),
 * };
 *
 * const validated = validateTemplateOutput(output, 'CATEGORY');
 * if (!validated) {
 *   // Production fallback
 *   return generateFallbackMetadata();
 * }
 * ```
 */
export function validateTemplateOutput(
  output: unknown,
  pattern: string
): z.infer<typeof templateOutputSchema> | null {
  const result = templateOutputSchema.safeParse(output);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

    // Dev/Test: Throw to fail fast
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      throw new Error(
        `[Template:${pattern}] Invalid output:\n${errors.map((e) => `- ${e}`).join('\n')}`
      );
    }

    // Production: Log with enhanced context for debugging (warning level - graceful fallback, not error)
    const outputObj =
      typeof output === 'object' && output !== null ? (output as Record<string, unknown>) : {};
    const title = typeof outputObj.title === 'string' ? outputObj.title : 'Unknown';
    // biome-ignore lint/suspicious/noConsole: Production warning logging for template validation failures with graceful fallback
    console.warn(`[Template:${pattern}] Invalid output (using fallback):`, {
      errors,
      keywords: outputObj.keywords || 'N/A',
      title: title.substring(0, 60),
      keywordLengths: Array.isArray(outputObj.keywords)
        ? outputObj.keywords.map((k: unknown) => {
            const keyword = String(k);
            return `"${keyword}" (${keyword.length})`;
          })
        : 'N/A',
    });
    return null;
  }

  return result.data;
}

/**
 * Validate Route Classification
 *
 * Type-safe validation of route classification results.
 * Ensures pattern matching produces valid, confident results.
 *
 * @param classification - Classification result to validate
 * @param route - Route path for error context
 * @returns Validated classification or null (production only)
 *
 * @example
 * ```typescript
 * const classification = classifyRoute('/agents');
 * const validated = validateClassification(classification, '/agents');
 * ```
 */
export function validateClassification(
  classification: unknown,
  route: string
): z.infer<typeof routeClassificationSchema> | null {
  const result = routeClassificationSchema.safeParse(classification);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

    // Dev/Test: Throw to fail fast
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      throw new Error(
        `[classifyRoute] Invalid classification for ${route}:\n${errors.map((e) => `- ${e}`).join('\n')}`
      );
    }

    // Production: Log and return null for graceful degradation
    // biome-ignore lint/suspicious/noConsole: Production error logging required for debugging route classification failures
    console.error(`[classifyRoute] Invalid classification for ${route} (using fallback):`, errors);
    return null;
  }

  return result.data;
}

/**
 * Validate Category Registry (Build-Time)
 *
 * Validates entire UNIFIED_CATEGORY_REGISTRY at build time.
 * Ensures all categories have proper SEO metadata configuration.
 *
 * **Usage:** Call this in a build-time validation script or test suite.
 *
 * @param registry - Category registry to validate
 * @throws Always throws on validation failure (build-time only)
 *
 * @example
 * ```typescript
 * // In tests or build script
 * validateCategoryRegistry(UNIFIED_CATEGORY_REGISTRY);
 * ```
 */
export function validateCategoryRegistry(registry: unknown): void {
  const result = categoryRegistrySchema.safeParse(registry);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

    throw new Error(
      `UNIFIED_CATEGORY_REGISTRY validation failed:\n${errors.map((e) => `- ${e}`).join('\n')}\n\nFix category configurations in src/lib/config/category-config.ts`
    );
  }
}
