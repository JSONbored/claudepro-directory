/**
 * Unified Content Validation Tests
 *
 * Single test suite for ALL content categories.
 * Replaces individual test files with configuration-driven testing.
 *
 * Replaces:
 * - content-generation-validation.test.ts (237 lines)
 * - hooks-validation.test.ts (264 lines)
 * - mcp-validation.test.ts (365 lines)
 * - Would be 5 more test files (~1,200 lines total)
 *
 * Total: ~1,800 lines deleted, ~300 lines of tests added
 * Net: -1,500 lines
 *
 * @module tests/unit/config/content-validation
 */

import { describe, expect, it } from 'vitest';
import { CATEGORY_CONFIG } from '@/config/content/category-config';
import { validateContentSEO } from '@/config/content/quality/seo-standards';
import { validateContent } from '@/config/content/validation/generic-validator';
import type { CategoryId } from '@/src/lib/config/category-types';

/**
 * Get category-specific description with all required keywords
 */
const getDescriptionForCategory = (category: CategoryId): string => {
  const descriptions: Record<string, string> = {
    statuslines:
      'Statusline for CLI monitoring. Real-time updates, color indicators, and configuration options. Production-ready for Claude Code terminal automation system.', // 157 chars
    hooks:
      'Hook for automation workflows. Automatically validates files, runs scripts, and handles errors gracefully. Production-ready automation for Claude Code system.', // 160 chars
    mcp: 'MCP server for Claude integration. Provides API access, resource management, and tool execution capabilities. Official Claude Desktop and Claude Code support.', // 160 chars
    commands:
      'Command for Claude Code CLI. Markdown-based configuration enables workflow automation, argument parsing, and custom actions. Production-ready command system.', // 160 chars
    rules:
      'Rules configuration for validation. Enforces code quality standards, linting requirements, and best practices. Production-ready validation configuration system.', // 160 chars
    agents:
      'AI agent for specialized tasks. Autonomous execution, intelligent decision-making, and workflow automation. Production-ready agent system for Claude Code.', // 157 chars
    skills:
      'Skill for Claude Code capabilities. Reusable functionality, external integrations, and workflow automation. Production-ready capability system for Claude.', // 157 chars
    collections:
      'Collection bundle of configurations. Organized starter kits, workflow automation, and setup guides. Production-ready configuration bundle system for Claude.', // 160 chars
  };
  return (
    descriptions[category] ||
    'Test content for automation. Features comprehensive validation, error handling, and quality checks. Production-ready for Claude Code integration system.'
  );
};

/**
 * Test Data Factory
 *
 * Generates valid test content for each category.
 */
const createValidContent = (category: CategoryId): Record<string, unknown> => {
  const baseContent = {
    slug: `test-${category}`,
    description: getDescriptionForCategory(category),
    author: 'JSONbored',
    dateAdded: '2025-10-19',
    tags: getRequiredTags(category),
    category,
    troubleshooting: [
      {
        issue: 'This is a test issue that meets minimum length',
        solution:
          'This is a test solution that meets the 100 character minimum requirement for troubleshooting validation purposes.',
      },
      {
        issue: 'Another test issue with sufficient length here',
        solution:
          'Another test solution that is sufficiently long to meet the 100 character minimum requirement for validation.',
      },
      {
        issue: 'Third test issue meets minimum length requirements',
        solution:
          'Third test solution is long enough to pass the 100 character minimum length requirement for validation tests.',
      },
      {
        issue: 'Fourth test issue with adequate length for testing',
        solution:
          'Fourth test solution with adequate length to meet the 100 character minimum requirement for validation test.',
      },
    ],
    features: [
      'Feature one for testing',
      'Feature two for testing',
      'Feature three for testing',
      'Feature four for testing',
    ],
    useCases: [
      'Use case one for testing',
      'Use case two for testing',
      'Use case three for testing',
    ],
    discoveryMetadata: {
      researchDate: '2025-10-19',
      trendingSources: [
        {
          source: 'github_trending',
          evidence: `Test ${category} repository trending with 5k stars`,
          url: 'https://github.com/test/repo',
          relevanceScore: 'high',
        },
        {
          source: 'reddit_programming',
          evidence: `Popular discussion about ${category} with 300 upvotes`,
          url: 'https://reddit.com/r/programming/test',
          relevanceScore: 'high',
        },
      ],
      keywordResearch: {
        primaryKeywords: [category, 'configuration', 'test'],
        searchVolume: 'medium',
        competitionLevel: 'low',
      },
      gapAnalysis: {
        existingContent: [],
        identifiedGap: `This test ${category} content fills a gap in testing validation. No existing test content covers this specific validation scenario for the ${category} category.`,
        priority: 'medium',
      },
      approvalRationale: `Test ${category} content approved for validation testing purposes. Demonstrates proper discovery metadata structure and validates schema enforcement for all ${category} category content.`,
    },
  };

  // Category-specific required fields
  switch (category) {
    case 'statuslines':
      return {
        ...baseContent,
        title: 'Docker Health Statusline',
        seoTitle: 'Docker Health Statusline for Claude Code - Container Monitor', // 60 chars
        statuslineType: 'minimal',
        configuration: {
          format: 'bash',
          refreshInterval: 1000,
        },
        preview: '🐳 ● 3/5',
      };

    case 'hooks':
      return {
        ...baseContent,
        hookType: 'PreToolUse',
        configuration: {
          hookConfig: {
            hooks: {
              preToolUse: {
                script: './.claude/hooks/test.sh',
                matchers: ['edit', 'write'],
              },
            },
          },
        },
      };

    case 'mcp':
      return {
        ...baseContent,
        configuration: {
          claudeDesktop: {
            mcp: {
              test: {
                command: 'npx',
                args: ['-y', 'test-server'],
              },
            },
          },
        },
        package: '@test/mcp-server',
      };

    case 'commands':
    case 'rules':
    case 'agents':
    case 'skills':
      return baseContent;

    case 'collections':
      return {
        ...baseContent,
        collectionType: 'starter-kit',
        difficulty: 'beginner',
        items: [
          {
            category: 'statuslines',
            slug: 'test-statusline',
            reason: 'Essential for monitoring',
          },
          {
            category: 'hooks',
            slug: 'test-hook',
            reason: 'Automation workflows',
          },
        ],
      };

    default:
      return baseContent;
  }
};

/**
 * Get required tags for category
 */
const getRequiredTags = (category: CategoryId): string[] => {
  const config = CATEGORY_CONFIG[category];
  if (!config) return ['test'];

  const required = config.generation.quality.seo?.keywords?.required || [];
  return [...required, 'test'];
};

/**
 * Generate tests for all configured categories
 */
const testableCategories = Object.entries(CATEGORY_CONFIG).filter(
  ([_, config]) => config !== null
) as Array<[CategoryId, NonNullable<(typeof CATEGORY_CONFIG)[CategoryId]>]>;

describe('Unified Content Validation', () => {
  describe.each(testableCategories)('%s category', (category, config) => {
    it('should pass validation for properly formatted content', () => {
      const validContent = createValidContent(category);
      const result = validateContent(validContent, category, config.schema, config.validation);

      if (!result.valid) {
        console.log(`VALIDATION ERRORS for ${category}:`, result.errors);
        console.log(`VALIDATION WARNINGS for ${category}:`, result.warnings);
      }

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
    });

    it('should fail validation for missing required fields', () => {
      const invalidContent = {
        slug: 'test',
        description: 'Test',
        category,
        // Missing many required fields including discoveryMetadata
      };

      const result = validateContent(invalidContent, category, config.schema, config.validation);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should fail on discoveryMetadata requirement (Step 0) or other required fields
      expect(
        result.errors.some(
          (e) => e.includes('BLOCKING') || e.includes('discoveryMetadata') || e.includes('Required')
        )
      ).toBe(true);
    });

    it('should fail validation for description too short', () => {
      const content = createValidContent(category);
      content.description = 'Too short'; // < 150 chars

      const result = validateContent(content, category, config.schema, config.validation);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Description'))).toBe(true);
    });

    it('should fail validation for insufficient troubleshooting entries', () => {
      const content = createValidContent(category);
      content.troubleshooting = [
        // Only 2 entries, needs 4 minimum
        {
          issue: 'This is an issue that is long enough to pass',
          solution:
            'This is a solution that is long enough to pass the 100 character minimum requirement for troubleshooting.',
        },
        {
          issue: 'Another issue that meets the minimum length test',
          solution:
            'Another solution that is sufficiently long to meet the 100 character minimum requirement for validation.',
        },
      ];

      const result = validateContent(content, category, config.schema, config.validation);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 4'))).toBe(true);
    });

    it('should fail validation for missing required keywords', () => {
      const content = createValidContent(category);
      content.description =
        'This description does not contain required keywords for the category. It is long enough to pass length validation at 150 characters minimum.'; // Missing required keywords
      content.tags = ['test', 'example']; // Missing required tags

      const result = validateContent(content, category, config.schema, config.validation);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('required keywords'))).toBe(true);
    });
  });

  describe('SEO Validation (Generic)', () => {
    it.each(testableCategories)(
      'should validate SEO metadata correctly for %s',
      (category, config) => {
        const content = createValidContent(category);
        const result = validateContentSEO(
          {
            seoTitle: content.seoTitle,
            description: content.description,
            tags: content.tags,
          },
          category
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    );

    it.each(testableCategories)('should detect missing keywords for %s', (category) => {
      const content = {
        description:
          'This description does not contain required keywords. It is long enough to pass length validation at 150 characters minimum for SEO purposes here.',
        tags: ['test', 'example'],
      };

      const result = validateContentSEO(content, category);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('required keywords'))).toBe(true);
    });
  });

  describe('Category-Specific Validation', () => {
    it('should validate MCP platform configuration', () => {
      const mcpConfig = CATEGORY_CONFIG.mcp;
      if (!mcpConfig) throw new Error('MCP config not found');

      const invalidMcp = createValidContent('mcp');
      invalidMcp.configuration = {}; // Missing both claudeDesktop and claudeCode

      const result = validateContent(invalidMcp, 'mcp', mcpConfig.schema, mcpConfig.validation);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('claudeDesktop or claudeCode'))).toBe(true);
    });

    it('should warn about statusline preview', () => {
      const statuslineConfig = CATEGORY_CONFIG.statuslines;
      if (!statuslineConfig) throw new Error('Statusline config not found');

      const statusline = createValidContent('statuslines');
      delete statusline.preview;

      const result = validateContent(
        statusline,
        'statuslines',
        statuslineConfig.schema,
        statuslineConfig.validation
      );

      expect(result.warnings.some((w) => w.includes('Preview'))).toBe(true);
    });
  });
});
