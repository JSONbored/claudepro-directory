/**
 * Trend Detection Rules
 *
 * Configuration for discovering trending topics via WebSearch.
 * Used to identify high-value content opportunities before they become saturated.
 *
 * Architecture:
 * - WebSearch integration for real-time trend discovery
 * - Multi-source aggregation with weighted scoring
 * - Keyword research for longtail opportunities
 * - Content gap analysis to avoid duplication
 *
 * @module config/content/discovery/trend-detection
 */

import type { CategoryId } from '@/src/lib/config/category-types';

/**
 * Trending Topic Source Configuration
 *
 * Defines sources for trend discovery with weight and filters.
 */
export interface TrendingSource {
  readonly name: string;
  readonly weight: number;
  readonly enabled: boolean;
  readonly query: (category: CategoryId) => string;
  readonly filters?: {
    readonly timeframe?: '24h' | '7d' | '30d' | '12m';
    readonly minScore?: number;
  };
}

/**
 * Trending Sources for Content Discovery
 *
 * Weighted sources for discovering trending topics.
 * Higher weight = more influence on final trending score.
 */
export const TRENDING_SOURCES: ReadonlyArray<TrendingSource> = [
  {
    name: 'github_trending',
    weight: 0.3,
    enabled: true,
    query: (category) => `GitHub trending ${category} CLI tools developer productivity 2025`,
    filters: {
      timeframe: '7d',
      minScore: 50, // Minimum stars/activity
    },
  },
  {
    name: 'reddit_trending',
    weight: 0.25,
    enabled: true,
    query: (category) => `Reddit r/programming r/commandline ${category} trending discussions 2025`,
    filters: {
      timeframe: '7d',
      minScore: 10, // Minimum upvotes
    },
  },
  {
    name: 'hackernews_trending',
    weight: 0.2,
    enabled: true,
    query: (category) => `Hacker News ${category} CLI development tools trending 2025`,
    filters: {
      timeframe: '7d',
      minScore: 100, // Minimum points
    },
  },
  {
    name: 'dev_to_trending',
    weight: 0.15,
    enabled: true,
    query: (category) => `Dev.to ${category} CLI automation trending articles 2025`,
    filters: {
      timeframe: '30d',
    },
  },
  {
    name: 'google_trends',
    weight: 0.1,
    enabled: true,
    query: (category) => `Google Trends ${category} CLI tools developer interest rising 2025`,
    filters: {
      timeframe: '30d',
    },
  },
] as const;

/**
 * Keyword Research Strategy
 *
 * Longtail keyword patterns for SEO optimization.
 */
export interface KeywordStrategy {
  readonly primary: ReadonlyArray<string>;
  readonly modifiers: ReadonlyArray<string>;
  readonly intentModifiers: ReadonlyArray<string>;
  readonly avoidTerms: ReadonlyArray<string>;
}

/**
 * Keyword Research Strategies by Category
 *
 * Longtail keyword patterns for discovering high-value, low-competition topics.
 */
export const KEYWORD_STRATEGIES: Record<CategoryId, KeywordStrategy> = {
  statuslines: {
    primary: ['statusline', 'CLI prompt', 'terminal status bar', 'shell prompt'],
    modifiers: ['minimal', 'powerline', 'custom', 'real-time', 'dynamic', 'colorful'],
    intentModifiers: [
      'configuration',
      'setup',
      'examples',
      'tutorial',
      'customization',
      'automation',
    ],
    avoidTerms: ['generic', 'simple', 'basic'], // Low-value keywords
  },
  hooks: {
    primary: ['Claude Code hook', 'lifecycle hook', 'automation hook', 'event hook'],
    modifiers: ['pre-commit', 'post-tool', 'session', 'automated', 'validation', 'notification'],
    intentModifiers: ['examples', 'configuration', 'best practices', 'automation', 'integration'],
    avoidTerms: ['simple', 'basic', 'generic'],
  },
  mcp: {
    primary: ['MCP server', 'Model Context Protocol', 'Claude integration', 'MCP integration'],
    modifiers: ['GitHub', 'Docker', 'AWS', 'filesystem', 'database', 'API', 'official'],
    intentModifiers: ['setup guide', 'configuration', 'examples', 'tutorial', 'integration'],
    avoidTerms: ['deprecated', 'unmaintained', 'beta'],
  },
  rules: {
    primary: ['Claude rules', 'CLAUDE.md rules', 'codebase rules', 'project rules'],
    modifiers: ['TypeScript', 'React', 'Next.js', 'testing', 'security', 'performance'],
    intentModifiers: ['examples', 'best practices', 'configuration', 'template'],
    avoidTerms: ['generic', 'boilerplate'],
  },
  commands: {
    primary: ['Claude Code command', 'slash command', 'CLI command', 'custom command'],
    modifiers: ['git', 'deploy', 'test', 'build', 'automation', 'workflow'],
    intentModifiers: ['examples', 'configuration', 'tutorial', 'automation'],
    avoidTerms: ['basic', 'simple'],
  },
  agents: {
    primary: ['AI agent', 'Claude agent', 'automation agent', 'task agent'],
    modifiers: ['code review', 'testing', 'deployment', 'refactoring', 'documentation'],
    intentModifiers: ['configuration', 'examples', 'best practices', 'prompts'],
    avoidTerms: ['generic', 'basic'],
  },
  skills: {
    primary: ['Claude skill', 'AI skill', 'automation skill', 'CLI skill'],
    modifiers: ['PDF', 'Excel', 'documentation', 'code generation', 'data processing'],
    intentModifiers: ['examples', 'tutorial', 'configuration', 'automation'],
    avoidTerms: ['basic', 'simple'],
  },
  collections: {
    primary: ['Claude collection', 'configuration bundle', 'starter kit', 'preset collection'],
    modifiers: ['full-stack', 'backend', 'frontend', 'DevOps', 'data science'],
    intentModifiers: ['examples', 'setup guide', 'best practices'],
    avoidTerms: ['incomplete', 'outdated'],
  },
  guides: {
    primary: ['Claude guide', 'tutorial', 'how-to guide', 'best practices'],
    modifiers: ['beginner', 'advanced', 'production', 'enterprise', 'optimization'],
    intentModifiers: ['step-by-step', 'complete guide', 'best practices', 'examples'],
    avoidTerms: ['outdated', 'deprecated'],
  },
  jobs: {
    primary: ['AI job', 'Claude developer', 'MCP developer', 'AI automation'],
    modifiers: ['remote', 'senior', 'junior', 'contract', 'full-time'],
    intentModifiers: ['hiring', 'job posting', 'career'],
    avoidTerms: ['expired', 'closed'],
  },
  changelog: {
    primary: ['changelog', 'release notes', 'updates', 'version history'],
    modifiers: ['latest', 'breaking changes', 'new features', 'improvements'],
    intentModifiers: ['what changed', 'migration guide', 'upgrade guide'],
    avoidTerms: ['old', 'archived'],
  },
} as const;

/**
 * Generate longtail keyword query for WebSearch
 *
 * Combines primary keyword with modifiers and intent for targeted discovery.
 *
 * @param category - Content category
 * @param intent - Search intent type
 * @returns WebSearch query string
 */
export function generateLongtailQuery(
  category: CategoryId,
  intent: 'trending' | 'tutorial' | 'examples' | 'best_practices' = 'trending'
): string {
  const strategy = KEYWORD_STRATEGIES[category];

  // Build query from primary keyword + modifier + intent
  const primary = strategy.primary[0]; // Use first primary keyword
  const modifier = strategy.modifiers[Math.floor(Math.random() * strategy.modifiers.length)];
  const intentModifier = strategy.intentModifiers[0]; // Use first intent modifier

  // Construct longtail query
  const queries: Record<typeof intent, string> = {
    trending: `${modifier} ${primary} trending 2025 GitHub Reddit`,
    tutorial: `${modifier} ${primary} ${intentModifier} tutorial 2025`,
    examples: `${modifier} ${primary} examples ${intentModifier} 2025`,
    best_practices: `${primary} best practices ${modifier} 2025`,
  };

  return queries[intent];
}

/**
 * Content Gap Analysis Configuration
 *
 * Rules for identifying gaps in existing content.
 */
export const CONTENT_GAP_RULES = {
  /** Check existing content before generating */
  checkExisting: true,

  /** Minimum content threshold per category */
  minContentThreshold: {
    statuslines: 10, // Want at least 10 statuslines
    hooks: 20, // Want at least 20 hooks
    mcp: 50, // Want at least 50 MCP servers
    rules: 10,
    commands: 15,
    agents: 10,
    skills: 10,
    collections: 5,
  } as Partial<Record<CategoryId, number>>,

  /** Priority gap types */
  prioritizeGaps: [
    'high_demand_no_supply', // High search volume, no content
    'trending_early_stage', // Emerging trends, early mover advantage
    'evergreen_underserved', // Consistent demand, poor existing content
    'technology_integration', // New tech integrations (e.g., new MCP servers)
  ] as const,
} as const;

/**
 * Trend Prediction Signals
 *
 * Leading indicators for predicting future trends (3-6 months ahead).
 */
export const TREND_PREDICTION_SIGNALS = {
  signals: [
    {
      name: 'github_star_velocity',
      description: 'Rapid star growth on GitHub repositories',
      weight: 0.3,
      threshold: 50, // Stars per week
    },
    {
      name: 'npm_download_trends',
      description: 'Download acceleration for npm packages',
      weight: 0.25,
      threshold: 1000, // Downloads per week increase
    },
    {
      name: 'social_mention_spike',
      description: 'Spike in Twitter/Reddit/HN mentions',
      weight: 0.2,
      threshold: 20, // Mentions per day
    },
    {
      name: 'stackoverflow_question_rate',
      description: 'Increasing question frequency on Stack Overflow',
      weight: 0.15,
      threshold: 5, // Questions per week
    },
    {
      name: 'conference_talk_mentions',
      description: 'Topics appearing in conference talks',
      weight: 0.1,
      threshold: 3, // Conference mentions
    },
  ] as const,

  /** Lead time for predictions (how far ahead to predict) */
  leadTime: '3_months' as const,

  /** Minimum confidence threshold for predictions */
  minConfidence: 0.7, // 70% confidence
} as const;
