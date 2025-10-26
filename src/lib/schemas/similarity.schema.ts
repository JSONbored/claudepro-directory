/**
 * Content Similarity Types
 *
 * Type definitions for content similarity results.
 * Used by similarity queries and recommendation systems.
 */

import type { CategoryId } from '@/src/lib/schemas/shared.schema';

/**
 * Similarity result with metadata
 *
 * @property content_type - Properly typed as CategoryId (not string)
 * This eliminates the need for type casts in consumers
 */
export interface SimilarityResult {
  content_slug: string;
  content_type: CategoryId;
  similarity_score: number;
  similarity_factors?: Record<string, unknown>;
  calculated_at: string;
}
