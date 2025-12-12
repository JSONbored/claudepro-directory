/**
 * MotionConfig Provider
 * 
 * Sets global configuration options for all child motion components.
 * Provides consistent animation defaults, reduced motion policy, and CSP support.
 * 
 * @module web-runtime/ui/providers/motion-config-provider
 * 
 * @example
 * ```tsx
 * // In root layout
 * <MotionConfigProvider>
 *   <App />
 * </MotionConfigProvider>
 * ```
 */

'use client';

import { MotionConfig as MotionMotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import type { Transition } from 'motion/react';

export interface MotionConfigProviderProps {
  /**
   * Child components that will use Motion.dev animations
   */
  children: ReactNode;

  /**
   * Global transition defaults for all motion components
   * @default { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
   */
  transition?: Transition;

  /**
   * Reduced motion policy
   * - "user": Respect the user's device setting (recommended)
   * - "always": Enforce reduced motion (useful for debugging)
   * - "never": Don't respect reduced motion (not recommended)
   * 
   * @default "user"
   */
  reducedMotion?: 'user' | 'always' | 'never';

  /**
   * Content Security Policy nonce for style blocks
   * @default undefined
   */
  nonce?: string;
}

/**
 * Provider component that sets global configuration for all child motion components.
 * 
 * This ensures consistent animation behavior across the app and provides a centralized
 * way to configure animation defaults, reduced motion policy, and CSP compliance.
 * 
 * @param props - Provider props
 * @returns MotionConfig wrapper component
 * 
 * @see https://motion.dev/docs/react/motion-config
 */
export function MotionConfigProvider({
  children,
  transition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1], // Custom easing curve (easeOutExpo)
  },
  reducedMotion = 'user',
  nonce,
}: MotionConfigProviderProps) {
  return (
    <MotionMotionConfig
      transition={transition}
      reducedMotion={reducedMotion}
      {...(nonce ? { nonce } : {})}
    >
      {children}
    </MotionMotionConfig>
  );
}
