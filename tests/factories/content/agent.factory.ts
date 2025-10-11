/**
 * Agent Content Factory
 *
 * Generates realistic AI agent configurations for testing.
 * Matches production agent JSON structure and validates against schema.
 *
 * **Features:**
 * - Type-safe using Zod schema inference
 * - Realistic data using Faker (slugs, descriptions, dates, URLs)
 * - Support for optional fields (configuration, installation)
 * - Transient params for custom generation logic
 *
 * **Usage:**
 * ```ts
 * import { agentFactory } from '@/tests/factories';
 *
 * // Generate agent with defaults
 * const agent = agentFactory.build();
 *
 * // Generate featured agent
 * const featured = agentFactory.build({ featured: true });
 *
 * // Generate multiple agents
 * const agents = agentFactory.buildList(10);
 *
 * // Custom tags
 * const taggedAgent = agentFactory.build({
 *   tags: ['code-review', 'typescript', 'best-practices']
 * });
 * ```
 *
 * @see src/lib/schemas/content/agent.schema.ts
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import type { AgentContent } from '@/src/lib/schemas/content/agent.schema';
import { usageExampleFactory } from '../shared/usage-example.factory';

interface AgentFactoryTransientParams {
  withConfiguration?: boolean;
  withInstallation?: boolean;
  tagCount?: number;
  exampleCount?: number;
}

export const agentFactory = Factory.define<AgentContent, AgentFactoryTransientParams>(
  ({ sequence, transientParams }) => {
    const {
      withConfiguration = faker.datatype.boolean(),
      withInstallation = faker.datatype.boolean({ probability: 0.3 }),
      tagCount = faker.number.int({ min: 1, max: 5 }),
      exampleCount = faker.number.int({ min: 0, max: 3 }),
    } = transientParams;

    const agentName = faker.helpers.arrayElement([
      'Code Review Agent',
      'Documentation Generator',
      'Test Writer',
      'Refactoring Assistant',
      'Security Auditor',
      'Performance Optimizer',
      'Bug Finder',
      'Architecture Advisor',
    ]);

    const slug = faker.helpers.slugify(agentName).toLowerCase() + (sequence > 1 ? `-${sequence}` : '');

    return {
      slug,
      category: 'agents' as const,
      title: agentName,
      description: faker.lorem.sentence({ min: 10, max: 25 }),
      author: faker.internet.username().toLowerCase(),
      dateAdded: faker.date.past({ years: 1 }).toISOString(),
      tags: faker.helpers.arrayElements(
        [
          'code-review',
          'documentation',
          'testing',
          'refactoring',
          'security',
          'performance',
          'typescript',
          'python',
          'javascript',
          'best-practices',
          'automation',
        ],
        { min: tagCount, max: tagCount }
      ),
      content: faker.lorem.paragraphs({ min: 2, max: 4 }, '\n\n'),
      source: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['community', 'official', 'verified', 'claudepro'] as const),
        { probability: 0.7 }
      ),
      documentationUrl: faker.helpers.maybe(() => faker.internet.url() + '/docs', {
        probability: 0.5,
      }),
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
      configuration: withConfiguration
        ? {
            temperature: parseFloat(faker.number.float({ min: 0, max: 1, fractionDigits: 2 }).toFixed(2)),
            maxTokens: faker.helpers.arrayElement([1000, 2000, 4000, 8000]),
            systemPrompt: faker.lorem.paragraph({ min: 1, max: 3 }),
          }
        : undefined,
      installation: withInstallation
        ? {
            npm: `npm install ${faker.helpers.slugify(agentName).toLowerCase()}`,
            steps: [
              faker.lorem.sentence(),
              faker.lorem.sentence(),
              faker.lorem.sentence(),
            ],
          }
        : undefined,
      usageExamples: exampleCount > 0 ? usageExampleFactory.buildList(exampleCount) : undefined,
    };
  }
);
