import { changelog_category as ChangelogCategory } from '@prisma/client';
import type { changelog_category } from '@prisma/client';
import { z } from 'zod';

import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';

// Support both formats:
// 1. Array of objects: [{ content: "..." }]
// 2. Array of strings: ["...", "..."]
const changeItemSchema = z.union([z.object({ content: z.string() }), z.string()]);

// Transform strings to objects for consistency
const changeItemSchemaTransformed = changeItemSchema.transform((item) =>
  typeof item === 'string' ? { content: item } : item
);

// Use Prisma enum object for validation (ensures sync with database)
const VALID_CHANGELOG_CATEGORIES = Object.values(
  ChangelogCategory
) as readonly changelog_category[];

const changesSchema = z
  .object({
    Added: z.array(changeItemSchemaTransformed).optional(),
    Changed: z.array(changeItemSchemaTransformed).optional(),
    Deprecated: z.array(changeItemSchemaTransformed).optional(),
    Fixed: z.array(changeItemSchemaTransformed).optional(),
    Removed: z.array(changeItemSchemaTransformed).optional(),
    Security: z.array(changeItemSchemaTransformed).optional(),
  })
  .strict() // Reject extra keys - this ensures invalid category keys are caught
  .refine(
    (data) => {
      const dataKeys = Object.keys(data);
      return dataKeys.every((key) =>
        VALID_CHANGELOG_CATEGORIES.includes(key as changelog_category)
      );
    },
    { message: 'Invalid changelog category in changes object' }
  );

export type ChangelogChanges = z.infer<typeof changesSchema>;

export function parseChangelogChanges(changes: unknown): ChangelogChanges {
  try {
    return changesSchema.parse(changes);
  } catch (error) {
    // Only create logger on error to avoid wasting work on successful path
    const reqLogger = logger.child({
      module: 'packages/web-runtime/src/data/changelog',
      operation: 'parseChangelogChanges',
      route: 'utility-function', // Utility function - no specific route
    });
    const normalized = normalizeError(error, 'Failed to parse changelog changes');
    reqLogger.error({ err: normalized }, 'Failed to parse changelog changes');
    return {};
  }
}
