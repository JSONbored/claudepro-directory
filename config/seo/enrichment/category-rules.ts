/**
 * SEO Content Enrichment Rules - FAQ/Troubleshooting Generation
 *
 * Configuration-driven rules for automated FAQ generation across categories.
 * Optimized for 2025 AI search engines (ChatGPT, Perplexity, Claude) and traditional SEO.
 *
 * Architecture:
 * - Single source of truth for FAQ generation rules
 * - Type-safe with Zod validation
 * - Category-agnostic (scales to new categories automatically)
 * - Performance-optimized (batch processing, validation)
 * - SEO-optimized (structured Q&A, 150-200 char answers, FAQPage schema)
 *
 * Integration:
 * - Used by Claude Code interactive FAQ generation
 * - Validates generated content against quality standards
 * - Drives FAQPage schema generation (src/lib/structured-data/)
 *
 * October 2025 SEO Optimization:
 * - Clear, direct answers (LLM-preferred format)
 * - Actionable solutions (imperative voice)
 * - Specific to content item (not generic)
 * - 40-80 char questions (concise, searchable)
 * - 100-200 char solutions (detailed but scannable)
 *
 * @module config/seo/enrichment/category-rules
 */

import { z } from 'zod';
import type { CategoryId } from '@/src/lib/config/category-types';

/**
 * Focus areas for FAQ generation
 * Common troubleshooting topics mapped to user pain points
 */
export const FAQ_FOCUS_AREAS = {
  // Technical Setup & Configuration
  installation_setup: 'Installation, setup, and initial configuration',
  authentication_api_keys: 'Authentication, API keys, and credentials',
  configuration_environment: 'Configuration files and environment variables',
  permissions_access: 'Permissions, access control, and authorization',

  // Runtime & Execution
  execution_timing: 'Execution timing and lifecycle hooks',
  event_handling: 'Event handling and triggering',
  context_access: 'Context access and data availability',
  state_management: 'State management and persistence',

  // Errors & Debugging
  common_errors: 'Common error messages and failures',
  debugging_logs: 'Debugging, logging, and troubleshooting',
  connection_issues: 'Connection, network, and timeout issues',
  validation_errors: 'Validation and schema errors',

  // Integration & Usage
  integration: 'Integration with other tools and services',
  prerequisites: 'Prerequisites and dependencies',
  compatibility: 'Version compatibility and upgrades',
  migration: 'Migration and breaking changes',

  // Performance & Optimization
  performance: 'Performance optimization and tuning',
  resource_limits: 'Resource limits and quotas',
  rate_limiting: 'Rate limiting and throttling',

  // UI & Display
  display_rendering: 'Display rendering and formatting',
  theme_compatibility: 'Theme and styling compatibility',
  responsiveness: 'Responsive design and mobile issues',

  // Application & Scope
  rule_application: 'Rule application and behavior',
  scope_boundaries: 'Scope boundaries and context',
  conflicts_override: 'Conflicts and override behavior',
  skill_activation: 'Skill activation and triggers',

  // Edge Cases
  edge_cases: 'Edge cases and uncommon scenarios',
  data_handling: 'Data handling and transformation',
  security: 'Security best practices and vulnerabilities',
} as const;

export type FAQFocusArea = keyof typeof FAQ_FOCUS_AREAS;

/**
 * Quality standards for generated FAQ content
 */
export const FAQ_QUALITY_STANDARDS = {
  issue: {
    minLength: 40,
    maxLength: 80,
    format: 'Clear, specific question or error description',
    voice: 'User perspective (What they see/experience)',
    avoid: ['Generic questions', '"How do I use this?"', 'Vague descriptions'],
  },
  solution: {
    minLength: 100,
    maxLength: 200,
    format: 'Step-by-step actionable solution',
    voice: 'Imperative (Check, Verify, Run, Ensure, Add)',
    avoid: ['"Check the documentation"', 'Circular references', 'Vague suggestions'],
  },
} as const;

/**
 * Category-specific FAQ generation rules
 * Defines how many questions, what topics, and quality standards per category
 */
export interface CategoryFAQRule {
  /** Enable FAQ generation for this category */
  readonly enabled: boolean;

  /** Minimum number of FAQ entries to generate */
  readonly minQuestions: number;

  /** Maximum number of FAQ entries to generate */
  readonly maxQuestions: number;

  /** Focus areas for this category (prioritized order) */
  readonly focusAreas: ReadonlyArray<FAQFocusArea>;

  /** Example questions to guide generation style */
  readonly exampleQuestions: ReadonlyArray<string>;

  /** SEO optimization flags */
  readonly seo: {
    /** Generate FAQPage schema (JSON-LD) */
    readonly generateSchema: boolean;

    /** Target AI search engines (ChatGPT, Perplexity) */
    readonly optimizeForAI: boolean;

    /** Include in sitemap priority boost */
    readonly priorityBoost: boolean;
  };

  /** Performance optimization */
  readonly performance: {
    /** Batch size for processing this category */
    readonly batchSize: number;

    /** Enable caching of generated content */
    readonly enableCache: boolean;
  };
}

/**
 * Validation schema for category FAQ rules
 */
export const categoryFAQRuleSchema = z.object({
  enabled: z.boolean(),
  minQuestions: z.number().int().min(1).max(10),
  maxQuestions: z.number().int().min(1).max(10),
  focusAreas: z.array(z.string()).min(1),
  exampleQuestions: z.array(z.string()).min(1),
  seo: z.object({
    generateSchema: z.boolean(),
    optimizeForAI: z.boolean(),
    priorityBoost: z.boolean(),
  }),
  performance: z.object({
    batchSize: z.number().int().min(1).max(20),
    enableCache: z.boolean(),
  }),
});

/**
 * UNIFIED FAQ GENERATION RULES REGISTRY
 *
 * Single source of truth for FAQ enrichment across all categories.
 * Automatically scales to new categories added to UNIFIED_CATEGORY_REGISTRY.
 *
 * To add FAQ support to a new category:
 * 1. Add entry here with appropriate rules
 * 2. Ensure category schema has troubleshooting field (baseTroubleshootingSchema)
 * 3. Run FAQ generation workflow
 * 4. That's it! Everything else auto-updates.
 */
export const FAQ_GENERATION_RULES = {
  /**
   * MCP Servers - Highest priority
   * Most complex integration (auth, config, permissions)
   */
  mcp: {
    enabled: true,
    minQuestions: 4,
    maxQuestions: 5,
    focusAreas: [
      'installation_setup',
      'authentication_api_keys',
      'configuration_environment',
      'permissions_access',
      'common_errors',
      'debugging_logs',
    ],
    exampleQuestions: [
      'Docker daemon connection refused or not accessible',
      'Permission denied accessing Docker socket /var/run/docker.sock',
      'API version mismatch between client and server',
      'Authentication failed with invalid API key or token',
      'Rate limit exceeded when making API requests',
    ],
    seo: {
      generateSchema: true,
      optimizeForAI: true,
      priorityBoost: true,
    },
    performance: {
      batchSize: 5,
      enableCache: true,
    },
  },

  /**
   * Hooks - Execution & event-driven issues
   */
  hooks: {
    enabled: true,
    minQuestions: 4,
    maxQuestions: 5,
    focusAreas: [
      'execution_timing',
      'event_handling',
      'context_access',
      'debugging_logs',
      'common_errors',
    ],
    exampleQuestions: [
      'Hook not executing at expected lifecycle stage',
      'Context or variables undefined when hook runs',
      'Hook execution order conflicts with other hooks',
      'Error handling and rollback in failed hooks',
    ],
    seo: {
      generateSchema: true,
      optimizeForAI: true,
      priorityBoost: true,
    },
    performance: {
      batchSize: 10,
      enableCache: true,
    },
  },

  /**
   * Rules - Application & scope issues
   */
  rules: {
    enabled: true,
    minQuestions: 4,
    maxQuestions: 5,
    focusAreas: [
      'rule_application',
      'scope_boundaries',
      'conflicts_override',
      'context_access',
      'debugging_logs',
    ],
    exampleQuestions: [
      'Rule not applying to expected files or contexts',
      'Multiple rules conflicting with each other',
      'Scope boundaries unclear or not working as expected',
      'Rule override not taking precedence as configured',
    ],
    seo: {
      generateSchema: true,
      optimizeForAI: true,
      priorityBoost: true,
    },
    performance: {
      batchSize: 10,
      enableCache: true,
    },
  },

  /**
   * Statuslines - Display & theme issues
   */
  statuslines: {
    enabled: true,
    minQuestions: 4,
    maxQuestions: 5,
    focusAreas: [
      'display_rendering',
      'configuration_environment',
      'theme_compatibility',
      'common_errors',
    ],
    exampleQuestions: [
      'Statusline not displaying or appearing blank',
      'Theme colors not applying correctly to statusline',
      'Configuration changes not reflected in display',
    ],
    seo: {
      generateSchema: true,
      optimizeForAI: true,
      priorityBoost: false,
    },
    performance: {
      batchSize: 10,
      enableCache: true,
    },
  },

  /**
   * Skills - Activation & integration issues
   */
  skills: {
    enabled: true,
    minQuestions: 4,
    maxQuestions: 5,
    focusAreas: [
      'skill_activation',
      'prerequisites',
      'integration',
      'common_errors',
      'debugging_logs',
      'compatibility',
    ],
    exampleQuestions: [
      'Skill not activating when expected trigger occurs',
      'Missing prerequisites or dependencies for skill',
      'Integration with other tools or services failing',
      'Skill behavior different than documented',
      'Version compatibility issues with dependencies',
    ],
    seo: {
      generateSchema: true,
      optimizeForAI: true,
      priorityBoost: true,
    },
    performance: {
      batchSize: 10,
      enableCache: true,
    },
  },

  /**
   * Agents - AI agent configuration issues
   */
  agents: {
    enabled: true,
    minQuestions: 4,
    maxQuestions: 5,
    focusAreas: [
      'configuration_environment',
      'execution_timing',
      'common_errors',
      'state_management',
      'debugging_logs',
    ],
    exampleQuestions: [
      'Agent not responding or timing out during execution',
      'Configuration parameters not applying as expected',
      'Temperature/maxTokens settings not having desired effect',
      'Agent behavior inconsistent with prompt instructions',
    ],
    seo: {
      generateSchema: true,
      optimizeForAI: true,
      priorityBoost: true,
    },
    performance: {
      batchSize: 10,
      enableCache: true,
    },
  },

  /**
   * Commands - Slash command execution issues
   */
  commands: {
    enabled: true,
    minQuestions: 4,
    maxQuestions: 5,
    focusAreas: [
      'execution_timing',
      'configuration_environment',
      'permissions_access',
      'common_errors',
      'debugging_logs',
    ],
    exampleQuestions: [
      'Command not found or not executing when triggered',
      'Arguments not parsing correctly in slash command',
      'Command conflicts with other registered commands',
      'Permission errors when running command scripts',
    ],
    seo: {
      generateSchema: true,
      optimizeForAI: true,
      priorityBoost: true,
    },
    performance: {
      batchSize: 10,
      enableCache: true,
    },
  },

  /**
   * Collections - Bundle compatibility and setup issues
   */
  collections: {
    enabled: true,
    minQuestions: 4,
    maxQuestions: 5,
    focusAreas: ['installation_setup', 'prerequisites', 'compatibility', 'common_errors'],
    exampleQuestions: [
      'Items in collection not compatible with each other',
      'Installation order causing dependency conflicts',
      'Missing prerequisites for collection components',
    ],
    seo: {
      generateSchema: true,
      optimizeForAI: true,
      priorityBoost: false,
    },
    performance: {
      batchSize: 10,
      enableCache: true,
    },
  },

  /**
   * Guides - Disabled (no troubleshooting field in schema)
   */
  guides: {
    enabled: false,
    minQuestions: 0,
    maxQuestions: 0,
    focusAreas: [],
    exampleQuestions: [],
    seo: {
      generateSchema: false,
      optimizeForAI: false,
      priorityBoost: false,
    },
    performance: {
      batchSize: 0,
      enableCache: false,
    },
  },

  /**
   * Jobs - Disabled (no troubleshooting field in schema)
   */
  jobs: {
    enabled: false,
    minQuestions: 0,
    maxQuestions: 0,
    focusAreas: [],
    exampleQuestions: [],
    seo: {
      generateSchema: false,
      optimizeForAI: false,
      priorityBoost: false,
    },
    performance: {
      batchSize: 0,
      enableCache: false,
    },
  },

  /**
   * Changelog - Disabled (no troubleshooting field in schema)
   */
  changelog: {
    enabled: false,
    minQuestions: 0,
    maxQuestions: 0,
    focusAreas: [],
    exampleQuestions: [],
    seo: {
      generateSchema: false,
      optimizeForAI: false,
      priorityBoost: false,
    },
    performance: {
      batchSize: 0,
      enableCache: false,
    },
  },
} as const satisfies Record<CategoryId, CategoryFAQRule>;

/**
 * Get FAQ rules for a specific category
 */
export function getFAQRules(category: CategoryId): CategoryFAQRule {
  return FAQ_GENERATION_RULES[category];
}

/**
 * Get all enabled categories for FAQ generation
 */
export function getEnabledFAQCategories(): CategoryId[] {
  return (Object.keys(FAQ_GENERATION_RULES) as CategoryId[]).filter(
    (cat) => FAQ_GENERATION_RULES[cat].enabled
  );
}

/**
 * Validate FAQ entry against quality standards
 */
export function validateFAQEntry(
  issue: string,
  solution: string
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Issue validation
  if (issue.length < FAQ_QUALITY_STANDARDS.issue.minLength) {
    errors.push(`Issue too short (${issue.length} < ${FAQ_QUALITY_STANDARDS.issue.minLength})`);
  }
  if (issue.length > FAQ_QUALITY_STANDARDS.issue.maxLength) {
    errors.push(`Issue too long (${issue.length} > ${FAQ_QUALITY_STANDARDS.issue.maxLength})`);
  }

  // Solution validation
  if (solution.length < FAQ_QUALITY_STANDARDS.solution.minLength) {
    errors.push(
      `Solution too short (${solution.length} < ${FAQ_QUALITY_STANDARDS.solution.minLength})`
    );
  }
  if (solution.length > FAQ_QUALITY_STANDARDS.solution.maxLength) {
    errors.push(
      `Solution too long (${solution.length} > ${FAQ_QUALITY_STANDARDS.solution.maxLength})`
    );
  }

  // Quality checks
  if (solution.toLowerCase().includes('check the documentation')) {
    errors.push('Solution contains generic "check the documentation" phrase');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate total items to process across all enabled categories
 */
export function calculateTotalBatches(itemCounts: Record<CategoryId, number>): {
  totalItems: number;
  totalBatches: number;
  batchesByCategory: Record<string, number>;
} {
  let totalItems = 0;
  let totalBatches = 0;
  const batchesByCategory: Record<string, number> = {};

  for (const category of getEnabledFAQCategories()) {
    const rules = getFAQRules(category);
    const itemCount = itemCounts[category] || 0;
    const batches = Math.ceil(itemCount / rules.performance.batchSize);

    totalItems += itemCount;
    totalBatches += batches;
    batchesByCategory[category] = batches;
  }

  return { totalItems, totalBatches, batchesByCategory };
}
