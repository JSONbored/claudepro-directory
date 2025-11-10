/**
 * FloatingActionBar Type Definitions
 * Type-safe configuration for speed dial actions
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Individual speed dial action
 */
export interface SpeedDialAction {
  /** Unique identifier */
  id: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Accessible label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional badge count (e.g., notifications) */
  badge?: number;
  /** Show on mobile only */
  mobileOnly?: boolean;
  /** Show on desktop only */
  desktopOnly?: boolean;
  /** Conditional visibility */
  show?: boolean;
}

/**
 * Main FAB configuration
 */
export interface MainFABConfig {
  /** Icon for main FAB */
  icon: LucideIcon;
  /** Accessible label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Badge count (optional) */
  badge?: number;
}

/**
 * Scroll behavior state
 */
export interface ScrollState {
  /** Current scroll position */
  scrollY: number;
  /** Is scrolling down */
  isScrollingDown: boolean;
  /** Is past visibility threshold */
  isPastThreshold: boolean;
  /** Should FAB be visible */
  isVisible: boolean;
}
