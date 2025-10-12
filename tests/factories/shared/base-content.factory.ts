/**
 * Base Content Factory
 *
 * Provides shared factory utilities for all content types to reduce code duplication.
 * Consolidates common field generation logic across agent, command, mcp, hook, rule, and statusline factories.
 *
 * **Reduces Code Duplication:**
 * - Before: ~100-150 LOC duplicated per factory × 6 factories = ~600-900 LOC
 * - After: ~150 LOC base factory + ~40-60 LOC per specific factory × 6 = ~390-510 LOC
 * - **Savings: ~210-390 LOC (~35-45% reduction)**
 *
 * **Common Fields Generated:**
 * - slug (with sequence support)
 * - category
 * - Basic metadata (title, description, author, dateAdded)
 * - Tags (with configurable count and pool)
 * - Content (with optional markdown formatting)
 * - source (with probability)
 * - documentationUrl (with probability)
 * - features array (with probability)
 * - useCases array (with probability)
 * - usageExamples (with count support)
 *
 * **Usage:**
 * ```ts
 * import { createContentFactory } from '@/tests/factories/shared/base-content.factory';
 *
 * export const agentFactory = createContentFactory<AgentContent>({
 *   category: 'agents',
 *   nameGenerator: () => faker.helpers.arrayElement(['Code Review Agent', ...]),
 *   tagPool: ['code-review', 'typescript', ...],
 *   contentGenerator: (name) => faker.lorem.paragraphs(3),
 * });
 * ```
 *
 * @module tests/factories/shared/base-content.factory
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { UsageExample } from '@/src/lib/schemas/content/shared.schema';
import { usageExampleFactory } from './usage-example.factory';

/**
 * Common source types for all content
 */
export type ContentSource = 'community' | 'official' | 'verified' | 'claudepro';

/**
 * Base content fields shared across all content types
 * (These are common to agent, command, mcp, hook, rule, statusline)
 */
export interface BaseContentFields {
  slug: string;
  category: string;
  title: string;
  description: string;
  author: string;
  dateAdded: string;
  tags: string[];
  content: string;
  source?: ContentSource;
  documentationUrl?: string;
  features?: string[];
  useCases?: string[];
  usageExamples?: UsageExample[];
}

/**
 * Transient parameters for content generation
 */
export interface BaseContentTransientParams {
  /** Number of tags to generate (default: 1-5) */
  tagCount?: number;
  /** Number of usage examples to generate (default: 0-3) */
  exampleCount?: number;
  /** Whether to include features array */
  withFeatures?: boolean;
  /** Whether to include useCases array */
  withUseCases?: boolean;
  /** Custom features probability (0-1, default: 0.7) */
  featuresProbability?: number;
  /** Custom use cases probability (0-1, default: 0.6) */
  useCasesProbability?: number;
  /** Custom source probability (0-1, default: 0.6) */
  sourceProbability?: number;
  /** Custom documentation URL probability (0-1, default: 0.4) */
  docUrlProbability?: number;
}

/**
 * Configuration for creating a content factory
 */
export interface ContentFactoryConfig<T extends BaseContentFields> {
  /** Content category (e.g., 'agents', 'commands') */
  category: T['category'];
  /** Function to generate content-specific name/title */
  nameGenerator: () => string;
  /** Pool of tags to choose from */
  tagPool: string[];
  /** Function to generate the main content field */
  contentGenerator: (name: string, sequence: number) => string;
  /** Optional: Custom slug generator (default: slugify name) */
  slugGenerator?: (name: string, sequence: number) => string;
  /** Optional: Additional fields to generate */
  extendFields?: (params: {
    name: string;
    slug: string;
    sequence: number;
    transientParams: BaseContentTransientParams;
  }) => Partial<T>;
}

/**
 * Generate base content fields common to all content types
 *
 * @param config - Content factory configuration
 * @param sequence - Factory sequence number
 * @param transientParams - Transient parameters for generation
 * @returns Base content fields
 */
export function generateBaseContentFields<T extends BaseContentFields>(
  config: ContentFactoryConfig<T>,
  sequence: number,
  transientParams: BaseContentTransientParams = {}
): BaseContentFields {
  const {
    tagCount = faker.number.int({ min: 1, max: 5 }),
    exampleCount = faker.number.int({ min: 0, max: 3 }),
    featuresProbability = 0.7,
    useCasesProbability = 0.6,
    sourceProbability = 0.6,
    docUrlProbability = 0.4,
  } = transientParams;

  // Generate name and slug
  const name = config.nameGenerator();
  const slug = config.slugGenerator
    ? config.slugGenerator(name, sequence)
    : faker.helpers.slugify(name).toLowerCase() + (sequence > 1 ? `-${sequence}` : '');

  return {
    slug,
    category: config.category,
    title: name,
    description: faker.lorem.sentence({ min: 10, max: 25 }),
    author: faker.internet.username().toLowerCase(),
    dateAdded: faker.date.past({ years: 1 }).toISOString(),
    tags: faker.helpers.arrayElements(config.tagPool, { min: tagCount, max: tagCount }),
    content: config.contentGenerator(name, sequence),
    source: faker.helpers.maybe(
      () => faker.helpers.arrayElement(['community', 'official', 'verified', 'claudepro'] as const),
      { probability: sourceProbability }
    ),
    documentationUrl: faker.helpers.maybe(() => faker.internet.url() + '/docs', {
      probability: docUrlProbability,
    }),
    features: faker.helpers.maybe(
      () =>
        Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () =>
          faker.lorem.sentence({ min: 3, max: 8 })
        ),
      { probability: featuresProbability }
    ),
    useCases: faker.helpers.maybe(
      () =>
        Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
          faker.lorem.sentence({ min: 4, max: 10 })
        ),
      { probability: useCasesProbability }
    ),
    usageExamples: exampleCount > 0 ? usageExampleFactory.buildList(exampleCount) : undefined,
  };
}

/**
 * Create a content factory with shared base fields
 *
 * Reduces duplication by providing common field generation for all content types.
 * Specific factories extend with their unique fields.
 *
 * @param config - Content factory configuration
 * @returns Fishery factory for the content type
 *
 * @example
 * ```ts
 * export const agentFactory = createContentFactory<AgentContent>({
 *   category: 'agents',
 *   nameGenerator: () => faker.helpers.arrayElement(['Code Review Agent', 'Test Writer']),
 *   tagPool: ['code-review', 'testing', 'typescript'],
 *   contentGenerator: (name) => `# ${name}\n\n${faker.lorem.paragraphs(3)}`,
 *   extendFields: ({ name, slug }) => ({
 *     configuration: {
 *       temperature: 0.7,
 *       maxTokens: 4000,
 *     },
 *   }),
 * });
 * ```
 */
export function createContentFactory<T extends BaseContentFields>(
  config: ContentFactoryConfig<T>
): Factory<T, BaseContentTransientParams> {
  return Factory.define<T, BaseContentTransientParams>(({ sequence, transientParams }) => {
    // Generate base fields
    const baseFields = generateBaseContentFields(config, sequence, transientParams);

    // Generate extended fields if provided
    const extendedFields = config.extendFields
      ? config.extendFields({
          name: baseFields.title,
          slug: baseFields.slug,
          sequence,
          transientParams,
        })
      : ({} as Partial<T>);

    // Merge base + extended fields
    return {
      ...baseFields,
      ...extendedFields,
    } as T;
  });
}
