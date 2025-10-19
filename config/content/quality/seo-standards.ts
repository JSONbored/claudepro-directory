/**
 * SEO Standards for Content Generation
 *
 * Integrates with existing seo-config.ts - ZERO duplication.
 * Imports all standards from existing system and adds generation-specific context.
 *
 * Architecture:
 * - Imports from src/lib/config/seo-config.ts (single source of truth)
 * - Extends with content generation patterns
 * - Provides category-specific SEO templates
 * - Validates using existing schemas
 *
 * @module config/content/quality/seo-standards
 */

import type { CategoryId } from '@/src/lib/config/category-types';
import {
  MAX_TITLE_LENGTH,
  METADATA_QUALITY_RULES,
  OPTIMAL_MAX,
  OPTIMAL_MIN,
  validatedMetadataSchema,
} from '@/src/lib/config/seo-config';

/**
 * SEO Title Format Templates by Category
 *
 * Provides guidance for generating SEO-optimized titles.
 * All titles must validate against existing METADATA_QUALITY_RULES.
 */
export const SEO_TITLE_FORMATS = {
  statuslines: '{Type} {Technology} Statusline for Claude Code - {UniqueValue}',
  hooks: '{Event} Hook for {Purpose}',
  mcp: '{Service} MCP Server - {Capability}',
  rules: '{Framework} Rules for {Purpose}',
  commands: '{Action} Command - {Description}',
  agents: '{Purpose} Agent - {Capability}',
  skills: '{Domain} Skill - {Capability}',
  collections: '{Theme} Collection - {ItemCount} {Type}',
} as const satisfies Partial<Record<CategoryId, string>>;

/**
 * SEO Title Examples by Category
 *
 * Reference examples that meet optimal length (53-60 chars) and formatting.
 * Used for guidance during content generation.
 */
export const SEO_TITLE_EXAMPLES = {
  statuslines: [
    'Git Statusline for Claude Code - Real-time Branch Status', // 57 chars
    'Claude Code Docker Statusline - Container Health Monitor', // 57 chars
    'Kubernetes Statusline for Claude Code - Pod Monitor', // 54 chars
  ],
  hooks: [
    'PreToolUse Hook for Security Scanning & Validation', // 55 chars
    'SessionStart Hook for Environment Setup Automation', // 56 chars
    'PostToolUse Hook for Performance Monitoring', // 48 chars
  ],
  mcp: [
    'GitHub MCP Server - Repository Management & CI/CD', // 54 chars
    'Docker MCP Server - Container Orchestration Tools', // 54 chars
    'AWS MCP Server - Cloud Infrastructure Management', // 53 chars
  ],
} as const satisfies Partial<Record<CategoryId, ReadonlyArray<string>>>;

/**
 * SEO Description Templates by Category
 *
 * Structured templates for generating descriptions that meet 150-160 char requirement.
 * Format: {intro}. Features {feature1}, {feature2}, {feature3}. {cta}.
 */
export const SEO_DESCRIPTION_TEMPLATES = {
  statuslines:
    '{Technology} statusline configuration for Claude Code CLI. Features {feature1}, {feature2}, and {feature3}. Production-ready for {usecase}.',
  hooks:
    '{Event} hook for {purpose}. Automatically {action1}, {action2}, and {action3}. Production-ready script with error handling and logging.',
  mcp: '{Service} MCP server for {capability}. Provides {feature1}, {feature2}, and {feature3}. Official integration with Claude Desktop and Claude Code.',
  rules:
    '{Framework} rules for {purpose}. Enforces {rule1}, {rule2}, and {rule3}. Type-safe configuration with Zod validation and examples.',
  commands:
    '{Action} command for {purpose}. Enables {capability1}, {capability2}, and {capability3}. Markdown-based configuration with argument parsing.',
} as const satisfies Partial<Record<CategoryId, string>>;

/**
 * Required Keywords by Category
 *
 * Keywords that MUST appear in description for SEO optimization.
 * Validated during content generation.
 */
export const REQUIRED_KEYWORDS_BY_CATEGORY = {
  statuslines: ['statusline', 'CLI', 'configuration', 'Claude Code'],
  hooks: ['hook', 'automation', 'Claude Code'],
  mcp: ['MCP server', 'Claude', 'integration'],
  rules: ['rules', 'configuration', 'validation'],
  commands: ['command', 'Claude Code', 'markdown'],
  agents: ['agent', 'AI', 'automation'],
  skills: ['skill', 'Claude Code', 'capability'],
  collections: ['collection', 'bundle', 'configurations'],
} as const satisfies Partial<Record<CategoryId, ReadonlyArray<string>>>;

/**
 * SEO Standards for Content Generation
 *
 * IMPORTS all rules from existing seo-config.ts (no duplication).
 * ADDS category-specific patterns for content generation.
 */
export const CONTENT_SEO_STANDARDS = {
  /**
   * Title requirements (from existing seo-config.ts)
   */
  title: {
    minLength: METADATA_QUALITY_RULES.title.minLength,
    maxLength: METADATA_QUALITY_RULES.title.maxLength,
    optimalMin: OPTIMAL_MIN,
    optimalMax: OPTIMAL_MAX,

    // Generation-specific: format templates by category
    formats: SEO_TITLE_FORMATS,
    examples: SEO_TITLE_EXAMPLES,

    // Validation uses existing schema
    validate: (title: string) => {
      return validatedMetadataSchema.shape.title.safeParse(title);
    },
  },

  /**
   * Description requirements (from existing seo-config.ts)
   */
  description: {
    minLength: METADATA_QUALITY_RULES.description.minLength,
    maxLength: METADATA_QUALITY_RULES.description.maxLength,

    // Generation-specific: templates by category
    templates: SEO_DESCRIPTION_TEMPLATES,

    // Validation uses existing schema
    validate: (description: string) => {
      return validatedMetadataSchema.shape.description.safeParse(description);
    },
  },

  /**
   * Keyword requirements (from existing seo-config.ts)
   */
  keywords: {
    minCount: METADATA_QUALITY_RULES.keywords.minCount,
    maxCount: METADATA_QUALITY_RULES.keywords.maxCount,
    maxKeywordLength: METADATA_QUALITY_RULES.keywords.maxKeywordLength,

    // Generation-specific: required keywords by category
    requiredByCategory: REQUIRED_KEYWORDS_BY_CATEGORY,

    // Validation uses existing schema
    validate: (keywords: string[]) => {
      return validatedMetadataSchema.shape.keywords.safeParse(keywords);
    },
  },

  /**
   * Complete metadata validation (from existing seo-config.ts)
   */
  validateMetadata: (metadata: unknown) => {
    return validatedMetadataSchema.safeParse(metadata);
  },
} as const;

/**
 * Validate that generated content meets SEO standards
 *
 * @param content - Generated content to validate
 * @param category - Content category
 * @returns Validation result with errors
 */
export function validateContentSEO(
  content: {
    seoTitle?: string;
    description: string;
    tags: string[];
  },
  category: CategoryId
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation (if present)
  if (content.seoTitle) {
    const titleValidation = CONTENT_SEO_STANDARDS.title.validate(content.seoTitle);
    if (!titleValidation.success) {
      errors.push(`SEO Title: ${titleValidation.error.issues.map((e) => e.message).join(', ')}`);
    }

    // Optimal length check
    const titleLength = content.seoTitle.length;
    if (titleLength < OPTIMAL_MIN || titleLength > OPTIMAL_MAX) {
      warnings.push(
        `SEO Title ${titleLength} chars not optimal (${OPTIMAL_MIN}-${OPTIMAL_MAX} recommended)`
      );
    }
  }

  // Description validation (required)
  const descValidation = CONTENT_SEO_STANDARDS.description.validate(content.description);
  if (!descValidation.success) {
    errors.push(`Description: ${descValidation.error.issues.map((e) => e.message).join(', ')}`);
  }

  // Required keywords check
  const requiredKeywords = REQUIRED_KEYWORDS_BY_CATEGORY[category];
  if (requiredKeywords) {
    const descLower = content.description.toLowerCase();
    const missingKeywords = requiredKeywords.filter((kw) => !descLower.includes(kw.toLowerCase()));

    if (missingKeywords.length > 0) {
      errors.push(`Missing required keywords: ${missingKeywords.join(', ')}`);
    }
  }

  // Tags/keywords validation
  const keywordsValidation = CONTENT_SEO_STANDARDS.keywords.validate(content.tags);
  if (!keywordsValidation.success) {
    errors.push(`Keywords: ${keywordsValidation.error.issues.map((e) => e.message).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
