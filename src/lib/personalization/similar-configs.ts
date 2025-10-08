/**
 * Similar Configs Algorithm
 * Content-based similarity with collaborative filtering boost
 *
 * Multi-Factor Similarity:
 * 1. Tag Overlap (35%) - Jaccard similarity on tags
 * 2. Category Match (20%) - Same/related categories
 * 3. Description Similarity (15%) - Keyword overlap
 * 4. Co-Bookmark Frequency (20%) - Collaborative signal
 * 5. Author Match (5%) - Same author bonus
 * 6. Popularity Correlation (5%) - Similar popularity levels
 */

import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { logger } from '@/src/lib/logger';
import { calculateJaccardSimilarity } from './collaborative-filter';

/**
 * Similarity weight configuration
 */
export const SIMILARITY_WEIGHTS = {
  tag_overlap: 0.35,
  category_match: 0.2,
  description_similarity: 0.15,
  co_bookmark: 0.2,
  author_match: 0.05,
  popularity_correlation: 0.05,
} as const;

/**
 * Related category mappings
 * Categories that are conceptually related get partial similarity boost
 */
const RELATED_CATEGORIES: Record<string, string[]> = {
  agents: ['commands', 'rules', 'collections'],
  mcp: ['agents', 'hooks', 'collections'],
  rules: ['agents', 'commands', 'collections'],
  commands: ['agents', 'rules', 'collections'],
  hooks: ['mcp', 'commands', 'collections'],
  statuslines: ['collections'],
  collections: ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines'],
};

/**
 * Calculate tag overlap similarity
 */
function calculateTagSimilarity(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) {
    return 0;
  }

  const setA = new Set(tagsA.map((t) => t.toLowerCase()));
  const setB = new Set(tagsB.map((t) => t.toLowerCase()));

  return calculateJaccardSimilarity(setA, setB);
}

/**
 * Calculate category similarity
 */
function calculateCategorySimilarity(categoryA: string, categoryB: string): number {
  // Exact match
  if (categoryA === categoryB) {
    return 1.0;
  }

  // Related categories
  const relatedA = RELATED_CATEGORIES[categoryA] || [];
  const relatedB = RELATED_CATEGORIES[categoryB] || [];

  if (relatedA.includes(categoryB) || relatedB.includes(categoryA)) {
    return 0.5;
  }

  // Collections can contain anything
  if (categoryA === 'collections' || categoryB === 'collections') {
    return 0.3;
  }

  return 0;
}

/**
 * Calculate description similarity using keyword overlap
 */
function calculateDescriptionSimilarity(descA: string, descB: string): number {
  // Extract keywords (simple word tokenization)
  const extractKeywords = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3) // Filter out short words
    );
  };

  const keywordsA = extractKeywords(descA);
  const keywordsB = extractKeywords(descB);

  if (keywordsA.size === 0 || keywordsB.size === 0) {
    return 0;
  }

  return calculateJaccardSimilarity(keywordsA, keywordsB);
}

/**
 * Calculate author match bonus
 */
function calculateAuthorMatch(authorA: string | undefined, authorB: string | undefined): number {
  if (!authorA || !authorB) {
    return 0;
  }
  return authorA.toLowerCase() === authorB.toLowerCase() ? 1.0 : 0;
}

/**
 * Calculate popularity correlation
 */
function calculatePopularityCorrelation(
  popularityA: number | undefined,
  popularityB: number | undefined
): number {
  if (popularityA === undefined || popularityB === undefined) {
    return 0.5; // Neutral if missing data
  }

  // Normalize to 0-1 range (assuming popularity is 0-100)
  const normA = popularityA / 100;
  const normB = popularityB / 100;

  // Calculate similarity (1 - absolute difference)
  return 1 - Math.abs(normA - normB);
}

/**
 * Calculate overall content similarity score
 *
 * @param itemA - First content item
 * @param itemB - Second content item
 * @param coBookmarkFrequency - How often items are bookmarked together (0-1)
 * @returns Similarity score and factor breakdown
 */
export function calculateContentSimilarity(
  itemA: UnifiedContentItem,
  itemB: UnifiedContentItem,
  coBookmarkFrequency = 0
): {
  similarity_score: number;
  factors: {
    tag_overlap: number;
    category_match: number;
    description_similarity: number;
    co_bookmark: number;
    author_match: number;
    popularity_correlation: number;
  };
} {
  // Calculate individual factors
  const tagSimilarity = calculateTagSimilarity(itemA.tags || [], itemB.tags || []);
  const categorySimilarity = calculateCategorySimilarity(itemA.category, itemB.category);
  const descriptionSimilarity = calculateDescriptionSimilarity(
    itemA.description,
    itemB.description
  );
  const authorMatch = calculateAuthorMatch(itemA.author, itemB.author);
  const popularityCorr = calculatePopularityCorrelation(itemA.popularity, itemB.popularity);

  // Calculate weighted score
  const weightedScore =
    tagSimilarity * SIMILARITY_WEIGHTS.tag_overlap +
    categorySimilarity * SIMILARITY_WEIGHTS.category_match +
    descriptionSimilarity * SIMILARITY_WEIGHTS.description_similarity +
    coBookmarkFrequency * SIMILARITY_WEIGHTS.co_bookmark +
    authorMatch * SIMILARITY_WEIGHTS.author_match +
    popularityCorr * SIMILARITY_WEIGHTS.popularity_correlation;

  return {
    similarity_score: weightedScore,
    factors: {
      tag_overlap: tagSimilarity,
      category_match: categorySimilarity,
      description_similarity: descriptionSimilarity,
      co_bookmark: coBookmarkFrequency,
      author_match: authorMatch,
      popularity_correlation: popularityCorr,
    },
  };
}

/**
 * Find similar configs for a given content item
 *
 * @param sourceItem - The item to find similarities for
 * @param allItems - All available content items
 * @param coBookmarkData - Optional collaborative signal data
 * @param limit - Maximum number of similar items to return
 * @returns Array of similar items with scores
 */
export function findSimilarConfigs(
  sourceItem: UnifiedContentItem,
  allItems: UnifiedContentItem[],
  coBookmarkData?: Map<string, number>,
  limit = 6
): Array<{
  item: UnifiedContentItem;
  similarity_score: number;
  factors: Record<string, number>;
}> {
  const similarItems: Array<{
    item: UnifiedContentItem;
    similarity_score: number;
    factors: Record<string, number>;
  }> = [];

  for (const candidateItem of allItems) {
    // Skip the source item itself
    if (
      candidateItem.slug === sourceItem.slug &&
      candidateItem.category === sourceItem.category
    ) {
      continue;
    }

    // Get co-bookmark frequency if available
    const itemKey = `${candidateItem.category}:${candidateItem.slug}`;
    const coBookmarkFreq = coBookmarkData?.get(itemKey) || 0;

    // Calculate similarity
    const { similarity_score, factors } = calculateContentSimilarity(
      sourceItem,
      candidateItem,
      coBookmarkFreq
    );

    // Only include items with meaningful similarity (threshold: 0.15 = 15%)
    if (similarity_score >= 0.15) {
      similarItems.push({
        item: candidateItem,
        similarity_score,
        factors,
      });
    }
  }

  // Sort by score descending and take top N
  return similarItems.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, limit);
}

/**
 * Calculate co-bookmark frequency for item pairs
 * This should be run periodically via cron job
 *
 * @param bookmarks - All user bookmarks from database
 * @returns Map of item pairs to co-bookmark frequency
 */
export function calculateCoBookmarkFrequencies(
  bookmarks: Array<{
    user_id: string;
    content_type: string;
    content_slug: string;
  }>
): Map<string, Map<string, number>> {
  // Build user -> items mapping
  const userItems = new Map<string, Set<string>>();

  for (const bookmark of bookmarks) {
    const itemKey = `${bookmark.content_type}:${bookmark.content_slug}`;
    if (!userItems.has(bookmark.user_id)) {
      userItems.set(bookmark.user_id, new Set());
    }
    userItems.get(bookmark.user_id)!.add(itemKey);
  }

  // Calculate co-occurrence frequencies
  const coOccurrences = new Map<string, Map<string, number>>();

  for (const [_userId, items] of userItems.entries()) {
    const itemArray = Array.from(items);

    // For each pair of items bookmarked by same user
    for (let i = 0; i < itemArray.length; i++) {
      const itemA = itemArray[i];
      if (!itemA) continue;

      if (!coOccurrences.has(itemA)) {
        coOccurrences.set(itemA, new Map());
      }

      for (let j = i + 1; j < itemArray.length; j++) {
        const itemB = itemArray[j];
        if (!itemB) continue;

        // Increment co-occurrence count
        const countAB = (coOccurrences.get(itemA)!.get(itemB) || 0) + 1;
        coOccurrences.get(itemA)!.set(itemB, countAB);

        if (!coOccurrences.has(itemB)) {
          coOccurrences.set(itemB, new Map());
        }
        coOccurrences.get(itemB)!.set(itemA, countAB);
      }
    }
  }

  return coOccurrences;
}

/**
 * Normalize co-occurrence counts to frequencies (0-1 range)
 *
 * @param coOccurrences - Raw co-occurrence counts
 * @param itemCounts - Total bookmark count per item
 * @returns Normalized frequencies
 */
export function normalizeCoBookmarkFrequencies(
  coOccurrences: Map<string, Map<string, number>>,
  itemCounts: Map<string, number>
): Map<string, Map<string, number>> {
  const normalized = new Map<string, Map<string, number>>();

  for (const [itemA, coOccurs] of coOccurrences.entries()) {
    const countA = itemCounts.get(itemA) || 1;
    normalized.set(itemA, new Map());

    for (const [itemB, count] of coOccurs.entries()) {
      const countB = itemCounts.get(itemB) || 1;

      // Normalize by min of the two item counts (Jaccard-like)
      const frequency = count / Math.min(countA, countB);
      normalized.get(itemA)!.set(itemB, Math.min(frequency, 1));
    }
  }

  return normalized;
}

/**
 * Validate similarity score
 */
export function validateSimilarityScore(score: number): boolean {
  return score >= 0 && score <= 1 && !Number.isNaN(score) && Number.isFinite(score);
}
