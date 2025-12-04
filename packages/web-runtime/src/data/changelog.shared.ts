import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { z } from 'zod';

import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';
import { generateRequestId } from '../utils/request-id.ts';

// Support both formats:
// 1. Array of objects: [{ content: "..." }]
// 2. Array of strings: ["...", "..."]
const changeItemSchema = z.union([z.object({ content: z.string() }), z.string()]);

// Transform strings to objects for consistency
const changeItemSchemaTransformed = changeItemSchema.transform((item) =>
  typeof item === 'string' ? { content: item } : item
);

const changesSchema = z
  .object({
    Added: z.array(changeItemSchemaTransformed).optional(),
    Changed: z.array(changeItemSchemaTransformed).optional(),
    Fixed: z.array(changeItemSchemaTransformed).optional(),
    Removed: z.array(changeItemSchemaTransformed).optional(),
    Deprecated: z.array(changeItemSchemaTransformed).optional(),
    Security: z.array(changeItemSchemaTransformed).optional(),
  })
  .refine(
    (data) => {
      const validCategories = Constants.public.Enums.changelog_category;
      const dataKeys = Object.keys(data);
      return dataKeys.every((key) =>
        validCategories.includes(key as Database['public']['Enums']['changelog_category'])
      );
    },
    { message: 'Invalid changelog category in changes object' }
  );

export type ChangelogChanges = z.infer<typeof changesSchema>;

export function parseChangelogChanges(changes: unknown, requestId?: string): ChangelogChanges {
  try {
    return changesSchema.parse(changes);
  } catch (error) {
    // Only create logger on error to avoid wasting work on successful path
    const errorRequestId = requestId ?? generateRequestId();
    const reqLogger = logger.child({
      requestId: errorRequestId,
      operation: 'parseChangelogChanges',
      route: 'utility-function', // Utility function - no specific route
      module: 'packages/web-runtime/src/data/changelog',
    });
    const normalized = normalizeError(error, 'Failed to parse changelog changes');
    reqLogger.error('Failed to parse changelog changes', normalized);
    return {};
  }
}
