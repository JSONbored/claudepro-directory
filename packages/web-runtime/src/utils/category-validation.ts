import { content_category as ContentCategory, type content_category } from '../types/client-safe-enums.ts';

// Use client-safe enum values
const CONTENT_CATEGORY_VALUES = Object.values(ContentCategory) as readonly content_category[];

function isContentCategory(value: unknown): value is content_category {
  return typeof value === 'string' && CONTENT_CATEGORY_VALUES.includes(value as content_category);
}

export function isValidCategory(
  category: string | content_category | null | undefined
): category is content_category {
  return (
    category !== null &&
    category !== undefined &&
    typeof category === 'string' &&
    isContentCategory(category)
  );
}

export const VALID_CATEGORIES = CONTENT_CATEGORY_VALUES;
