/**
 * Statusline Factory
 *
 * Generates realistic status line configurations for CLI tools.
 *
 * @see src/lib/schemas/content/statusline.schema.ts
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { StatuslineContent } from '@/src/lib/schemas/content/statusline.schema';
import { usageExampleFactory } from '../shared/usage-example.factory';

interface StatuslineFactoryTransientParams {
  tagCount?: number;
  exampleCount?: number;
}

export const statuslineFactory = Factory.define<StatuslineContent, StatuslineFactoryTransientParams>(
  ({ sequence, transientParams }) => {
    const { tagCount = faker.number.int({ min: 1, max: 4 }), exampleCount = faker.number.int({ min: 0, max: 2 }) } =
      transientParams;

    const statuslineName = faker.helpers.arrayElement([
      'Git Branch Statusline',
      'NPM Scripts Statusline',
      'Project Info Statusline',
      'Build Status Statusline',
      'Test Coverage Statusline',
      'Environment Statusline',
    ]);

    const statuslineType = faker.helpers.arrayElement([
      'minimal',
      'powerline',
      'custom',
      'rich',
      'simple',
    ] as const);

    const slug = faker.helpers.slugify(statuslineName).toLowerCase() + (sequence > 1 ? `-${sequence}` : '');

    return {
      slug,
      category: 'statuslines' as const,
      statuslineType,
      title: statuslineName,
      description: faker.lorem.sentence({ min: 8, max: 18 }),
      author: faker.internet.username().toLowerCase(),
      dateAdded: faker.date.past({ years: 1 }).toISOString(),
      tags: faker.helpers.arrayElements(
        ['git', 'npm', 'cli', 'statusline', 'terminal', 'automation', 'productivity'],
        { min: tagCount, max: tagCount }
      ),
      content: faker.helpers.arrayElement([
        'git rev-parse --abbrev-ref HEAD',
        'npm run',
        'echo $NODE_ENV',
        'git status --short',
      ]),
      source: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['community', 'official', 'verified', 'claudepro'] as const),
        { probability: 0.4 }
      ),
      documentationUrl: faker.helpers.maybe(() => faker.internet.url() + '/docs', { probability: 0.3 }),
      features: faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () =>
            faker.lorem.sentence({ min: 3, max: 7 })
          ),
        { probability: 0.6 }
      ),
      useCases: faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
            faker.lorem.sentence({ min: 4, max: 9 })
          ),
        { probability: 0.5 }
      ),
      usageExamples: exampleCount > 0 ? usageExampleFactory.buildList(exampleCount) : undefined,
      configuration: {
        format: faker.helpers.arrayElement(['bash', 'python', 'javascript'] as const),
        refreshInterval: faker.number.int({ min: 1000, max: 10000 }),
        position: faker.helpers.arrayElement(['left', 'center', 'right'] as const),
      },
    };
  }
);
