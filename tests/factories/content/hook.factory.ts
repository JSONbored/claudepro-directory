/**
 * Hook Factory
 *
 * Generates realistic Git hook configurations.
 *
 * @see src/lib/schemas/content/hook.schema.ts
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { HookContent } from '@/src/lib/schemas/content/hook.schema';
import { usageExampleFactory } from '../shared/usage-example.factory';

interface HookFactoryTransientParams {
  tagCount?: number;
  exampleCount?: number;
}

export const hookFactory = Factory.define<HookContent, HookFactoryTransientParams>(
  ({ sequence, transientParams }) => {
    const { tagCount = faker.number.int({ min: 1, max: 4 }), exampleCount = faker.number.int({ min: 0, max: 2 }) } =
      transientParams;

    const hookType = faker.helpers.arrayElement([
      'PostToolUse',
      'PreToolUse',
      'SessionStart',
      'SessionEnd',
      'UserPromptSubmit',
      'Notification',
      'PreCompact',
      'Stop',
      'SubagentStop',
    ] as const);

    const action = faker.helpers.arrayElement([
      'lint',
      'test',
      'format',
      'type-check',
      'install',
      'build',
    ]);

    const slug = `${faker.helpers.slugify(hookType).toLowerCase()}-${action}` + (sequence > 1 ? `-${sequence}` : '');

    return {
      slug,
      category: 'hooks' as const,
      hookType,
      title: `${hookType} ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      description: faker.lorem.sentence({ min: 8, max: 18 }),
      author: faker.internet.username().toLowerCase(),
      dateAdded: faker.date.past({ years: 1 }).toISOString(),
      tags: faker.helpers.arrayElements(
        ['git', 'pre-commit', 'post-merge', 'linting', 'testing', 'automation', 'ci-cd', 'quality'],
        { min: tagCount, max: tagCount }
      ),
      content: `npm run ${action}`,
      source: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['community', 'official', 'verified', 'claudepro'] as const),
        { probability: 0.5 }
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
        hookConfig: {
          hooks: {
            [hookType]: {
              script: `npm run ${action}`,
              timeout: faker.number.int({ min: 5000, max: 30000 }),
              description: faker.lorem.sentence({ min: 5, max: 15 }),
            },
          },
        },
      },
    };
  }
);
