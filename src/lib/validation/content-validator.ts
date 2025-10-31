/**
 * Content Validation Utilities - Database-First Architecture
 * All category configs loaded from PostgreSQL via getCategoryConfig() RPC.
 */

import {
  type CategoryId,
  type ContentType,
  getCategoryConfig,
  isValidCategory,
} from '@/src/lib/config/category-config';

/**
 * Validate content data by category - database-first
 * @throws Error if category is unknown or validation fails
 */
export async function validateContentByCategory(
  data: unknown,
  category: string
): Promise<ContentType> {
  if (!isValidCategory(category)) {
    throw new Error(`Unknown content category: ${category}`);
  }

  const config = await getCategoryConfig(category as CategoryId);
  if (!config) {
    throw new Error(`Config not found for category: ${category}`);
  }

  return config.schema.parse(data) as ContentType;
}
