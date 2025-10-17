/**
 * Badge System Configuration
 *
 * Centralized configuration for badge definitions, categories, and award criteria.
 * Configuration-driven system following core codebase principles for scalability.
 *
 * Production Standards:
 * - Type-safe badge definitions
 * - Modular award criteria (easy to add new badges)
 * - Category-based organization
 * - Icon system integrated
 *
 * @module config/badges
 */

import { z } from 'zod';

// =============================================================================
// BADGE CATEGORIES
// =============================================================================

/**
 * Badge categories for organization
 */
export const BADGE_CATEGORIES = {
  COMMUNITY: 'community',
  CONTRIBUTION: 'contribution',
  ACHIEVEMENT: 'achievement',
  SPECIAL: 'special',
  MILESTONE: 'milestone',
} as const;

export type BadgeCategory = (typeof BADGE_CATEGORIES)[keyof typeof BADGE_CATEGORIES];

// =============================================================================
// BADGE AWARD CRITERIA TYPES
// =============================================================================

/**
 * Base award criteria interface
 * All criteria types must implement this
 */
export interface BadgeAwardCriteria {
  type: 'reputation' | 'count' | 'streak' | 'special' | 'composite';
  description: string;
}

/** Criteria: Reach a reputation threshold */
export interface ReputationCriteria extends BadgeAwardCriteria {
  type: 'reputation';
  minScore: number;
}

/** Criteria: Perform an action X times */
export interface CountCriteria extends BadgeAwardCriteria {
  type: 'count';
  metric:
    | 'posts'
    | 'comments'
    | 'submissions'
    | 'votes_received'
    | 'reviews'
    | 'bookmarks_received'
    | 'followers';
  minCount: number;
}

/** Criteria: Maintain activity streak */
export interface StreakCriteria extends BadgeAwardCriteria {
  type: 'streak';
  metric: 'daily_posts' | 'weekly_contributions';
  minDays: number;
}

/** Criteria: Special conditions (manual award or complex logic) */
export interface SpecialCriteria extends BadgeAwardCriteria {
  type: 'special';
  checkFunction?: string; // Name of custom check function
}

/** Criteria: Multiple conditions (all must be met) */
export interface CompositeCriteria extends BadgeAwardCriteria {
  type: 'composite';
  conditions: AwardCriteria[];
  requireAll: boolean; // true = AND, false = OR
}

export type AwardCriteria =
  | ReputationCriteria
  | CountCriteria
  | StreakCriteria
  | SpecialCriteria
  | CompositeCriteria;

// =============================================================================
// BADGE DEFINITION
// =============================================================================

/**
 * Complete badge definition
 */
export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  category: BadgeCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: AwardCriteria;
  /** Order for display (lower = higher priority) */
  displayOrder: number;
  /** Can be awarded automatically */
  autoAward: boolean;
}

// =============================================================================
// BADGE REGISTRY
// =============================================================================

/**
 * All available badges in the system
 * SINGLE SOURCE OF TRUTH for badge definitions
 */
export const BADGE_REGISTRY: Record<string, BadgeDefinition> = {
  // =========================================================================
  // MILESTONE BADGES
  // =========================================================================

  first_post: {
    slug: 'first_post',
    name: 'First Post',
    description: 'Created your first community post',
    icon: '✍️',
    category: BADGE_CATEGORIES.MILESTONE,
    rarity: 'common',
    displayOrder: 10,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'posts',
      minCount: 1,
      description: 'Create 1 post',
    },
  },

  first_submission: {
    slug: 'first_submission',
    name: 'Contributor',
    description: 'Had your first submission merged',
    icon: '🎯',
    category: BADGE_CATEGORIES.MILESTONE,
    rarity: 'uncommon',
    displayOrder: 11,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'submissions',
      minCount: 1,
      description: 'Get 1 submission merged',
    },
  },

  first_review: {
    slug: 'first_review',
    name: 'Reviewer',
    description: 'Wrote your first helpful review',
    icon: '📝',
    category: BADGE_CATEGORIES.MILESTONE,
    rarity: 'common',
    displayOrder: 12,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'reviews',
      minCount: 1,
      description: 'Write 1 review',
    },
  },

  // =========================================================================
  // COMMUNITY BADGES
  // =========================================================================

  active_commenter: {
    slug: 'active_commenter',
    name: 'Active Commenter',
    description: 'Wrote 50 helpful comments',
    icon: '💬',
    category: BADGE_CATEGORIES.COMMUNITY,
    rarity: 'uncommon',
    displayOrder: 20,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'comments',
      minCount: 50,
      description: 'Write 50 comments',
    },
  },

  conversation_starter: {
    slug: 'conversation_starter',
    name: 'Conversation Starter',
    description: 'Created 10 discussion posts',
    icon: '🗣️',
    category: BADGE_CATEGORIES.COMMUNITY,
    rarity: 'uncommon',
    displayOrder: 21,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'posts',
      minCount: 10,
      description: 'Create 10 posts',
    },
  },

  popular_content: {
    slug: 'popular_content',
    name: 'Popular Content',
    description: 'Received 100 votes on your posts',
    icon: '🔥',
    category: BADGE_CATEGORIES.COMMUNITY,
    rarity: 'rare',
    displayOrder: 22,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'votes_received',
      minCount: 100,
      description: 'Receive 100 votes',
    },
  },

  influencer: {
    slug: 'influencer',
    name: 'Influencer',
    description: 'Gained 50 followers',
    icon: '🌟',
    category: BADGE_CATEGORIES.COMMUNITY,
    rarity: 'rare',
    displayOrder: 23,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'followers',
      minCount: 50,
      description: 'Gain 50 followers',
    },
  },

  // =========================================================================
  // CONTRIBUTION BADGES
  // =========================================================================

  prolific_contributor: {
    slug: 'prolific_contributor',
    name: 'Prolific Contributor',
    description: 'Had 10 submissions merged',
    icon: '🚀',
    category: BADGE_CATEGORIES.CONTRIBUTION,
    rarity: 'rare',
    displayOrder: 30,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'submissions',
      minCount: 10,
      description: 'Get 10 submissions merged',
    },
  },

  master_contributor: {
    slug: 'master_contributor',
    name: 'Master Contributor',
    description: 'Had 50 submissions merged',
    icon: '💎',
    category: BADGE_CATEGORIES.CONTRIBUTION,
    rarity: 'epic',
    displayOrder: 31,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'submissions',
      minCount: 50,
      description: 'Get 50 submissions merged',
    },
  },

  quality_curator: {
    slug: 'quality_curator',
    name: 'Quality Curator',
    description: 'Content bookmarked 100 times by others',
    icon: '⭐',
    category: BADGE_CATEGORIES.CONTRIBUTION,
    rarity: 'rare',
    displayOrder: 32,
    autoAward: true,
    criteria: {
      type: 'count',
      metric: 'bookmarks_received',
      minCount: 100,
      description: 'Get bookmarked 100 times',
    },
  },

  // =========================================================================
  // ACHIEVEMENT BADGES (Reputation-based)
  // =========================================================================

  rising_star: {
    slug: 'rising_star',
    name: 'Rising Star',
    description: 'Reached 100 reputation',
    icon: '⭐',
    category: BADGE_CATEGORIES.ACHIEVEMENT,
    rarity: 'uncommon',
    displayOrder: 40,
    autoAward: true,
    criteria: {
      type: 'reputation',
      minScore: 100,
      description: 'Reach 100 reputation',
    },
  },

  trusted_member: {
    slug: 'trusted_member',
    name: 'Trusted Member',
    description: 'Reached 500 reputation',
    icon: '🛡️',
    category: BADGE_CATEGORIES.ACHIEVEMENT,
    rarity: 'rare',
    displayOrder: 41,
    autoAward: true,
    criteria: {
      type: 'reputation',
      minScore: 500,
      description: 'Reach 500 reputation',
    },
  },

  elite_contributor: {
    slug: 'elite_contributor',
    name: 'Elite Contributor',
    description: 'Reached 1000 reputation',
    icon: '🏆',
    category: BADGE_CATEGORIES.ACHIEVEMENT,
    rarity: 'epic',
    displayOrder: 42,
    autoAward: true,
    criteria: {
      type: 'reputation',
      minScore: 1000,
      description: 'Reach 1000 reputation',
    },
  },

  legendary: {
    slug: 'legendary',
    name: 'Legendary',
    description: 'Reached 2500 reputation',
    icon: '👑',
    category: BADGE_CATEGORIES.ACHIEVEMENT,
    rarity: 'legendary',
    displayOrder: 43,
    autoAward: true,
    criteria: {
      type: 'reputation',
      minScore: 2500,
      description: 'Reach 2500 reputation',
    },
  },

  // =========================================================================
  // SPECIAL BADGES (Manual/Complex)
  // =========================================================================

  early_adopter: {
    slug: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during beta phase',
    icon: '🎖️',
    category: BADGE_CATEGORIES.SPECIAL,
    rarity: 'legendary',
    displayOrder: 50,
    autoAward: false,
    criteria: {
      type: 'special',
      description: 'Manually awarded to early community members',
    },
  },

  team_member: {
    slug: 'team_member',
    name: 'Team Member',
    description: 'Claude Pro Directory team member',
    icon: '💼',
    category: BADGE_CATEGORIES.SPECIAL,
    rarity: 'legendary',
    displayOrder: 51,
    autoAward: false,
    criteria: {
      type: 'special',
      description: 'Manually awarded to team members',
    },
  },

  moderator: {
    slug: 'moderator',
    name: 'Moderator',
    description: 'Community moderator',
    icon: '🛡️',
    category: BADGE_CATEGORIES.SPECIAL,
    rarity: 'epic',
    displayOrder: 52,
    autoAward: false,
    criteria: {
      type: 'special',
      description: 'Manually awarded to moderators',
    },
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all badges in a category
 */
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return Object.values(BADGE_REGISTRY)
    .filter((badge) => badge.category === category)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get all auto-awardable badges
 */
export function getAutoAwardBadges(): BadgeDefinition[] {
  return Object.values(BADGE_REGISTRY).filter((badge) => badge.autoAward);
}

/**
 * Get badges by rarity
 */
export function getBadgesByRarity(rarity: BadgeDefinition['rarity']): BadgeDefinition[] {
  return Object.values(BADGE_REGISTRY)
    .filter((badge) => badge.rarity === rarity)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get badge by slug
 */
export function getBadge(slug: string): BadgeDefinition | undefined {
  return BADGE_REGISTRY[slug];
}

/**
 * Get all badges sorted by display order
 */
export function getAllBadges(): BadgeDefinition[] {
  return Object.values(BADGE_REGISTRY).sort((a, b) => a.displayOrder - b.displayOrder);
}

// =============================================================================
// BADGE RARITY COLORS
// =============================================================================

/**
 * Color scheme for badge rarities
 */
export const BADGE_RARITY_COLORS = {
  common: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-500/20',
  },
  uncommon: {
    bg: 'bg-green-500/10',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-500/20',
  },
  rare: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/20',
  },
  epic: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/20',
  },
  legendary: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/20',
  },
} as const;

// =============================================================================
// SCHEMA VALIDATION
// =============================================================================

export const badgeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  category: z.enum(['community', 'contribution', 'achievement', 'special', 'milestone']),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']),
  displayOrder: z.number(),
  autoAward: z.boolean(),
});

export type Badge = z.infer<typeof badgeSchema>;
