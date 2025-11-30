/**
 * Card Style Utilities
 *
 * Composable patterns for card components.
 * Replaces UI_CLASSES card patterns.
 *
 * @module web-runtime/design-system/styles/cards
 */

// =============================================================================
// BASE CARD STYLES
// =============================================================================

/**
 * Base card styles.
 */
export const card = {
  /** Default card - subtle background with border */
  base: 'rounded-lg border border-border bg-card',
  /** Card with shadow */
  elevated: 'rounded-lg border border-border bg-card shadow-sm',
  /** Interactive card (for clickable cards) */
  interactive: 'rounded-lg border border-border/50 bg-card transition-colors hover:bg-accent/5 hover:border-accent/20 cursor-pointer',
  /** Ghost card (minimal styling) */
  ghost: 'rounded-lg bg-transparent',
  /** Muted card */
  muted: 'rounded-lg border border-border/50 bg-card/50',
  /** Gradient card (warm transition) */
  gradient: 'card-gradient transition-smooth group',
} as const;

// =============================================================================
// CARD PADDING
// =============================================================================

/**
 * Card padding patterns.
 */
export const cardPadding = {
  none: 'p-0',
  tight: 'p-3',
  compact: 'p-4',
  default: 'p-6',
  relaxed: 'p-8',
} as const;

/**
 * Card header padding.
 */
export const cardHeader = {
  tight: 'pb-2',
  compact: 'pb-3',
  default: 'pb-4',
  /** Full header with horizontal padding */
  full: 'px-6 py-4',
} as const;

/**
 * Card body/content.
 */
export const cardBody = {
  default: 'pt-0',
  /** Full body with padding */
  full: 'px-6 py-6',
} as const;

/**
 * Card footer.
 */
export const cardFooter = {
  default: 'pt-4',
  /** Full footer with border */
  full: 'px-6 py-3 border-t border-border',
  /** Responsive footer */
  responsive: 'flex flex-col gap-2 md:flex-row md:items-center md:justify-between',
} as const;

// =============================================================================
// CARD HOVER EFFECTS
// =============================================================================

/**
 * Card hover effect patterns.
 */
export const cardHover = {
  /** Subtle lift effect */
  lift: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
  /** Border highlight */
  border: 'border-2 transition-all hover:border-primary/50 hover:shadow-lg',
  /** Background change */
  bg: 'transition-colors hover:bg-accent/5',
  /** Scale effect */
  scale: 'transition-transform hover:scale-[1.02]',
  /** Combined lift and shadow */
  liftShadow: 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
} as const;

// =============================================================================
// SPECIALIZED CARDS
// =============================================================================

/**
 * Empty state card.
 */
export const emptyCard = {
  default: 'text-center py-12 bg-card/50 rounded-xl border border-border/50',
  withIcon: 'flex flex-col items-center justify-center p-8 text-center',
  compact: 'flex items-center justify-center py-8',
  bordered: 'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-white/10 bg-white/2',
} as const;

/**
 * Featured/highlighted card.
 */
export const featuredCard = {
  /** Featured border */
  border: 'border-2 border-orange-500/50',
  /** Featured gradient background */
  gradient: 'bg-gradient-to-br from-orange-500/5 to-orange-600/10',
  /** Featured glow effect */
  glow: 'shadow-lg shadow-orange-500/10',
  /** Combined featured styles */
  full: 'border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/5 to-orange-600/10 shadow-lg shadow-orange-500/10',
} as const;

/**
 * Overflow container card.
 */
export const overflowCard = {
  default: 'relative overflow-hidden border-b border-border/50 bg-card/30',
} as const;

// =============================================================================
// CARD CONTENT PATTERNS
// =============================================================================

/**
 * Card badge container (for multiple badges at top of card).
 */
export const cardBadges = {
  default: 'flex flex-wrap gap-1.5 md:gap-2 mb-4',
  compact: 'flex flex-wrap gap-1 mb-3',
} as const;

/**
 * Card metadata display.
 */
export const cardMeta = {
  /** Badge-style metadata */
  badges: 'flex items-center gap-2 text-xs flex-nowrap',
  /** Actions container */
  actions: 'flex items-center gap-2 text-xs flex-nowrap',
} as const;
