/**
 * Content Generation Rules Registry
 *
 * Master registry for automated content research, creation, and validation.
 * Configuration-driven system that Claude follows automatically for content generation.
 *
 * Architecture:
 * - Discovery Layer: What content to create (trending topics, gaps, opportunities)
 * - Research Layer: How to research content (sources, validation, depth)
 * - Quality Layer: Standards to meet (SEO, accuracy, completeness)
 * - Generation Layer: How to create (templates, workflows, automation)
 *
 * Integration:
 * - Imports from existing seo-config.ts (no duplication)
 * - Validates against existing content schemas
 * - Extends category-rules.ts pattern
 * - Works with existing build process
 *
 * Usage (Claude Instructions):
 * When user says "generate {category} content", Claude should:
 * 1. Import the category-specific rules (e.g., STATUSLINE_GENERATION_RULES)
 * 2. Execute discovery workflow
 * 3. Research topic using research rules
 * 4. Generate content using template
 * 5. Validate strictly (blocking enforcement)
 * 6. Present for user approval with validation report
 *
 * @module config/content/generation-rules
 */

import type { CategoryId } from '@/src/lib/config/category-types';

/**
 * Discovery Layer - WHAT to create
 *
 * Rules for discovering trending topics, identifying content gaps,
 * and finding high-value SEO opportunities.
 */
export interface DiscoveryRules {
  /** Trending topic sources and weights */
  readonly trendingSources: ReadonlyArray<{
    readonly name: string;
    readonly weight: number;
    readonly enabled: boolean;
  }>;

  /** Keyword research strategy */
  readonly keywordStrategy: {
    readonly primary: ReadonlyArray<string>;
    readonly longtail: ReadonlyArray<string>;
    readonly searchIntent: 'informational' | 'implementation' | 'commercial';
  };

  /** Content gap analysis rules */
  readonly contentGaps: {
    readonly checkExisting: boolean;
    readonly prioritizeGaps: ReadonlyArray<string>;
  };
}

/**
 * Research Layer - HOW to research
 *
 * Rules for validating sources, fact-checking, and research depth requirements.
 */
export interface ResearchRules {
  /** Required source validation */
  readonly requiredSources: {
    readonly min: number;
    readonly types: ReadonlyArray<
      'official_docs' | 'community_example' | 'blog_post' | 'github_repo'
    >;
  };

  /** Validation requirements */
  readonly validation: {
    readonly verifyInstallation: boolean;
    readonly verifyOutput: boolean;
    readonly checkCompatibility: ReadonlyArray<string>;
  };

  /** Research depth standards */
  readonly depthRequirements: {
    readonly useCases: { readonly min: number; readonly max: number };
    readonly features: { readonly min: number; readonly max: number };
    readonly examples: { readonly min: number; readonly max: number };
    readonly troubleshooting: { readonly min: number; readonly max: number };
  };
}

/**
 * Quality Layer - STANDARDS to meet
 *
 * SEO requirements, accuracy validation, and completeness rules.
 * Integrates with existing seo-config.ts and category-rules.ts
 */
export interface QualityRules {
  /** SEO optimization rules */
  readonly seo: {
    readonly title: {
      readonly format: string;
      readonly minLength: number;
      readonly maxLength: number;
      readonly examples: ReadonlyArray<string>;
    };
    readonly description: {
      readonly format: string;
      readonly minLength: number;
      readonly maxLength: number;
    };
    readonly keywords: {
      readonly required: ReadonlyArray<string>;
      readonly recommended: ReadonlyArray<string>;
      readonly avoid: ReadonlyArray<string>;
    };
  };

  /** Accuracy validation rules */
  readonly accuracy: {
    readonly codeVerification: boolean;
    readonly linkValidation: boolean;
    readonly versionCheck: boolean;
  };

  /** Completeness requirements */
  readonly completeness: {
    readonly requiredFields: ReadonlyArray<string>;
    readonly optionalButRecommended: ReadonlyArray<string>;
  };
}

/**
 * Generation Layer - HOW to create
 *
 * Workflow steps, automation rules, and content templates.
 */
export interface GenerationRules {
  /** Workflow orchestration steps */
  readonly workflow: ReadonlyArray<
    | 'discover_trending_topics'
    | 'keyword_research'
    | 'gap_analysis'
    | 'source_collection'
    | 'code_verification'
    | 'content_drafting'
    | 'seo_optimization'
    | 'quality_validation'
    | 'schema_validation'
  >;

  /** Automation flags */
  readonly automation: {
    readonly autoGeneratePreview: boolean;
    readonly autoExtractFeatures: boolean;
    readonly autoSuggestTags: boolean;
    readonly autoOptimizeTitle: boolean;
  };

  /** Strict validation enforcement */
  readonly validation: {
    readonly strict: boolean;
    readonly blockOnError: boolean;
  };
}

/**
 * Complete content generation rules for a category
 */
export interface ContentGenerationRules {
  readonly discovery: DiscoveryRules;
  readonly research: ResearchRules;
  readonly quality: QualityRules;
  readonly generation: GenerationRules;
}

/**
 * Content Generation Rules Registry
 *
 * Maps each category to its generation rules.
 * Currently only statuslines is fully implemented (pilot category).
 */
export type ContentGenerationRegistry = Partial<Record<CategoryId, ContentGenerationRules>>;

/**
 * Note: All concrete exports removed to avoid barrel file anti-pattern.
 * This file now only exports types and interfaces.
 *
 * Import directly from source files:
 * - import { CATEGORY_CONFIG } from '@/config/content/category-config';
 * - import { detectTrendingTopics } from '@/config/content/discovery/trend-detection';
 * - import { SEO_STANDARDS } from '@/config/content/quality/seo-standards';
 * - import { validateCategoryContent } from '@/config/content/validation/category-validators';
 */
/**
 * Validation and formatting utilities moved to avoid barrel file anti-pattern.
 *
 * Import directly from source:
 * - import { formatValidationReport, validateContent, validateGenericContent } from '@/config/content/validation/generic-validator';
 */
