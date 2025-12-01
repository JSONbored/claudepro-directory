/**
 * Animation Style Utilities
 *
 * Composable patterns for CSS animations.
 * Provides semantic animation classes for consistent motion design.
 *
 * @module web-runtime/design-system/styles/animation
 */

// =============================================================================
// BASE ANIMATIONS
// =============================================================================

/**
 * Standard animation utilities.
 * These map to keyframes defined in globals.css.
 */
export const animate = {
  /** No animation */
  none: '',
  /** Continuous rotation */
  spin: 'animate-spin',
  /** Continuous pulsing opacity */
  pulse: 'animate-pulse',
  /** Bouncing motion */
  bounce: 'animate-bounce',
  /** Ping/ripple effect */
  ping: 'animate-ping',
} as const;

// =============================================================================
// ENTRANCE ANIMATIONS
// =============================================================================

/**
 * Entrance animation utilities.
 * For elements appearing on screen.
 */
export const animateIn = {
  /** Fade in */
  fade: 'animate-fade-in',
  /** Fade in from above */
  fadeDown: 'animate-fadeIn',
  /** Slide up and fade in */
  slideUp: 'animate-slide-up',
  /** Scale up and fade in */
  scaleIn: 'animate-scale-in',
  /** Slide in from left */
  slideLeft: 'animate-slideInFromLeft',
  /** Fade in and up */
  fadeUp: 'animate-fadeInUp',
} as const;

// =============================================================================
// SPECIAL EFFECT ANIMATIONS
// =============================================================================

/**
 * Special effect animations.
 * For decorative and attention-grabbing elements.
 */
export const animateEffect = {
  /** Shimmer/skeleton loading effect */
  shimmer: 'animate-shimmer',
  /** Border beam effect */
  borderBeam: 'animate-border-beam',
  /** Grid movement effect */
  gridMove: 'animate-gridMove',
  /** Text roll effect (Apple Hello style) */
  textRoll: 'animate-textRoll',
  /** Ripple effect */
  ripple: 'animate-rippleEffect',
} as const;

// =============================================================================
// MARQUEE ANIMATIONS
// =============================================================================

/**
 * Marquee/scrolling animations.
 * For continuous scrolling content.
 */
export const animateMarquee = {
  /** Scroll left continuously */
  left: 'animate-marqueeLeft',
  /** Scroll right continuously */
  right: 'animate-marqueeRight',
  /** Scroll up continuously */
  up: 'animate-marqueeUp',
  /** Scroll down continuously */
  down: 'animate-marqueeDown',
} as const;

// =============================================================================
// ANIMATION DURATION MODIFIERS
// =============================================================================

/**
 * Animation duration utilities.
 * Use with cn() to modify animation timing.
 */
export const animateDuration = {
  /** 75ms */
  fastest: 'duration-75',
  /** 100ms */
  faster: 'duration-100',
  /** 150ms */
  fast: 'duration-150',
  /** 200ms - default */
  default: 'duration-200',
  /** 300ms */
  slow: 'duration-300',
  /** 500ms */
  slower: 'duration-500',
  /** 700ms */
  slowest: 'duration-700',
  /** 1000ms */
  longest: 'duration-1000',
} as const;

// =============================================================================
// ANIMATION DELAY MODIFIERS
// =============================================================================

/**
 * Animation delay utilities.
 * For staggered animations.
 */
export const animateDelay = {
  /** No delay */
  none: 'delay-0',
  /** 75ms */
  '75': 'delay-75',
  /** 100ms */
  '100': 'delay-100',
  /** 150ms */
  '150': 'delay-150',
  /** 200ms */
  '200': 'delay-200',
  /** 300ms */
  '300': 'delay-300',
  /** 500ms */
  '500': 'delay-500',
  /** 700ms */
  '700': 'delay-700',
  /** 1000ms */
  '1000': 'delay-1000',
} as const;

// =============================================================================
// ANIMATION EASING
// =============================================================================

/**
 * Animation easing utilities.
 */
export const animateEase = {
  /** Linear - no acceleration */
  linear: 'ease-linear',
  /** Ease in - slow start */
  in: 'ease-in',
  /** Ease out - slow end */
  out: 'ease-out',
  /** Ease in-out - slow start and end */
  inOut: 'ease-in-out',
} as const;

// =============================================================================
// ANIMATION ITERATION
// =============================================================================

/**
 * Animation iteration utilities.
 */
export const animateIteration = {
  /** Run once */
  once: 'animate-once',
  /** Run twice */
  twice: 'animate-twice',
  /** Run infinitely */
  infinite: 'animate-infinite',
} as const;
