/**
 * Microinteractions Design Tokens
 *
 * Semantic design tokens for all microinteractions, button states, hover effects,
 * and interactive feedback across the application.
 *
 * Architecture:
 * - Semantic naming (e.g., `button.hover.scale` not `scale-1.1`)
 * - Type-safe with const assertions
 * - Organized by component/context (button, icon, card, tooltip)
 * - Motion.dev compatible (spring physics, transitions)
 *
 * Usage:
 * ```tsx
 * import { MICROINTERACTIONS } from '@heyclaude/web-runtime/ui/design-tokens';
 *
 * <motion.button
 *   whileHover={MICROINTERACTIONS.button.hover}
 *   whileTap={MICROINTERACTIONS.button.tap}
 *   transition={MICROINTERACTIONS.button.transition}
 * />
 * ```
 *
 * @module web-runtime/ui/design-tokens/microinteractions
 */

import type { Transition } from 'motion/react';
import { UI_ANIMATION } from '../../config/unified-config.ts';

/**
 * Spring transition configurations
 * Reuses values from unified-config for consistency
 */
const SPRING_SMOOTH: Transition = {
  type: 'spring',
  stiffness: UI_ANIMATION['spring.smooth.stiffness'],
  damping: UI_ANIMATION['spring.smooth.damping'],
} as const;


const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: UI_ANIMATION['spring.bouncy.stiffness'],
  damping: UI_ANIMATION['spring.bouncy.damping'],
} as const;

/**
 * Microinteractions Design Tokens
 *
 * Organized by component/context for easy discovery and maintenance.
 * All values are semantic and describe the interaction, not the implementation.
 */
export const MICROINTERACTIONS = {
  /**
   * Button Microinteractions
   *
   * Standard button hover, tap, and state feedback animations.
   */
  button: {
    /**
     * Hover state animations
     * Applied when user hovers over button (desktop only)
     */
    hover: {
      scale: UI_ANIMATION['button.hover_scale'], // 1.02
      transition: SPRING_SMOOTH,
    },

    /**
     * Tap/press state animations
     * Applied when user clicks/taps button
     */
    tap: {
      scale: 0.95, // Slight press down effect
      transition: SPRING_SNAPPY,
    },

    /**
     * Default transition for button animations
     * Used for hover/tap state changes
     */
    transition: SPRING_SMOOTH,

    /**
     * Active state (when button is pressed/selected)
     */
    active: {
      scale: 0.97,
      transition: SPRING_SNAPPY,
    },

    /**
     * Disabled state (no interaction)
     */
    disabled: {
      scale: 1,
      opacity: 0.5,
    },
  },

  /**
   * Icon Button Microinteractions
   *
   * Specialized animations for icon-only buttons (bookmark, pin, copy, etc.)
   */
  iconButton: {
    /**
     * Hover state for icon buttons
     * Slightly more pronounced than regular buttons
     */
    hover: {
      scale: 1.1,
      transition: SPRING_SMOOTH,
    },

    /**
     * Tap state for icon buttons
     */
    tap: {
      scale: 0.9,
      transition: SPRING_SNAPPY,
    },

    /**
     * Active state (when icon button is toggled on)
     * Example: Bookmark button when bookmarked, Pin button when pinned
     */
    active: {
      scale: 1.05,
      color: 'var(--claude-orange)', // Brand orange
      transition: SPRING_SMOOTH,
    },

    /**
     * Inactive state (when icon button is toggled off)
     */
    inactive: {
      scale: 1,
      color: 'currentColor',
      transition: SPRING_SMOOTH,
    },

    /**
     * Default transition for icon button animations
     */
    transition: SPRING_SMOOTH,
  },

  /**
   * Card Microinteractions
   *
   * Hover and interaction effects for content cards
   */
  card: {
    /**
     * Hover state for cards
     * Subtle lift and border color change
     */
    hover: {
      scale: 1.02,
      y: -2, // Slight lift
      borderColor: 'rgba(249, 115, 22, 0.5)', // Orange border
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transition: SPRING_SMOOTH,
    },

    /**
     * Tap state for cards (mobile)
     */
    tap: {
      scale: 0.98,
      transition: SPRING_SNAPPY,
    },

    /**
     * Default transition for card animations
     */
    transition: SPRING_SMOOTH,
  },

  /**
   * Tooltip Microinteractions
   *
   * Entrance/exit animations for tooltips
   */
  tooltip: {
    /**
     * Initial state (before tooltip appears)
     */
    initial: {
      opacity: 0,
      y: -10,
      scale: 0.95,
    },

    /**
     * Animate state (when tooltip is visible)
     */
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
    },

    /**
     * Exit state (when tooltip disappears)
     */
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
    },

    /**
     * Transition for tooltip animations
     */
    transition: SPRING_SMOOTH,
  },

  /**
   * Icon State Transitions
   *
   * Animations for icon changes (e.g., Bookmark → BookmarkCheck)
   */
  iconTransition: {
    /**
     * Initial state for new icon (mounting)
     */
    initial: {
      scale: 0,
      rotate: -180,
    },

    /**
     * Animate state for new icon
     */
    animate: {
      scale: 1,
      rotate: 0,
    },

    /**
     * Exit state for old icon (unmounting)
     */
    exit: {
      scale: 0,
      rotate: 180,
    },

    /**
     * Transition for icon state changes
     */
    transition: SPRING_SNAPPY,
  },

  /**
   * Ripple Effect
   *
   * Material Design-inspired ripple effect for button clicks
   */
  ripple: {
    /**
     * Initial state for ripple
     */
    initial: {
      scale: 0,
      opacity: 0.5,
    },

    /**
     * Animate state for ripple (expanding)
     */
    animate: {
      scale: 10, // Expands 10x
      opacity: 0,
    },

    /**
     * Transition for ripple effect
     */
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },

  /**
   * Link Microinteractions
   *
   * Hover and interaction effects for navigation links, menu items, and text links
   * Designed for in-place color transitions without movement
   */
  link: {
    /**
     * Hover state for links
     * Subtle background color change, no movement
     */
    hover: {
      backgroundColor: 'rgba(249, 115, 22, 0.05)', // accent/5
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },

    /**
     * Hover state with border color change
     * For links that have borders (e.g., navigation cards)
     */
    hoverWithBorder: {
      backgroundColor: 'rgba(249, 115, 22, 0.05)', // accent/5
      borderColor: 'rgba(249, 115, 22, 0.5)', // accent/50
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },

    /**
     * Active state (when link is current page)
     * Slightly more prominent background
     */
    active: {
      backgroundColor: 'rgba(249, 115, 22, 0.1)', // accent/10
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },

    /**
     * Tap state for links (mobile)
     * Subtle press feedback
     */
    tap: {
      backgroundColor: 'rgba(249, 115, 22, 0.1)', // accent/10
      transition: {
        duration: 0.1,
        ease: 'easeOut',
      },
    },

    /**
     * Default transition for link animations
     * Smooth color changes without movement
     */
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },

  /**
   * Color Transitions
   *
   * Smooth color changes for state feedback
   */
  colorTransition: {
    /**
     * Fast color transition (for icon state changes)
     */
    fast: {
      duration: 0.2,
      ease: 'easeOut',
    },

    /**
     * Default color transition
     */
    default: {
      duration: 0.3,
      ease: 'easeOut',
    },

    /**
     * Slow color transition (for subtle state changes)
     */
    slow: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },

  /**
   * Scale Animations
   *
   * Reusable scale values for consistent sizing
   */
  scale: {
    /**
     * Subtle scale (for hover effects)
     */
    subtle: 1.02,

    /**
     * Default scale (for button hover)
     */
    default: 1.05,

    /**
     * Pronounced scale (for icon button hover)
     */
    pronounced: 1.1,

    /**
     * Pressed scale (for tap/active states)
     */
    pressed: 0.95,

    /**
     * Strong pressed scale (for icon buttons)
     */
    pressedStrong: 0.9,
  },

  /**
   * Opacity Animations
   *
   * Reusable opacity values for fade effects
   */
  opacity: {
    /**
     * Fully transparent
     */
    transparent: 0,

    /**
     * Subtle (for disabled states)
     */
    subtle: 0.5,

    /**
     * Default (for hover overlays)
     */
    default: 0.8,

    /**
     * Fully opaque
     */
    opaque: 1,
  },

  /**
   * Hero Section Microinteractions
   *
   * Animations for hero section when search is focused/unfocused
   */
  hero: {
    /**
     * Hero content when search is focused (blurred/background state)
     */
    focused: {
      opacity: 0.7,
      scale: 0.98,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 20,
        mass: 0.5,
      },
    },

    /**
     * Hero content when search is unfocused (normal state)
     */
    unfocused: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 20,
        mass: 0.5,
      },
    },

    /**
     * Default transition for hero animations
     */
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 20,
      mass: 0.5,
    },
  },

  /**
   * Search Bar Microinteractions
   *
   * Animations for search input focus, typing, and expansion
   */
  search: {
    /**
     * Focus state - when search input receives focus
     */
    focus: {
      scale: 1.02,
      borderColor: 'rgba(249, 115, 22, 0.6)', // HeyClaude orange
      boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.1)',
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 30,
        mass: 0.5,
      },
    },

    /**
     * Typing state - subtle pulse on search icon while typing
     */
    typing: {
      scale: [1, 1.1, 1],
      transition: {
        type: 'spring' as const,
        stiffness: 150,
        damping: 20,
        mass: 0.8,
        duration: 0.6,
        repeat: Infinity,
      },
    },

    /**
     * Expand state - when search expands (e.g., from button to input)
     */
    expand: {
      scale: 1,
      width: '100%',
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 30,
        mass: 0.5,
      },
    },

    /**
     * Default transition for search animations - smooth and liquid
     */
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 30,
      mass: 0.5,
    },
  },
} as const;

/**
 * Type helper for microinteractions tokens
 */
export type MicrointeractionsTokens = typeof MICROINTERACTIONS;

/**
 * Helper function to get button hover animation
 * Convenience wrapper for common use case
 */
export function getButtonHover() {
  return MICROINTERACTIONS.button.hover;
}

/**
 * Helper function to get button tap animation
 * Convenience wrapper for common use case
 */
export function getButtonTap() {
  return MICROINTERACTIONS.button.tap;
}

/**
 * Helper function to get icon button active state
 * Convenience wrapper for bookmark/pin buttons
 */
export function getIconButtonActive() {
  return MICROINTERACTIONS.iconButton.active;
}

/**
 * Helper function to get card hover animation
 * Convenience wrapper for content cards
 */
export function getCardHover() {
  return MICROINTERACTIONS.card.hover;
}

/**
 * Helper function to get link hover animation
 * Convenience wrapper for navigation links and menu items
 */
export function getLinkHover() {
  return MICROINTERACTIONS.link.hover;
}
