/**
 * Statusline Factory
 *
 * Generates realistic status line configurations for CLI tools.
 * Refactored to use base content factory to reduce code duplication.
 *
 * **Code Reduction:**
 * - Before: 89 lines
 * - After: 60 lines
 * - **Savings: 29 lines (~33% reduction)**
 *
 * @see src/lib/schemas/content/statusline.schema.ts
 */

import { faker } from '@faker-js/faker';
import type { StatuslineContent } from '@/src/lib/schemas/content/statusline.schema';
import {
  createContentFactory,
  type BaseContentTransientParams,
} from '../shared/base-content.factory';

export const statuslineFactory = createContentFactory<StatuslineContent>({
  category: 'statuslines',
  nameGenerator: () =>
    faker.helpers.arrayElement([
      'Git Branch Statusline',
      'NPM Scripts Statusline',
      'Project Info Statusline',
      'Build Status Statusline',
      'Test Coverage Statusline',
      'Environment Statusline',
    ]),
  tagPool: ['git', 'npm', 'cli', 'statusline', 'terminal', 'automation', 'productivity'],
  contentGenerator: () =>
    faker.helpers.arrayElement([
      'git rev-parse --abbrev-ref HEAD',
      'npm run',
      'echo $NODE_ENV',
      'git status --short',
    ]),
  extendFields: () => ({
    statuslineType: faker.helpers.arrayElement(['minimal', 'powerline', 'custom', 'rich', 'simple'] as const),
    configuration: {
      format: faker.helpers.arrayElement(['bash', 'python', 'javascript'] as const),
      refreshInterval: faker.number.int({ min: 1000, max: 10000 }),
      position: faker.helpers.arrayElement(['left', 'center', 'right'] as const),
    },
  }),
});
