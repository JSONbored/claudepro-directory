/**
 * Collection Factory
 *
 * Generates realistic content collections (curated lists).
 *
 * @see src/lib/schemas/content/collection.schema.ts
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { CollectionContent } from '@/src/lib/schemas/content/collection.schema';
import { usageExampleFactory } from '../shared/usage-example.factory';

interface CollectionFactoryTransientParams {
  tagCount?: number;
  itemCount?: number;
  exampleCount?: number;
}

export const collectionFactory = Factory.define<
  CollectionContent,
  CollectionFactoryTransientParams
>(({ sequence, transientParams }) => {
  const {
    tagCount = faker.number.int({ min: 1, max: 4 }),
    itemCount = faker.number.int({ min: 3, max: 10 }),
    exampleCount = faker.number.int({ min: 0, max: 2 }),
  } = transientParams;

  const collectionName = faker.helpers.arrayElement([
    'Essential TypeScript Agents',
    'Security Best Practices',
    'Performance Optimization Kit',
    'Testing Automation Suite',
    'Documentation Toolkit',
    'Code Review Essentials',
  ]);

  const slug =
    faker.helpers.slugify(collectionName).toLowerCase() + (sequence > 1 ? `-${sequence}` : '');

  const collectionType = faker.helpers.arrayElement([
    'starter-kit',
    'workflow',
    'advanced-system',
    'use-case',
  ] as const);

  const difficulty = faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced'] as const);

  return {
    slug,
    category: 'collections' as const,
    collectionType,
    difficulty,
    title: collectionName,
    description: faker.lorem.sentence({ min: 10, max: 25 }),
    author: faker.internet.username().toLowerCase(),
    dateAdded: faker.date.past({ years: 1 }).toISOString(),
    tags: faker.helpers.arrayElements(
      [
        'curated',
        'collection',
        'typescript',
        'security',
        'performance',
        'testing',
        'documentation',
        'best-practices',
      ],
      { min: tagCount, max: tagCount }
    ),
    content: faker.lorem.paragraphs({ min: 2, max: 4 }, '\n\n'),
    source: faker.helpers.maybe(
      () => faker.helpers.arrayElement(['community', 'official', 'verified', 'claudepro'] as const),
      { probability: 0.5 }
    ),
    documentationUrl: faker.helpers.maybe(() => faker.internet.url() + '/docs', {
      probability: 0.4,
    }),
    features: faker.helpers.maybe(
      () =>
        Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
          faker.lorem.sentence({ min: 3, max: 8 })
        ),
      { probability: 0.7 }
    ),
    useCases: faker.helpers.maybe(
      () =>
        Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () =>
          faker.lorem.sentence({ min: 4, max: 10 })
        ),
      { probability: 0.6 }
    ),
    items: Array.from({ length: itemCount }, () => ({
      category: faker.helpers.arrayElement([
        'agents',
        'mcp',
        'commands',
        'rules',
        'hooks',
        'statuslines',
      ] as const),
      slug: faker.helpers.slugify(faker.word.words(2)).toLowerCase(),
    })),
    usageExamples: exampleCount > 0 ? usageExampleFactory.buildList(exampleCount) : undefined,
  };
});
