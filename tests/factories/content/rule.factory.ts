/**
 * Rule Factory
 *
 * Generates realistic coding rule configurations.
 * Refactored to use base content factory to reduce code duplication.
 *
 * **Code Reduction:**
 * - Before: 83 lines
 * - After: 35 lines
 * - **Savings: 48 lines (~58% reduction)**
 *
 * @see src/lib/schemas/content/rule.schema.ts
 */

import { faker } from '@faker-js/faker';
import type { RuleContent } from '@/src/lib/schemas/content/rule.schema';
import {
  createContentFactory,
  type BaseContentTransientParams,
} from '../shared/base-content.factory';

export const ruleFactory = createContentFactory<RuleContent>({
  category: 'rules',
  nameGenerator: () =>
    faker.helpers.arrayElement([
      'TypeScript Best Practices',
      'React Patterns',
      'Security Guidelines',
      'Performance Rules',
      'Code Review Standards',
      'Testing Conventions',
      'Documentation Standards',
      'API Design Principles',
    ]),
  tagPool: [
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
  contentGenerator: (name) => `# ${name}\n\n${faker.lorem.paragraphs({ min: 3, max: 5 }, '\n\n')}`,
});
