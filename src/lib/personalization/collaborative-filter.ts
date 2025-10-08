/**
 * Collaborative Filtering Algorithm
 * Item-based collaborative filtering for "users who liked X also liked Y"
 *
 * Algorithm:
 * - Calculates item-item similarity using co-occurrence patterns
 * - Uses Jaccard coefficient for similarity measurement
 * - Optimized for sparse interaction data
 *
 * Approach: Item-Based Collaborative Filtering
 * - More stable than user-based for sparse data
 * - Pre-computable (can be cached)
 * - Scales well with user growth
 */

/**
 * Calculate Jaccard similarity coefficient between two sets
 *
 * Jaccard(A, B) = |A ∩ B| / |A ∪ B|
 *
 * @param setA - First set of items
 * @param setB - Second set of items
 * @returns Similarity score (0-1)
 */
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity between two vectors
 *
 * @param vectorA - First vector (sparse representation)
 * @param vectorB - Second vector (sparse representation)
 * @returns Similarity score (0-1)
 */
export function calculateCosineSimilarity(
  vectorA: Map<string, number>,
  vectorB: Map<string, number>
): number {
  // Get all unique keys
  const allKeys = new Set([...vectorA.keys(), ...vectorB.keys()]);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key of allKeys) {
    const a = vectorA.get(key) || 0;
    const b = vectorB.get(key) || 0;

    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Build user-item interaction matrix
 *
 * @param interactions - Raw interaction data from database
 * @returns Map of users to their interacted items
 */
export function buildUserItemMatrix(
  interactions: Array<{
    user_id: string;
    content_type: string;
    content_slug: string;
    interaction_weight?: number;
  }>
): Map<string, Set<string>> {
  const matrix = new Map<string, Set<string>>();

  for (const interaction of interactions) {
    const itemKey = `${interaction.content_type}:${interaction.content_slug}`;
    if (!matrix.has(interaction.user_id)) {
      matrix.set(interaction.user_id, new Set());
    }
    matrix.get(interaction.user_id)!.add(itemKey);
  }

  return matrix;
}

/**
 * Calculate item-item similarity scores
 *
 * @param userItemMatrix - Map of users to their items
 * @returns Map of item pairs to similarity scores
 */
export function calculateItemSimilarities(
  userItemMatrix: Map<string, Set<string>>
): Map<string, Map<string, number>> {
  // Build reverse index: item -> users who interacted
  const itemUserIndex = new Map<string, Set<string>>();

  for (const [userId, items] of userItemMatrix.entries()) {
    for (const item of items) {
      if (!itemUserIndex.has(item)) {
        itemUserIndex.set(item, new Set());
      }
      itemUserIndex.get(item)!.add(userId);
    }
  }

  // Calculate similarities between all item pairs
  const similarities = new Map<string, Map<string, number>>();
  const items = Array.from(itemUserIndex.keys());

  for (let i = 0; i < items.length; i++) {
    const itemA = items[i];
    if (!itemA) continue;

    const usersA = itemUserIndex.get(itemA)!;

    if (!similarities.has(itemA)) {
      similarities.set(itemA, new Map());
    }

    for (let j = i + 1; j < items.length; j++) {
      const itemB = items[j];
      if (!itemB) continue;

      const usersB = itemUserIndex.get(itemB)!;

      // Calculate Jaccard similarity
      const similarity = calculateJaccardSimilarity(usersA, usersB);

      // Only store meaningful similarities (above threshold)
      if (similarity >= 0.05) {
        // 5% threshold
        similarities.get(itemA)!.set(itemB, similarity);

        if (!similarities.has(itemB)) {
          similarities.set(itemB, new Map());
        }
        similarities.get(itemB)!.set(itemA, similarity);
      }
    }
  }

  return similarities;
}

/**
 * Get similar items for a given item
 *
 * @param itemKey - Item identifier (content_type:content_slug)
 * @param similarities - Pre-computed similarity matrix
 * @param limit - Maximum number of similar items to return
 * @returns Array of similar items with scores
 */
export function getSimilarItems(
  itemKey: string,
  similarities: Map<string, Map<string, number>>,
  limit = 10
): Array<{ item: string; similarity: number }> {
  const itemSimilarities = similarities.get(itemKey);

  if (!itemSimilarities) {
    return [];
  }

  return Array.from(itemSimilarities.entries())
    .map(([item, similarity]) => ({ item, similarity }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Get recommendations for a user based on their interaction history
 *
 * @param userItems - Items the user has interacted with
 * @param userAffinities - User's affinity scores for their items
 * @param similarities - Pre-computed similarity matrix
 * @param limit - Maximum number of recommendations
 * @returns Array of recommended items with scores
 */
export function getCollaborativeRecommendations(
  userItems: Set<string>,
  userAffinities: Map<string, number>,
  similarities: Map<string, Map<string, number>>,
  limit = 10
): Array<{ item: string; score: number }> {
  const candidateScores = new Map<string, number>();

  // For each item the user has interacted with
  for (const userItem of userItems) {
    const itemSimilarities = similarities.get(userItem);
    if (!itemSimilarities) continue;

    const userAffinity = userAffinities.get(userItem) || 1;

    // Add similar items to candidates
    for (const [candidateItem, similarity] of itemSimilarities.entries()) {
      // Don't recommend items user already has
      if (userItems.has(candidateItem)) continue;

      // Weight similarity by user's affinity for source item
      const weightedScore = similarity * (userAffinity / 100);

      candidateScores.set(candidateItem, (candidateScores.get(candidateItem) || 0) + weightedScore);
    }
  }

  // Sort and return top N
  return Array.from(candidateScores.entries())
    .map(([item, score]) => ({ item, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Calculate user-user similarity (for future use)
 *
 * @param userAItems - Items user A has interacted with
 * @param userBItems - Items user B has interacted with
 * @returns Similarity score (0-1)
 */
export function calculateUserSimilarity(userAItems: Set<string>, userBItems: Set<string>): number {
  return calculateJaccardSimilarity(userAItems, userBItems);
}

/**
 * Validate similarity score
 */
export function validateSimilarityScore(score: number): boolean {
  return score >= 0 && score <= 1 && !Number.isNaN(score) && Number.isFinite(score);
}
