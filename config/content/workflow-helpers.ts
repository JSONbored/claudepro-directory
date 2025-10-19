/**
 * Content Generation Workflow Helpers
 *
 * Helper functions for orchestrating the content generation workflow.
 * Provides utilities for discovery, research, generation, and validation steps.
 *
 * Workflow:
 * 1. Discovery: Find trending topics → discoverTrendingTopics()
 * 2. Research: Gather information → researchTopic()
 * 3. Generate: Create content → generateContent()
 * 4. Validate: Check quality → validateContent()
 *
 * @module config/content/workflow-helpers
 */

import type { CategoryId } from '@/src/lib/config/category-types';

/**
 * Discovery Result
 *
 * Result from trending topic discovery.
 */
export interface DiscoveryResult {
  topic: string;
  category: CategoryId;
  sources: Array<{
    name: string;
    url?: string;
    score: number;
  }>;
  keywords: string[];
  confidence: number;
}

/**
 * Research Result
 *
 * Result from topic research phase.
 */
export interface ResearchResult {
  topic: string;
  category: CategoryId;
  sources: Array<{
    url: string;
    type: 'official_docs' | 'community_example' | 'blog_post' | 'github_repo';
    credibility: number;
    content: string;
  }>;
  extractedFeatures: string[];
  extractedUseCases: string[];
  codeExamples: Array<{
    language: string;
    code: string;
    description?: string;
  }>;
  installationSteps: string[];
}

/**
 * Generation Result
 *
 * Result from content generation phase.
 */
export interface GenerationResult {
  content: unknown; // Will be validated by category-specific schema
  metadata: {
    generatedAt: string;
    workflow: string[];
    automationApplied: string[];
  };
}

/**
 * Workflow Instructions for Claude
 *
 * Step-by-step instructions for executing the content generation workflow.
 */
export const WORKFLOW_INSTRUCTIONS = {
  /**
   * Step 1: Discovery
   *
   * Use WebSearch to discover trending topics.
   *
   * Example:
   * ```typescript
   * const query = generateStatuslineDiscoveryQuery('trending');
   * const results = await WebSearch({ query });
   * const topics = parseDiscoveryResults(results);
   * ```
   */
  discovery: {
    step: 1,
    name: 'Discovery',
    description: 'Find trending topics using WebSearch',
    tools: ['WebSearch'],
    inputs: ['category', 'intent'],
    outputs: ['topics', 'keywords', 'confidence'],
    instructions: [
      '1. Import generateLongtailQuery from discovery/trend-detection.ts',
      '2. Generate search query for the category',
      '3. Execute WebSearch with the query',
      '4. Parse results to extract topics and keywords',
      '5. Score topics by relevance and trend signals',
      '6. Return top topics with confidence scores',
    ],
  },

  /**
   * Step 2: Research
   *
   * Research the discovered topic using WebSearch and WebFetch.
   *
   * Example:
   * ```typescript
   * const sources = await gatherSources(topic);
   * const features = extractFeatures(sources);
   * const examples = extractCodeExamples(sources);
   * ```
   */
  research: {
    step: 2,
    name: 'Research',
    description: 'Gather information about the topic',
    tools: ['WebSearch', 'WebFetch'],
    inputs: ['topic', 'category', 'requiredSources'],
    outputs: ['sources', 'features', 'useCases', 'examples', 'installation'],
    instructions: [
      '1. WebSearch for official documentation',
      '2. WebSearch for community examples (GitHub, Reddit)',
      '3. WebFetch to read detailed content from sources',
      '4. Extract features from documentation',
      '5. Extract use cases from examples',
      '6. Extract code examples with syntax',
      '7. Extract installation steps',
      '8. Verify minimum source requirements met',
    ],
  },

  /**
   * Step 3: Generation
   *
   * Generate content using the template and research data.
   *
   * Example:
   * ```typescript
   * const content = {
   *   slug: generateSlug(topic),
   *   title: generateTitle(topic, research),
   *   seoTitle: optimizeSEOTitle(title),
   *   description: generateDescription(research),
   *   // ... other fields
   * };
   * ```
   */
  generation: {
    step: 3,
    name: 'Generation',
    description: 'Create content from research data',
    tools: [],
    inputs: ['research', 'template', 'automationRules'],
    outputs: ['content'],
    instructions: [
      '1. Import category template (e.g., STATUSLINE_GENERATION_RULES)',
      '2. Generate slug from topic (lowercase, hyphenated)',
      '3. Generate title from research',
      '4. Optimize SEO title (53-60 chars)',
      '5. Generate description using template (150-160 chars)',
      '6. Extract and format features from research',
      '7. Extract and format use cases from research',
      '8. Format code examples with syntax highlighting',
      '9. Generate troubleshooting from common issues',
      '10. Apply automation rules (auto-optimize, auto-fill)',
      '11. Add metadata (author, dateAdded, tags)',
    ],
  },

  /**
   * Step 4: Validation
   *
   * Validate content strictly before presenting.
   *
   * Example:
   * ```typescript
   * const result = validateStatuslineContent(content);
   * if (!result.valid) {
   *   // Fix errors or abort
   * }
   * const report = formatValidationReport(result);
   * ```
   */
  validation: {
    step: 4,
    name: 'Validation',
    description: 'Validate content quality (strict, blocking)',
    tools: [],
    inputs: ['content', 'category'],
    outputs: ['validationResult', 'report'],
    instructions: [
      '1. Import category validator (e.g., validateStatuslineContent)',
      '2. Run strict validation (schema + SEO + completeness)',
      '3. If validation fails (valid=false), STOP and report errors',
      '4. Format validation report for user review',
      '5. Present content with validation report',
      '6. Wait for user approval before saving',
    ],
  },
} as const;

/**
 * Generate Slug from Topic
 *
 * Creates URL-safe slug from topic name.
 *
 * @param topic - Topic name
 * @returns URL-safe slug
 */
export function generateSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format Current Date as ISO String
 *
 * Returns current date in ISO 8601 format for dateAdded field.
 *
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Optimize Title for SEO
 *
 * Truncates and optimizes title to meet SEO length requirements (53-60 chars).
 *
 * @param title - Original title
 * @param maxLength - Maximum length (default 60)
 * @returns Optimized title
 */
export function optimizeTitleForSEO(title: string, maxLength = 60): string {
  if (title.length <= maxLength) {
    return title;
  }

  // Truncate at word boundary
  const truncated = title.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace).trim();
  }

  return truncated.trim();
}

/**
 * Extract Common Issues for Troubleshooting
 *
 * Identifies common troubleshooting topics based on category.
 *
 * @param category - Content category
 * @returns Array of common issue patterns
 */
export function getCommonIssuesForCategory(category: CategoryId): string[] {
  const commonIssues: Record<CategoryId, string[]> = {
    statuslines: [
      'Statusline not displaying or appearing blank',
      'Colors not rendering correctly in statusline',
      'Refresh rate too slow or not updating',
      'Configuration changes not reflected',
      'Shell compatibility issues (bash/zsh/fish)',
    ],
    hooks: [
      'Hook not executing at expected lifecycle stage',
      'Context or variables undefined when hook runs',
      'Hook execution order conflicts',
      'Permission errors when running hook scripts',
      'Timeout errors during hook execution',
    ],
    mcp: [
      'MCP server connection refused or not accessible',
      'Authentication failed with API key or token',
      'Permission denied errors',
      'Rate limit exceeded when making requests',
      'API version mismatch errors',
    ],
    rules: [
      'Rule not applying to expected files or contexts',
      'Multiple rules conflicting with each other',
      'Scope boundaries unclear or not working',
      'Rule override not taking precedence',
      'Validation errors in rule configuration',
    ],
    commands: [
      'Command not found or not executing',
      'Arguments not parsing correctly',
      'Command conflicts with other registered commands',
      'Permission errors when running command scripts',
      'Markdown parsing errors in command file',
    ],
    agents: [
      'Agent not responding or timing out',
      'Configuration parameters not applying',
      'Temperature/maxTokens settings not effective',
      'Agent behavior inconsistent with prompt',
      'Context limit exceeded errors',
    ],
    skills: [
      'Skill not activating when expected trigger occurs',
      'Missing prerequisites or dependencies',
      'Integration with other tools failing',
      'Skill behavior different than documented',
      'Version compatibility issues',
    ],
    collections: [
      'Items in collection not compatible',
      'Installation order causing dependency conflicts',
      'Missing prerequisites for collection components',
      'Version mismatches between collection items',
      'Configuration conflicts between items',
    ],
    guides: [],
    jobs: [],
    changelog: [],
  };

  return commonIssues[category] || [];
}

/**
 * Workflow Execution Summary
 *
 * Provides a summary of the workflow steps for user display.
 */
export function getWorkflowSummary(): string {
  return `
Content Generation Workflow:

1️⃣ Discovery (WebSearch)
   → Find trending topics
   → Identify content gaps
   → Generate longtail keywords

2️⃣ Research (WebSearch + WebFetch)
   → Gather 3+ trusted sources
   → Extract features and use cases
   → Collect code examples
   → Verify installation steps

3️⃣ Generation (Template + Automation)
   → Generate SEO-optimized metadata
   → Format content using template
   → Apply automation rules
   → Create troubleshooting entries

4️⃣ Validation (Strict, Blocking)
   → Schema validation
   → SEO standards check
   → Completeness verification
   → Quality assurance
`.trim();
}
