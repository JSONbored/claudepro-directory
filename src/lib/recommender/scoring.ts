/**
 * Recommendation Scoring Utilities
 *
 * Individual scoring functions for different recommendation factors.
 * Each function returns a normalized score (0-100) that gets weighted
 * in the main algorithm.
 *
 * Design principles:
 * - Pure functions (no side effects)
 * - Defensive programming (handle missing data)
 * - Transparent scoring logic
 * - Optimized for performance
 */

import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import type {
  UseCase,
  ExperienceLevel,
  ToolPreference,
  IntegrationNeed,
  FocusArea,
  QuizAnswers,
} from '@/src/lib/schemas/recommender.schema';

/**
 * Use Case to Tag Mapping
 * Maps user use cases to relevant configuration tags
 */
const USE_CASE_TAG_MAP: Record<UseCase, string[]> = {
  'code-review': ['code-review', 'review', 'quality', 'refactor', 'best-practices', 'linting'],
  'api-development': ['api', 'rest', 'graphql', 'backend', 'microservices', 'fastapi', 'express'],
  'frontend-development': [
    'frontend',
    'react',
    'vue',
    'ui',
    'component',
    'web',
    'javascript',
    'typescript',
  ],
  'data-science': [
    'data',
    'analytics',
    'python',
    'jupyter',
    'pandas',
    'numpy',
    'machine-learning',
    'ml',
  ],
  'content-creation': [
    'documentation',
    'writing',
    'content',
    'blog',
    'markdown',
    'technical-writing',
  ],
  'devops-infrastructure': [
    'devops',
    'infrastructure',
    'deployment',
    'docker',
    'kubernetes',
    'ci-cd',
    'aws',
    'cloud',
  ],
  'general-development': ['development', 'coding', 'programming', 'general', 'productivity'],
  'testing-qa': ['testing', 'qa', 'test', 'quality', 'automation', 'unit-test', 'integration'],
  'security-audit': ['security', 'audit', 'vulnerability', 'compliance', 'penetration', 'scan'],
};

/**
 * Use Case to Category Boost
 * Certain categories are better for specific use cases
 */
const USE_CASE_CATEGORY_BOOST: Record<UseCase, Partial<Record<ToolPreference, number>>> = {
  'code-review': { agents: 1.2, rules: 1.1, commands: 1.0 },
  'api-development': { agents: 1.2, mcp: 1.1, commands: 1.0 },
  'frontend-development': { agents: 1.1, rules: 1.0, commands: 1.1 },
  'data-science': { mcp: 1.2, agents: 1.1, hooks: 1.0 },
  'content-creation': { agents: 1.2, rules: 1.1, commands: 1.0 },
  'devops-infrastructure': { mcp: 1.2, hooks: 1.1, commands: 1.0 },
  'general-development': { agents: 1.0, rules: 1.0, commands: 1.0 },
  'testing-qa': { commands: 1.2, agents: 1.1, hooks: 1.0 },
  'security-audit': { commands: 1.2, agents: 1.1, rules: 1.0 },
};

/**
 * Integration to Tag Mapping
 * Maps integration needs to relevant tags
 */
const INTEGRATION_TAG_MAP: Record<IntegrationNeed, string[]> = {
  github: ['github', 'git', 'version-control', 'repository'],
  database: ['database', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'db'],
  'cloud-aws': ['aws', 'amazon', 's3', 'lambda', 'ec2', 'cloud'],
  'cloud-gcp': ['gcp', 'google-cloud', 'cloud'],
  'cloud-azure': ['azure', 'microsoft', 'cloud'],
  communication: ['slack', 'discord', 'email', 'notification', 'webhook'],
  none: [],
};

/**
 * Focus Area to Tag Mapping
 */
const FOCUS_AREA_TAG_MAP: Record<FocusArea, string[]> = {
  security: ['security', 'auth', 'encryption', 'vulnerability', 'compliance'],
  performance: ['performance', 'optimization', 'speed', 'cache', 'efficient'],
  documentation: ['documentation', 'docs', 'readme', 'guide', 'tutorial'],
  testing: ['test', 'testing', 'qa', 'quality', 'validation'],
  'code-quality': ['quality', 'clean-code', 'best-practices', 'refactor', 'linting'],
  automation: ['automation', 'workflow', 'ci-cd', 'pipeline', 'deploy'],
};

/**
 * Calculate use case match score
 * Checks if configuration tags match the user's primary use case
 */
export function calculateUseCaseScore(item: UnifiedContentItem, useCase: UseCase): number {
  const relevantTags = USE_CASE_TAG_MAP[useCase];
  if (!relevantTags || !item.tags || item.tags.length === 0) {
    return 0;
  }

  const itemTags = item.tags.map((t) => t.toLowerCase());
  const matchCount = relevantTags.filter((tag) => itemTags.some((it) => it.includes(tag))).length;

  // Calculate base score (0-100)
  const baseScore = (matchCount / relevantTags.length) * 100;

  // Apply category-specific boost
  const categoryBoost = USE_CASE_CATEGORY_BOOST[useCase][item.category as ToolPreference] || 1.0;

  return Math.min(100, baseScore * categoryBoost);
}

/**
 * Calculate category match score
 * Checks if configuration category matches user's tool preferences
 */
export function calculateCategoryScore(
  item: UnifiedContentItem,
  toolPreferences: ToolPreference[]
): number {
  if (toolPreferences.length === 0) {
    return 50; // Neutral score if no preference
  }

  // Direct category match
  const isMatch = toolPreferences.includes(item.category as ToolPreference);

  // Collections can contain multiple types, so give partial credit
  if (item.category === 'collections' && toolPreferences.length > 1) {
    return 70; // Collections are versatile
  }

  return isMatch ? 100 : 0;
}

/**
 * Calculate experience level match score
 * Filters configurations by complexity/difficulty
 */
export function calculateExperienceScore(
  item: UnifiedContentItem,
  experienceLevel: ExperienceLevel
): number {
  const itemTags = item.tags?.map((t) => t.toLowerCase()) || [];

  // Check explicit difficulty tags
  const hasBeginner =
    itemTags.includes('beginner') ||
    itemTags.includes('beginner-friendly') ||
    itemTags.includes('simple');
  const hasAdvanced =
    itemTags.includes('advanced') || itemTags.includes('expert') || itemTags.includes('complex');

  // Check feature count as complexity indicator
  const featureCount = item.features?.length || 0;
  const isComplex = featureCount > 10 || hasAdvanced;
  const isSimple = featureCount <= 5 || hasBeginner;

  switch (experienceLevel) {
    case 'beginner':
      if (hasAdvanced || isComplex) return 30; // Penalize complex configs
      if (hasBeginner || isSimple) return 100; // Prefer simple configs
      return 70; // Neutral configs are okay

    case 'intermediate':
      return 100; // Intermediate users can handle anything

    case 'advanced':
      if (hasAdvanced || isComplex) return 100; // Prefer complex configs
      if (hasBeginner && !isSimple) return 80; // Don't exclude simple configs entirely
      return 90; // Most configs are suitable

    default:
      return 100;
  }
}

/**
 * Calculate integration match score
 * Checks if configuration supports required integrations
 */
export function calculateIntegrationScore(
  item: UnifiedContentItem,
  integrations: IntegrationNeed[]
): number {
  if (integrations.length === 0 || integrations.includes('none')) {
    return 100; // No integration requirements
  }

  const itemTags = item.tags?.map((t) => t.toLowerCase()) || [];

  // Also check in description and title
  const searchableText = [
    item.title?.toLowerCase() || '',
    item.description.toLowerCase(),
    ...itemTags,
  ].join(' ');

  let matchCount = 0;
  for (const integration of integrations) {
    const relevantTags = INTEGRATION_TAG_MAP[integration];
    const hasMatch = relevantTags.some((tag) => searchableText.includes(tag));
    if (hasMatch) matchCount++;
  }

  return (matchCount / integrations.length) * 100;
}

/**
 * Calculate focus area match score
 * Checks if configuration aligns with user's focus areas
 */
export function calculateFocusAreaScore(
  item: UnifiedContentItem,
  focusAreas: FocusArea[]
): number {
  if (focusAreas.length === 0) {
    return 100; // No specific focus
  }

  const itemTags = item.tags?.map((t) => t.toLowerCase()) || [];
  const searchableText = [
    item.title?.toLowerCase() || '',
    item.description.toLowerCase(),
    ...itemTags,
  ].join(' ');

  let matchCount = 0;
  for (const focusArea of focusAreas) {
    const relevantTags = FOCUS_AREA_TAG_MAP[focusArea];
    const hasMatch = relevantTags.some((tag) => searchableText.includes(tag));
    if (hasMatch) matchCount++;
  }

  return (matchCount / focusAreas.length) * 100;
}

/**
 * Calculate general tag match score
 * Additional scoring for any matching tags beyond specific categories
 */
export function calculateTagScore(item: UnifiedContentItem, answers: QuizAnswers): number {
  if (!item.tags || item.tags.length === 0) {
    return 0;
  }

  const itemTags = item.tags.map((t) => t.toLowerCase());

  // Collect all relevant tags from user answers
  const relevantTags = [
    ...(USE_CASE_TAG_MAP[answers.useCase] || []),
    ...(answers.integrations?.flatMap((i) => INTEGRATION_TAG_MAP[i]) || []),
    ...(answers.focusAreas?.flatMap((f) => FOCUS_AREA_TAG_MAP[f]) || []),
  ];

  const uniqueRelevantTags = [...new Set(relevantTags)];
  const matchCount = uniqueRelevantTags.filter((tag) =>
    itemTags.some((it) => it.includes(tag))
  ).length;

  // Small bonus for additional tag matches
  return Math.min(100, (matchCount / Math.max(1, uniqueRelevantTags.length)) * 50);
}

/**
 * Calculate popularity boost
 * Gives small boost to popular configurations
 */
export function calculatePopularityBoost(item: UnifiedContentItem): number {
  // Check popularity field (0-100)
  if (item.popularity !== undefined) {
    return item.popularity;
  }

  // Check view count as proxy
  if (item.viewCount !== undefined && item.viewCount > 0) {
    // Normalize view count (assuming 1000+ views = highly popular)
    return Math.min(100, (item.viewCount / 1000) * 100);
  }

  // No popularity data
  return 50; // Neutral score
}

/**
 * Calculate trending boost
 * Gives small boost to trending configurations
 */
export function calculateTrendingBoost(item: UnifiedContentItem): number {
  if (item.growthRate !== undefined) {
    // Growth rate is a multiplier (e.g., 1.5 = 50% growth)
    // Convert to 0-100 score (1.0 = 50, 2.0 = 100)
    return Math.min(100, Math.max(0, (item.growthRate - 0.5) * 100));
  }

  return 50; // Neutral score
}

/**
 * Calculate team size relevance
 * Some configurations are better for teams vs solo developers
 */
export function calculateTeamSizeRelevance(
  item: UnifiedContentItem,
  teamSize?: 'solo' | 'small' | 'large'
): number {
  if (!teamSize) {
    return 100; // No preference
  }

  const itemTags = item.tags?.map((t) => t.toLowerCase()) || [];
  const searchableText = [
    item.title?.toLowerCase() || '',
    item.description.toLowerCase(),
    ...itemTags,
  ].join(' ');

  const teamKeywords = ['team', 'collaboration', 'shared', 'multi-user', 'workspace'];
  const hasTeamFeatures = teamKeywords.some((keyword) => searchableText.includes(keyword));

  switch (teamSize) {
    case 'solo':
      // Solo developers might not want team-heavy tools
      return hasTeamFeatures ? 70 : 100;

    case 'small':
      // Small teams benefit from any config
      return 100;

    case 'large':
      // Large teams benefit from collaboration features
      return hasTeamFeatures ? 110 : 90;

    default:
      return 100;
  }
}
