/**
 * Mock Related Content Service for Storybook
 *
 * Provides deterministic mock data for testing RelatedContentClient component.
 * Mimics production service interface with configurable responses.
 *
 * IMPORTANT: This mock must not import from the real service file, as it contains
 * server-side dependencies (cache, logger, view-count.server) that break in browser.
 * All types are defined directly here or imported from schema-only files.
 */

import type { RelatedContentItem } from '@/src/lib/schemas/related-content.schema';

// Type definitions (duplicated from service to avoid server imports)
export interface RelatedContentInput {
  currentPath?: string;
  currentCategory?: string;
  currentTags?: string[];
  currentKeywords?: string[];
  limit?: number;
  featured?: string[];
  exclude?: string[];
}

export interface RelatedContentResponse {
  items: RelatedContentItem[];
  performance: {
    fetchTime: number;
    cacheHit: boolean;
    itemCount: number;
    algorithmVersion: string;
  };
  algorithm: string;
}

// Mock data generators
function createMockItem(overrides: Partial<RelatedContentItem> = {}): RelatedContentItem {
  const defaults: RelatedContentItem = {
    slug: 'mock-item',
    title: 'Mock Related Item',
    name: 'Mock Item',
    description: 'This is a mock related content item for Storybook testing',
    category: 'agents',
    author: 'Mock Author',
    dateAdded: '2025-01-15',
    source: 'community',
    tags: ['mock', 'test'],
    score: 0.8,
    matchType: 'same_category',
    matchDetails: {
      matchedTags: ['mock'],
      matchedKeywords: [],
    },
  };

  return { ...defaults, ...overrides };
}

// Pre-configured mock data sets
export const mockRelatedItems = {
  // Default 3-item set with different categories
  default: [
    createMockItem({
      slug: 'typescript-analyzer',
      title: 'TypeScript Code Analyzer',
      description: 'Advanced code analysis tool for TypeScript projects',
      category: 'agents',
      tags: ['typescript', 'code-analysis'],
      score: 0.95,
      matchType: 'same_category',
    }),
    createMockItem({
      slug: 'git-helper',
      title: 'Git Helper MCP',
      description: 'MCP server for Git operations and repository management',
      category: 'mcp',
      tags: ['git', 'version-control'],
      score: 0.82,
      matchType: 'tag_match',
    }),
    createMockItem({
      slug: 'testing-workflow',
      title: 'Automated Testing Workflow',
      description: 'Complete workflow for automated testing with CI/CD integration',
      category: 'guides',
      tags: ['testing', 'ci-cd'],
      score: 0.75,
      matchType: 'keyword_match',
    }),
  ],

  // Same category matches
  sameCategory: [
    createMockItem({
      slug: 'code-reviewer',
      title: 'Code Review Agent',
      description: 'AI-powered code review with best practices enforcement',
      category: 'agents',
      score: 0.92,
      matchType: 'same_category',
    }),
    createMockItem({
      slug: 'documentation-generator',
      title: 'Documentation Generator',
      description: 'Automatically generate documentation from code',
      category: 'agents',
      score: 0.88,
      matchType: 'same_category',
    }),
    createMockItem({
      slug: 'refactoring-assistant',
      title: 'Refactoring Assistant',
      description: 'Intelligent code refactoring suggestions',
      category: 'agents',
      score: 0.85,
      matchType: 'same_category',
    }),
  ],

  // Tag matches
  tagMatch: [
    createMockItem({
      slug: 'react-patterns',
      title: 'React Best Practices',
      description: 'Comprehensive guide to React patterns and best practices',
      category: 'guides',
      tags: ['react', 'best-practices'],
      score: 0.89,
      matchType: 'tag_match',
      matchDetails: {
        matchedTags: ['react', 'best-practices'],
        matchedKeywords: [],
      },
    }),
    createMockItem({
      slug: 'typescript-config',
      title: 'TypeScript Configuration Guide',
      description: 'Complete guide to TypeScript configuration',
      category: 'guides',
      tags: ['typescript', 'configuration'],
      score: 0.84,
      matchType: 'tag_match',
      matchDetails: {
        matchedTags: ['typescript'],
        matchedKeywords: [],
      },
    }),
  ],

  // Trending items
  trending: [
    createMockItem({
      slug: 'ai-assistant',
      title: 'AI Coding Assistant',
      description: 'Next-generation AI assistant for developers',
      category: 'agents',
      score: 0.98,
      matchType: 'trending',
      views: 9850,
    }),
    createMockItem({
      slug: 'automation-mcp',
      title: 'Automation MCP Server',
      description: 'Powerful automation capabilities via MCP',
      category: 'mcp',
      score: 0.94,
      matchType: 'trending',
      views: 8420,
    }),
    createMockItem({
      slug: 'devops-workflow',
      title: 'Modern DevOps Workflow',
      description: 'Complete DevOps workflow for modern teams',
      category: 'guides',
      score: 0.91,
      matchType: 'trending',
    }),
  ],

  // Empty result
  empty: [],

  // Single item
  single: [
    createMockItem({
      slug: 'quick-start',
      title: 'Quick Start Guide',
      description: 'Get started in 5 minutes',
      category: 'guides',
      score: 0.9,
      matchType: 'recommended',
    }),
  ],

  // Long descriptions
  longDescriptions: [
    createMockItem({
      slug: 'comprehensive-guide',
      title: 'Comprehensive Enterprise Development Guide',
      description:
        'This is an extremely detailed guide covering all aspects of enterprise software development, including architecture patterns, testing strategies, deployment workflows, monitoring solutions, and team collaboration best practices. Perfect for teams scaling from startup to enterprise.',
      category: 'guides',
      tags: ['enterprise', 'architecture', 'best-practices', 'scaling'],
      score: 0.87,
      matchType: 'cross_category',
    }),
    createMockItem({
      slug: 'advanced-typescript',
      title: 'Advanced TypeScript Patterns for Large-Scale Applications',
      description:
        'Master advanced TypeScript patterns including conditional types, mapped types, template literal types, and advanced generics. Learn how to build type-safe APIs, implement design patterns, and leverage TypeScript for maximum productivity in large codebases.',
      category: 'guides',
      tags: ['typescript', 'advanced', 'patterns'],
      score: 0.93,
      matchType: 'tag_match',
    }),
  ],
};

// Mock service class
class MockRelatedContentService {
  private algorithmVersion = 'v2.0.0-mock';
  private mockDelay = 300; // Simulate network delay

  /**
   * Get related content - returns mock data
   */
  async getRelatedContent(input: RelatedContentInput): Promise<RelatedContentResponse> {
    const startTime = performance.now();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, this.mockDelay));

    // Determine which mock data set to return based on input
    let items: RelatedContentItem[] = mockRelatedItems.default;

    // Check for specific scenarios in exclude array (test pattern)
    if (input.exclude?.includes('__EMPTY__')) {
      items = mockRelatedItems.empty;
    } else if (input.exclude?.includes('__SINGLE__')) {
      items = mockRelatedItems.single;
    } else if (input.exclude?.includes('__TRENDING__')) {
      items = mockRelatedItems.trending;
    } else if (input.exclude?.includes('__TAG_MATCH__')) {
      items = mockRelatedItems.tagMatch;
    } else if (input.exclude?.includes('__SAME_CATEGORY__')) {
      items = mockRelatedItems.sameCategory;
    } else if (input.exclude?.includes('__LONG_DESC__')) {
      items = mockRelatedItems.longDescriptions;
    } else {
      // Default behavior: filter by limit
      items = mockRelatedItems.default.slice(0, input.limit || 3);
    }

    const fetchTime = performance.now() - startTime;

    return {
      items,
      performance: {
        fetchTime,
        cacheHit: true, // Always cache hit in mock
        itemCount: items.length,
        algorithmVersion: this.algorithmVersion,
      },
      algorithm: this.algorithmVersion,
    };
  }

  /**
   * Configure mock delay (for testing loading states)
   */
  setMockDelay(delay: number): void {
    this.mockDelay = delay;
  }
}

// Export singleton instance
export const relatedContentService = new MockRelatedContentService();

// Export class for testing
export { MockRelatedContentService };
