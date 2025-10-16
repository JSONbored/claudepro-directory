/**
 * Agent Content Factory
 *
 * Generates realistic AI agent configurations for testing.
 * Refactored to use base content factory to reduce code duplication.
 *
 * **Code Reduction:**
 * - Before: 135 lines
 * - After: 70 lines
 * - **Savings: 65 lines (~48% reduction)**
 *
 * **Usage:**
 * ```ts
 * import { agentFactory } from '@/tests/factories';
 *
 * // Generate agent with defaults
 * const agent = agentFactory.build();
 *
 * // Generate with custom configuration
 * const configured = agentFactory.build({ withConfiguration: true });
 *
 * // Generate multiple agents
 * const agents = agentFactory.buildList(10);
 * ```
 *
 * @see src/lib/schemas/content/agent.schema.ts
 */

import { faker } from '@faker-js/faker';
import type { AgentContent } from '@/src/lib/schemas/content/agent.schema';
import {
  type BaseContentTransientParams,
  createContentFactory,
} from '../shared/base-content.factory';

/** Agent-specific transient parameters */
export interface AgentFactoryTransientParams extends BaseContentTransientParams {
  withConfiguration?: boolean;
  withInstallation?: boolean;
}

export const agentFactory = createContentFactory<AgentContent>({
  category: 'agents',
  nameGenerator: () =>
    faker.helpers.arrayElement([
      'Code Review Agent',
      'Documentation Generator',
      'Test Writer',
      'Refactoring Assistant',
      'Security Auditor',
      'Performance Optimizer',
      'Bug Finder',
      'Architecture Advisor',
    ]),
  tagPool: [
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
  contentGenerator: (_name) => faker.lorem.paragraphs({ min: 2, max: 4 }, '\n\n'),
  extendFields: ({ name: _name, slug, transientParams }) => {
    const {
      withConfiguration = faker.datatype.boolean(),
      withInstallation = faker.datatype.boolean({ probability: 0.3 }),
    } = transientParams as AgentFactoryTransientParams;

    return {
      configuration: withConfiguration
        ? {
            temperature: Number.parseFloat(
              faker.number.float({ min: 0, max: 1, fractionDigits: 2 }).toFixed(2)
            ),
            maxTokens: faker.helpers.arrayElement([1000, 2000, 4000, 8000]),
            systemPrompt: faker.lorem.paragraph({ min: 1, max: 3 }),
          }
        : undefined,
      installation: withInstallation
        ? {
            npm: `npm install ${slug}`,
            steps: [faker.lorem.sentence(), faker.lorem.sentence(), faker.lorem.sentence()],
          }
        : undefined,
    };
  },
});
