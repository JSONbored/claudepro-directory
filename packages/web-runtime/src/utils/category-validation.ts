import { Constants } from '@heyclaude/database-types';
import type { Database } from '@heyclaude/database-types';

export const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isContentCategory(
  value: unknown
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
}

export function isValidCategory(
  category: string | Database['public']['Enums']['content_category'] | null | undefined
): category is Database['public']['Enums']['content_category'] {
  return (
    category !== null &&
    category !== undefined &&
    typeof category === 'string' &&
    isContentCategory(category)
  );
}

export const VALID_CATEGORIES = CONTENT_CATEGORY_VALUES;
