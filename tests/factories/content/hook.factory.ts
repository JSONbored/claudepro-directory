/**
 * Hook Factory
 *
 * Generates realistic Git hook configurations.
 * Refactored to use base content factory to reduce code duplication.
 *
 * **Code Reduction:**
 * - Before: 94 lines
 * - After: 70 lines
 * - **Savings: 24 lines (~26% reduction)**
 *
 * @see src/lib/schemas/content/hook.schema.ts
 */

import { faker } from '@faker-js/faker';
import type { HookContent } from '@/src/lib/schemas/content/hook.schema';
import { createContentFactory } from '../shared/base-content.factory';

export const hookFactory = createContentFactory<HookContent>({
  category: 'hooks',
  nameGenerator: () => {
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
    return `${hookType} ${action.charAt(0).toUpperCase() + action.slice(1)}`;
  },
  slugGenerator: (name, sequence) => {
    const parts = name.split(' ');
    const hookType = parts.slice(0, -1).join(' ');
    const action = parts[parts.length - 1].toLowerCase();
    return (
      `${faker.helpers.slugify(hookType).toLowerCase()}-${action}` +
      (sequence > 1 ? `-${sequence}` : '')
    );
  },
  tagPool: [
    'git',
    'pre-commit',
    'post-merge',
    'linting',
    'testing',
    'automation',
    'ci-cd',
    'quality',
  ],
  contentGenerator: (name) => {
    const action = name.split(' ').pop()?.toLowerCase() || 'lint';
    return `npm run ${action}`;
  },
  extendFields: ({ name }) => {
    const parts = name.split(' ');
    const hookType = parts.slice(0, -1).join('') as HookContent['hookType'];
    const action = parts[parts.length - 1].toLowerCase();

    return {
      hookType,
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
  },
});
