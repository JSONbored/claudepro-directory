/**
 * Command Factory
 *
 * Generates realistic slash command configurations for Claude Code.
 *
 * @see src/lib/schemas/content/command.schema.ts
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { CommandContent } from '@/src/lib/schemas/content/command.schema';
import { usageExampleFactory } from '../shared/usage-example.factory';

interface CommandFactoryTransientParams {
  tagCount?: number;
  exampleCount?: number;
}

export const commandFactory = Factory.define<CommandContent, CommandFactoryTransientParams>(
  ({ sequence, transientParams }) => {
    const { tagCount = faker.number.int({ min: 1, max: 5 }), exampleCount = faker.number.int({ min: 0, max: 3 }) } =
      transientParams;

    const commandVerb = faker.helpers.arrayElement([
      'refactor',
      'explain',
      'document',
      'test',
      'review',
      'optimize',
      'debug',
      'analyze',
    ]);

    const slug = commandVerb + (sequence > 1 ? `-${sequence}` : '');

    return {
      slug,
      category: 'commands' as const,
      title: `/${commandVerb}`,
      description: `${faker.lorem.sentence({ min: 8, max: 20 })}`,
      author: faker.internet.username().toLowerCase(),
      dateAdded: faker.date.past({ years: 1 }).toISOString(),
      tags: faker.helpers.arrayElements(
        [
          'refactoring',
          'documentation',
          'testing',
          'code-review',
          'optimization',
          'debugging',
          'analysis',
          'typescript',
          'javascript',
          'automation',
        ],
        { min: tagCount, max: tagCount }
      ),
      content: `# /${commandVerb}\n\n${faker.lorem.paragraphs({ min: 2, max: 3 }, '\n\n')}`,
      source: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['community', 'official', 'verified', 'claudepro'] as const),
        { probability: 0.6 }
      ),
      documentationUrl: faker.helpers.maybe(() => faker.internet.url() + '/docs', { probability: 0.4 }),
      features: faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () =>
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
      usageExamples: exampleCount > 0 ? usageExampleFactory.buildList(exampleCount) : undefined,
    };
  }
);
