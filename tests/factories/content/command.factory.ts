/**
 * Command Factory
 *
 * Generates realistic slash command configurations for Claude Code.
 * Refactored to use base content factory to reduce code duplication.
 *
 * **Code Reduction:**
 * - Before: 83 lines
 * - After: 30 lines
 * - **Savings: 53 lines (~64% reduction)**
 *
 * @see src/lib/schemas/content/command.schema.ts
 */

import { faker } from '@faker-js/faker';
import type { CommandContent } from '@/src/lib/schemas/content/command.schema';
import {
  createContentFactory,
  type BaseContentTransientParams,
} from '../shared/base-content.factory';

export const commandFactory = createContentFactory<CommandContent>({
  category: 'commands',
  nameGenerator: () => {
    const verb = faker.helpers.arrayElement([
      'refactor',
      'explain',
      'document',
      'test',
      'review',
      'optimize',
      'debug',
      'analyze',
    ]);
    return `/${verb}`;
  },
  tagPool: [
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
  contentGenerator: (name) => `# ${name}\n\n${faker.lorem.paragraphs({ min: 2, max: 3 }, '\n\n')}`,
  slugGenerator: (name, sequence) => name.replace('/', '') + (sequence > 1 ? `-${sequence}` : ''),
});
