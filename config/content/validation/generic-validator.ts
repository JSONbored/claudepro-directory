/**
 * Generic Content Validator
 *
 * Single validation function for ALL content categories.
 * Eliminates duplication across statuslines, hooks, MCP, commands, rules, etc.
 *
 * Architecture:
 * - Takes schema + category as parameters
 * - Executes 6-step validation process
 * - Uses category-specific config for required fields
 * - Optional category-specific validation plugins
 *
 * Replaces:
 * - validateStatuslineContent (410 lines)
 * - validateHookContent (410 lines)
 * - validateMcpContent (491 lines)
 * - And 8 more that would have been created
 *
 * Net result: ~4,000 lines deleted, ~200 lines added
 *
 * @module config/content/validation/generic-validator
 */

import type { z } from 'zod';
import { FAQ_GENERATION_RULES } from '@/config/seo/enrichment/category-rules';
import type { CategoryId } from '@/src/lib/config/category-types';
import { validateContentSEO } from '../quality/seo-standards';

/**
 * Validation Result Type
 */
export interface ValidationResult<T = unknown> {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: T;
}

/**
 * Category-Specific Validator Plugin
 *
 * Optional function for category-specific validation logic.
 * Used for validations that can't be generalized (e.g., MCP platform config).
 */
export type CategoryValidator = (validated: any, errors: string[], warnings: string[]) => void;

/**
 * Category Validation Config
 *
 * Configuration for validating a specific category.
 */
export interface CategoryValidationConfig {
  requiredFields: readonly string[];
  optionalButRecommended?: readonly string[];
  categorySpecificValidator?: CategoryValidator;
}

/**
 * Generic Content Validator
 *
 * Validates content for ANY category using a 6-step process:
 * 1. Schema validation (using provided Zod schema)
 * 2. SEO validation (description, keywords)
 * 3. FAQ/Troubleshooting validation (min/max entries, quality)
 * 4. Completeness validation (required fields)
 * 5. Category-specific validation (optional plugin)
 * 6. Date validation (checks for old/future dates)
 *
 * @param content - Content to validate
 * @param category - Category ID (statuslines, hooks, mcp, etc.)
 * @param schema - Zod schema for this category
 * @param config - Validation configuration for this category
 * @returns Validation result with errors, warnings, and validated data
 */
export function validateContent<T>(
  content: unknown,
  category: CategoryId,
  schema: z.ZodSchema<T>,
  config: CategoryValidationConfig
): ValidationResult<T> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ========================================
  // STEP 0: Discovery Metadata Validation (BLOCKING)
  // ========================================
  // Check if content has discoveryMetadata before running schema validation
  // This ensures discovery workflow is followed BEFORE any content creation
  const rawContent = content as any;
  if (!rawContent.discoveryMetadata) {
    errors.push('🚨 BLOCKING: discoveryMetadata is REQUIRED');
    errors.push('');
    errors.push('Content cannot be created without discovery research evidence.');
    errors.push('');
    errors.push('You MUST run the discovery workflow first:');
    errors.push('  1. discover_trending_topics → Search 2+ sources (GitHub, Reddit, HN, dev.to)');
    errors.push('  2. keyword_research → Validate search volume and competition');
    errors.push('  3. gap_analysis → Identify what gap this fills vs existing content');
    errors.push('  4. User approval → Get explicit approval of topic BEFORE drafting');
    errors.push('');
    errors.push('The discoveryMetadata field must include:');
    errors.push('  - researchDate: When research was conducted');
    errors.push('  - trendingSources: Min 2 sources with evidence');
    errors.push('  - keywordResearch: Search volume and competition data');
    errors.push('  - gapAnalysis: What gap this fills');
    errors.push('  - approvalRationale: Why this topic (100-500 chars)');
    return { valid: false, errors, warnings };
  }

  // ========================================
  // STEP 1: Schema Validation
  // ========================================
  const schemaValidation = schema.safeParse(content);

  if (!schemaValidation.success) {
    errors.push('Schema Validation Failed:');
    for (const error of schemaValidation.error.issues) {
      // Check if this is a required field error (missing/undefined)
      const isRequired = error.code === 'invalid_type' && error.message.includes('undefined');
      const prefix = isRequired ? 'Required field' : error.path.join('.');
      errors.push(`  - ${prefix}: ${error.message}`);
    }
    return { valid: false, errors, warnings };
  }

  const validated = schemaValidation.data as any;

  // ========================================
  // STEP 2: SEO Validation
  // ========================================
  const seoValidation = validateContentSEO(
    {
      seoTitle: validated.seoTitle, // Optional - some categories don't have this
      description: validated.description,
      tags: validated.tags,
    },
    category
  );

  if (!seoValidation.valid) {
    errors.push('SEO Validation Failed:');
    errors.push(...seoValidation.errors.map((e) => `  - ${e}`));
  }
  warnings.push(...seoValidation.warnings.map((w) => `  - ${w}`));

  // ========================================
  // STEP 3: FAQ/Troubleshooting Validation
  // ========================================
  if (validated.troubleshooting) {
    const faqRules = FAQ_GENERATION_RULES[category];

    if (faqRules) {
      if (validated.troubleshooting.length < faqRules.minQuestions) {
        errors.push(
          `Troubleshooting: Must have at least ${faqRules.minQuestions} entries (found ${validated.troubleshooting.length})`
        );
      }

      if (validated.troubleshooting.length > faqRules.maxQuestions) {
        errors.push(
          `Troubleshooting: Must not exceed ${faqRules.maxQuestions} entries (found ${validated.troubleshooting.length})`
        );
      }

      // Validate each FAQ entry quality
      for (const [index, faq] of validated.troubleshooting.entries()) {
        if (faq.issue.length < 40) {
          errors.push(
            `Troubleshooting[${index}].issue: Too short (${faq.issue.length} < 40 chars)`
          );
        }
        if (faq.issue.length > 80) {
          errors.push(`Troubleshooting[${index}].issue: Too long (${faq.issue.length} > 80 chars)`);
        }
        if (faq.solution.length < 100) {
          errors.push(
            `Troubleshooting[${index}].solution: Too short (${faq.solution.length} < 100 chars)`
          );
        }
        if (faq.solution.length > 200) {
          errors.push(
            `Troubleshooting[${index}].solution: Too long (${faq.solution.length} > 200 chars)`
          );
        }
      }
    }
  } else {
    // Check if troubleshooting is required for this category
    const faqRules = FAQ_GENERATION_RULES[category];
    if (faqRules?.enabled) {
      errors.push('Troubleshooting: Required field is missing');
    }
  }

  // ========================================
  // STEP 4: Completeness Validation
  // ========================================
  for (const field of config.requiredFields) {
    const value = validated[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`Required: ${field} is missing or empty`);
    }
  }

  // ========================================
  // STEP 5: Category-Specific Validation
  // ========================================
  if (config.categorySpecificValidator) {
    config.categorySpecificValidator(validated, errors, warnings);
  }

  // ========================================
  // STEP 6: Date Validation
  // ========================================
  if (validated.dateAdded) {
    const dateAdded = new Date(validated.dateAdded);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const addedYear = dateAdded.getFullYear();

    // Warn if date is in the past (more than 7 days ago)
    const daysDiff = Math.floor(
      (currentDate.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 7) {
      warnings.push(
        `Date: dateAdded is ${daysDiff} days in the past. Should use getCurrentDateISO() for current date.`
      );
    }

    // Warn if date is in the future
    if (daysDiff < 0) {
      warnings.push('Date: dateAdded is in the future. Check date generation logic.');
    }

    // Warn if year is significantly old
    if (currentYear - addedYear > 0) {
      warnings.push(
        `Date: dateAdded year is ${addedYear} but current year is ${currentYear}. Use getCurrentDateISO().`
      );
    }
  }

  // ========================================
  // Return Result
  // ========================================
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? (validated as T) : undefined,
  };
}

/**
 * Format Validation Result for User Display
 *
 * Generic formatter that works for any category.
 *
 * @param result - Validation result
 * @param category - Category being validated
 * @returns Formatted report string
 */
export function formatValidationReport(result: ValidationResult, category: CategoryId): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✅ VALIDATION PASSED\n');
    lines.push('All checks completed successfully.');
  } else {
    lines.push('❌ VALIDATION FAILED\n');
    lines.push(`Found ${result.errors.length} error(s):\n`);
    lines.push(...result.errors);
  }

  if (result.warnings.length > 0) {
    lines.push('\n⚠️ WARNINGS:');
    lines.push(...result.warnings);
  }

  if (result.data) {
    lines.push('\n📊 Content Summary:');
    lines.push(`  - Category: ${category}`);
    lines.push(`  - Slug: ${result.data.slug || 'N/A'}`);

    // Category-specific summary fields
    if ('seoTitle' in result.data && result.data.seoTitle) {
      lines.push(`  - SEO Title: ${result.data.seoTitle} (${result.data.seoTitle.length} chars)`);
    }
    if ('description' in result.data) {
      lines.push(`  - Description: ${result.data.description.length} chars`);
    }
    if ('tags' in result.data && Array.isArray(result.data.tags)) {
      lines.push(`  - Tags: ${result.data.tags.length} tags`);
    }
    if ('troubleshooting' in result.data && Array.isArray(result.data.troubleshooting)) {
      lines.push(`  - Troubleshooting: ${result.data.troubleshooting.length} entries`);
    }
    if ('features' in result.data && Array.isArray(result.data.features)) {
      lines.push(`  - Features: ${result.data.features.length} items`);
    }
    if ('useCases' in result.data && Array.isArray(result.data.useCases)) {
      lines.push(`  - Use Cases: ${result.data.useCases.length} items`);
    }
  }

  return lines.join('\n');
}
