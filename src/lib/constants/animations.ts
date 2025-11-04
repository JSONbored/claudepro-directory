/**
 * Animation Constants - Centralized Motion Presets
 * Database-first principle: Single source of truth for all animations
 *
 * Performance optimized:
 * - Uses transform/opacity (GPU-accelerated properties)
 * - will-change hints for better compositing
 * - Consistent easing functions
 * - Respects prefers-reduced-motion
 */

/**
 * Standard easing functions - Use throughout app for consistency
 */
export const EASINGS = {
  /** Standard easing - Most common, feels natural */
  standard: [0.4, 0, 0.2, 1] as const,
  /** Emphasized easing - For important actions */
  emphasized: [0.16, 1, 0.3, 1] as const,
  /** Decelerate - Elements entering screen */
  decelerate: [0, 0, 0.2, 1] as const,
  /** Accelerate - Elements leaving screen */
  accelerate: [0.4, 0, 1, 1] as const,
} as const;

/**
 * Standard animation durations (milliseconds)
 * Based on Material Design motion guidelines
 */
export const DURATIONS = {
  /** Micro-interactions (button hover, checkbox) */
  instant: 100,
  /** Simple transitions (fade, slide) */
  fast: 200,
  /** Standard transitions (most UI changes) */
  normal: 300,
  /** Complex transitions (page changes, modals) */
  slow: 500,
  /** Large/complex animations (hero sections) */
  slower: 700,
} as const;

/**
 * Hover Animation Preset - Card lift
 * Use for interactive cards, buttons, clickable elements
 */
export const HOVER_LIFT = {
  whileHover: {
    y: -2,
    transition: { duration: DURATIONS.fast / 1000, ease: EASINGS.standard },
  },
  whileTap: {
    y: 0,
    transition: { duration: DURATIONS.instant / 1000, ease: EASINGS.standard },
  },
  style: { willChange: 'transform' },
} as const;

/**
 * Hover Animation Preset - Scale down (for touch feedback)
 * Use for buttons, interactive icons
 */
export const HOVER_SCALE_DOWN = {
  whileHover: {
    scale: 0.98,
    transition: { duration: DURATIONS.instant / 1000, ease: EASINGS.standard },
  },
  whileTap: {
    scale: 0.95,
    transition: { duration: DURATIONS.instant / 1000, ease: EASINGS.standard },
  },
  style: { willChange: 'transform' },
} as const;

/**
 * Scroll Reveal Animation - Fade in + slide up
 * Use for content sections appearing on scroll
 */
export const SCROLL_REVEAL = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: DURATIONS.slow / 1000, ease: EASINGS.emphasized },
} as const;

/**
 * Scroll Reveal with Stagger - For lists/grids
 * Parent container animation
 */
export const SCROLL_REVEAL_STAGGER = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-50px' },
  transition: {
    staggerChildren: 0.05,
    delayChildren: 0.1,
  },
} as const;

/**
 * Scroll Reveal Item - Child element in stagger
 */
export const SCROLL_REVEAL_ITEM = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: DURATIONS.normal / 1000, ease: EASINGS.emphasized },
} as const;

/**
 * Fade Animation - Simple opacity change
 * Use for tooltips, popovers, subtle appearances
 */
export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATIONS.fast / 1000, ease: EASINGS.standard },
} as const;

/**
 * Slide Up Animation - Bottom sheet, modal entry
 */
export const SLIDE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: DURATIONS.normal / 1000, ease: EASINGS.emphasized },
} as const;

/**
 * Scale Animation - Modal/dialog entry
 */
export const SCALE_IN = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: DURATIONS.normal / 1000, ease: EASINGS.standard },
} as const;

/**
 * Success State Animation - Checkmark, success badge
 */
export const SUCCESS_PULSE = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: DURATIONS.normal / 1000,
      ease: EASINGS.emphasized,
      times: [0, 0.5, 1],
    },
  },
} as const;

/**
 * Error Shake Animation - Form field errors
 */
export const ERROR_SHAKE = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: DURATIONS.slow / 1000,
      ease: EASINGS.standard,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
  },
} as const;

/**
 * Loading Pulse - Skeleton screens, loading indicators
 */
export const LOADING_PULSE = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      ease: EASINGS.standard,
      repeat: Number.POSITIVE_INFINITY,
      times: [0, 0.5, 1],
    },
  },
} as const;

/**
 * Page Transition - Full page changes
 */
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: DURATIONS.normal / 1000, ease: EASINGS.standard },
} as const;

/**
 * Helper: Get reduced motion variant
 * Returns instant animation if user prefers reduced motion
 */
export function getReducedMotionVariant<T extends Record<string, unknown>>(
  animation: T,
  reducedAnimation?: T
): T {
  if (typeof window === 'undefined') return animation;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      reducedAnimation ??
      ({
        ...animation,
        transition: { duration: 0.01 },
      } as T)
    );
  }

  return animation;
}

/**
 * Type exports for strict typing
 */
export type AnimationPreset = typeof HOVER_LIFT | typeof SCROLL_REVEAL | typeof FADE_IN;
export type EasingFunction = (typeof EASINGS)[keyof typeof EASINGS];
export type AnimationDuration = (typeof DURATIONS)[keyof typeof DURATIONS];
