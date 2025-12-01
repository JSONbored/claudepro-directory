/**
 * Category Color System
 *
 * Comprehensive color utilities for content categories.
 * Provides consistent theming across badges, backgrounds, borders, and text.
 *
 * @module web-runtime/design-system/styles/category-colors
 */

import type { Database } from '@heyclaude/database-types';

type ContentCategory = Database['public']['Enums']['content_category'];

// =============================================================================
// CATEGORY COLOR DEFINITIONS
// =============================================================================

/**
 * Base color configuration for each category.
 * Uses Tailwind color classes for consistency.
 */
const CATEGORY_COLOR_MAP = {
  agents: { base: 'purple', accent: 'violet' },
  mcp: { base: 'cyan', accent: 'teal' },
  commands: { base: 'blue', accent: 'indigo' },
  rules: { base: 'amber', accent: 'yellow' },
  hooks: { base: 'green', accent: 'emerald' },
  statuslines: { base: 'teal', accent: 'cyan' },
  collections: { base: 'indigo', accent: 'purple' },
  skills: { base: 'pink', accent: 'rose' },
  guides: { base: 'violet', accent: 'purple' },
  jobs: { base: 'orange', accent: 'amber' },
  changelog: { base: 'slate', accent: 'gray' },
} as const;

// =============================================================================
// PRE-COMPUTED STATIC CLASSES (for better tree-shaking)
// =============================================================================

/**
 * Pre-computed category background classes.
 * Use these for static className assignments.
 */
export const categoryBg = {
  agents: 'bg-purple-500/10',
  mcp: 'bg-cyan-500/10',
  commands: 'bg-blue-500/10',
  rules: 'bg-amber-500/10',
  hooks: 'bg-green-500/10',
  statuslines: 'bg-teal-500/10',
  collections: 'bg-indigo-500/10',
  skills: 'bg-pink-500/10',
  guides: 'bg-violet-500/10',
  jobs: 'bg-orange-500/10',
  changelog: 'bg-slate-500/10',
  default: 'bg-gray-500/10',
} as const;

/**
 * Pre-computed category text classes.
 */
export const categoryText = {
  agents: 'text-purple-400',
  mcp: 'text-cyan-400',
  commands: 'text-blue-400',
  rules: 'text-amber-400',
  hooks: 'text-green-400',
  statuslines: 'text-teal-400',
  collections: 'text-indigo-400',
  skills: 'text-pink-400',
  guides: 'text-violet-400',
  jobs: 'text-orange-400',
  changelog: 'text-slate-400',
  default: 'text-gray-400',
} as const;

/**
 * Pre-computed category border classes.
 */
export const categoryBorder = {
  agents: 'border-purple-500/20',
  mcp: 'border-cyan-500/20',
  commands: 'border-blue-500/20',
  rules: 'border-amber-500/20',
  hooks: 'border-green-500/20',
  statuslines: 'border-teal-500/20',
  collections: 'border-indigo-500/20',
  skills: 'border-pink-500/20',
  guides: 'border-violet-500/20',
  jobs: 'border-orange-500/20',
  changelog: 'border-slate-500/20',
  default: 'border-gray-500/20',
} as const;

/**
 * Pre-computed category gradient classes (for hero sections, cards).
 */
export const categoryGradient = {
  agents: 'from-purple-500/10 to-violet-500/10',
  mcp: 'from-cyan-500/10 to-teal-500/10',
  commands: 'from-blue-500/10 to-indigo-500/10',
  rules: 'from-amber-500/10 to-yellow-500/10',
  hooks: 'from-green-500/10 to-emerald-500/10',
  statuslines: 'from-teal-500/10 to-cyan-500/10',
  collections: 'from-indigo-500/10 to-purple-500/10',
  skills: 'from-pink-500/10 to-rose-500/10',
  guides: 'from-violet-500/10 to-purple-500/10',
  jobs: 'from-orange-500/10 to-amber-500/10',
  changelog: 'from-slate-500/10 to-gray-500/10',
  default: 'from-gray-500/10 to-slate-500/10',
} as const;

/**
 * Pre-computed category accent glow classes (for featured items).
 */
export const categoryGlow = {
  agents: 'shadow-purple-500/20',
  mcp: 'shadow-cyan-500/20',
  commands: 'shadow-blue-500/20',
  rules: 'shadow-amber-500/20',
  hooks: 'shadow-green-500/20',
  statuslines: 'shadow-teal-500/20',
  collections: 'shadow-indigo-500/20',
  skills: 'shadow-pink-500/20',
  guides: 'shadow-violet-500/20',
  jobs: 'shadow-orange-500/20',
  changelog: 'shadow-slate-500/20',
  default: 'shadow-gray-500/20',
} as const;

// =============================================================================
// COMPOSITE CATEGORY STYLES
// =============================================================================

/**
 * Complete category card styling (bg + border + text).
 */
export const categoryCard = {
  agents: 'bg-purple-500/5 border-purple-500/20 text-purple-400',
  mcp: 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400',
  commands: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
  rules: 'bg-amber-500/5 border-amber-500/20 text-amber-400',
  hooks: 'bg-green-500/5 border-green-500/20 text-green-400',
  statuslines: 'bg-teal-500/5 border-teal-500/20 text-teal-400',
  collections: 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400',
  skills: 'bg-pink-500/5 border-pink-500/20 text-pink-400',
  guides: 'bg-violet-500/5 border-violet-500/20 text-violet-400',
  jobs: 'bg-orange-500/5 border-orange-500/20 text-orange-400',
  changelog: 'bg-slate-500/5 border-slate-500/20 text-slate-400',
  default: 'bg-gray-500/5 border-gray-500/20 text-gray-400',
} as const;

/**
 * Interactive category hover effects.
 */
export const categoryHover = {
  agents: 'hover:bg-purple-500/15 hover:border-purple-500/30',
  mcp: 'hover:bg-cyan-500/15 hover:border-cyan-500/30',
  commands: 'hover:bg-blue-500/15 hover:border-blue-500/30',
  rules: 'hover:bg-amber-500/15 hover:border-amber-500/30',
  hooks: 'hover:bg-green-500/15 hover:border-green-500/30',
  statuslines: 'hover:bg-teal-500/15 hover:border-teal-500/30',
  collections: 'hover:bg-indigo-500/15 hover:border-indigo-500/30',
  skills: 'hover:bg-pink-500/15 hover:border-pink-500/30',
  guides: 'hover:bg-violet-500/15 hover:border-violet-500/30',
  jobs: 'hover:bg-orange-500/15 hover:border-orange-500/30',
  changelog: 'hover:bg-slate-500/15 hover:border-slate-500/30',
  default: 'hover:bg-gray-500/15 hover:border-gray-500/30',
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CategoryColorKey = keyof typeof categoryBg;

// =============================================================================
// CATEGORY COLOR UTILITIES
// =============================================================================

/**
 * Get the full color palette for a category using pre-computed static classes.
 * Returns an object with all color variants for consistent theming.
 * 
 * NOTE: Uses static pre-computed maps to ensure Tailwind JIT can detect all classes.
 * Dynamic class construction (e.g., `bg-${color}-500`) doesn't work with Tailwind.
 */
export function getCategoryColors(category: ContentCategory | string) {
  // Use static maps to avoid dynamic Tailwind class construction
  const key = (category in categoryBg ? category : 'default') as CategoryColorKey;
  const colors = CATEGORY_COLOR_MAP[category as keyof typeof CATEGORY_COLOR_MAP] ?? {
    base: 'gray',
    accent: 'slate',
  };

  return {
    // Pre-computed static classes
    badge: categoryCard[key],
    bg: categoryBg[key],
    text: categoryText[key],
    border: categoryBorder[key],
    gradient: categoryGradient[key],
    glow: categoryGlow[key],
    hover: categoryHover[key],

    // Raw color names for custom usage (when you need to construct other variants)
    colorName: colors.base,
    accentColorName: colors.accent,
  } as const;
}
