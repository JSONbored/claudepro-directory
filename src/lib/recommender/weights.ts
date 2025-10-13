/**
 * Recommendation Algorithm Weights
 *
 * Centralized weight configuration for the recommendation scoring algorithm.
 * Weights control the importance of each factor in the final score.
 *
 * Design principles:
 * - All weights must sum to 1.0 for proper normalization
 * - Primary factors get higher weights (use case, tool preference)
 * - Secondary factors provide fine-tuning (popularity, trending)
 * - Weights are tunable based on analytics and A/B testing
 *
 * Version: 1.0
 * Last tuned: 2025-01-07
 */

import type { RecommendationConfig } from '@/src/lib/schemas/recommender.schema';

/**
 * Default recommendation weights
 * Version 1.0 - Initial tuning based on expected user priorities
 *
 * Weight allocation strategy:
 * - 35% Use Case: Most important factor (what they want to do)
 * - 20% Tool Preference: Category preference (agents vs mcp vs rules)
 * - 15% Experience Level: Ensure appropriate complexity
 * - 15% Integrations: Must support required tools
 * - 10% Focus Areas: Secondary refinement
 * - 3% Popularity: Community validation signal
 * - 2% Trending: Discover new/hot configs
 * = 100% total
 */
export const DEFAULT_WEIGHTS: RecommendationConfig['weights'] = {
  useCase: 0.35, // Primary driver of recommendations
  toolPreference: 0.2, // Strong influence on category selection
  experience: 0.15, // Important for filtering complexity
  integrations: 0.15, // Critical for compatibility
  focusAreas: 0.1, // Fine-tuning for specific needs
  popularity: 0.03, // Light boost for proven configs
  trending: 0.02, // Light boost for discovery
};

/**
 * Conservative weights
 * Prioritizes proven, popular configurations
 * Good for beginners who want safe choices
 */
export const CONSERVATIVE_WEIGHTS: RecommendationConfig['weights'] = {
  useCase: 0.3,
  toolPreference: 0.2,
  experience: 0.15,
  integrations: 0.15,
  focusAreas: 0.08,
  popularity: 0.08, // Higher weight for popularity
  trending: 0.04, // Higher weight for trending
};

/**
 * Exploratory weights
 * Reduces popularity/trending influence
 * Good for advanced users who want diverse results
 */
export const EXPLORATORY_WEIGHTS: RecommendationConfig['weights'] = {
  useCase: 0.35,
  toolPreference: 0.2,
  experience: 0.15,
  integrations: 0.15,
  focusAreas: 0.14, // Higher focus area weight
  popularity: 0.005, // Minimal popularity influence
  trending: 0.005, // Minimal trending influence
};

/**
 * Balanced weights
 * Even distribution across all factors
 * Good for testing and comparison
 */
export const BALANCED_WEIGHTS: RecommendationConfig['weights'] = {
  useCase: 0.25,
  toolPreference: 0.2,
  experience: 0.15,
  integrations: 0.15,
  focusAreas: 0.15,
  popularity: 0.05,
  trending: 0.05,
};

/**
 * Weight presets map
 * Easy access to different weight configurations
 */
export const WEIGHT_PRESETS = {
  default: DEFAULT_WEIGHTS,
  conservative: CONSERVATIVE_WEIGHTS,
  exploratory: EXPLORATORY_WEIGHTS,
  balanced: BALANCED_WEIGHTS,
} as const;

/**
 * Get weights for a specific user profile
 * Automatically selects appropriate weights based on experience level
 */
export function getWeightsForProfile(
  experienceLevel: 'beginner' | 'intermediate' | 'advanced',
  preferExploration = false
): RecommendationConfig['weights'] {
  // Beginners get conservative recommendations
  if (experienceLevel === 'beginner' && !preferExploration) {
    return CONSERVATIVE_WEIGHTS;
  }

  // Advanced users who want exploration
  if (experienceLevel === 'advanced' && preferExploration) {
    return EXPLORATORY_WEIGHTS;
  }

  // Everyone else gets default weights
  return DEFAULT_WEIGHTS;
}

/**
 * Validate weights sum to 1.0
 * Utility function for testing custom weight configurations
 */
export function validateWeights(weights: RecommendationConfig['weights']): boolean {
  const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
  const tolerance = 0.01; // Allow small floating point errors
  return Math.abs(sum - 1.0) < tolerance;
}

/**
 * Weight tuning notes for future optimization:
 *
 * A/B Testing Ideas:
 * 1. Test higher use case weight (0.40) vs current (0.35)
 * 2. Test reducing tool preference weight for more diverse results
 * 3. Test popularity-heavy weights for new users vs returning users
 * 4. Test trending-heavy weights during community growth phases
 *
 * Analytics to Track:
 * - Click-through rate by weight preset
 * - Diversity of results chosen (all from one category vs mixed)
 * - User satisfaction by experience level
 * - Bookmark rate by recommendation source
 *
 * Seasonal Adjustments:
 * - Increase trending weight during major Claude releases
 * - Increase popularity weight for new users (first session)
 * - Decrease experience filtering for returning users (they're learning)
 */
