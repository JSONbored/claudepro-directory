/**
 * Rule Factory
 *
 * Generates realistic coding rule configurations.
 *
 * @see src/lib/schemas/content/rule.schema.ts
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { RuleContent } from '@/src/lib/schemas/content/rule.schema';
import { usageExampleFactory } from '../shared/usage-example.factory';

interface RuleFactoryTransientParams {
  tagCount?: number;
  exampleCount?: number;
}

export const ruleFactory = Factory.define<RuleContent, RuleFactoryTransientParams>(
  ({ sequence, transientParams }) => {
    const { tagCount = faker.number.int({ min: 1, max: 5 }), exampleCount = faker.number.int({ min: 0, max: 3 }) } =
      transientParams;

    const ruleName = faker.helpers.arrayElement([
      'TypeScript Best Practices',
      'React Patterns',
      'Security Guidelines',
      'Performance Rules',
      'Code Review Standards',
      'Testing Conventions',
      'Documentation Standards',
      'API Design Principles',
    ]);

    const slug = faker.helpers.slugify(ruleName).toLowerCase() + (sequence > 1 ? `-${sequence}` : '');

    return {
      slug,
      category: 'rules' as const,
      title: ruleName,
      description: faker.lorem.sentence({ min: 10, max: 22 }),
      author: faker.internet.username().toLowerCase(),
      dateAdded: faker.date.past({ years: 1 }).toISOString(),
      tags: faker.helpers.arrayElements(
        [
          'typescript',
          'react',
          'security',
          'performance',
          'best-practices',
          'testing',
          'documentation',
          'api-design',
          'code-quality',
          'patterns',
        ],
        { min: tagCount, max: tagCount }
      ),
      content: `# ${ruleName}\n\n${faker.lorem.paragraphs({ min: 3, max: 5 }, '\n\n')}`,
      source: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['community', 'official', 'verified', 'claudepro'] as const),
        { probability: 0.6 }
      ),
      documentationUrl: faker.helpers.maybe(() => faker.internet.url() + '/docs', { probability: 0.5 }),
      features: faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () =>
            faker.lorem.sentence({ min: 3, max: 8 })
          ),
        { probability: 0.8 }
      ),
      useCases: faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
            faker.lorem.sentence({ min: 4, max: 10 })
          ),
        { probability: 0.7 }
      ),
      usageExamples: exampleCount > 0 ? usageExampleFactory.buildList(exampleCount) : undefined,
    };
  }
);
