/**
 * LazyMotion Provider
 * 
 * Reduces Motion.dev bundle size from ~34kb to ~4.6kb for initial render.
 * Features are loaded on-demand, improving Core Web Vitals and initial load performance.
 * 
 * @module web-runtime/ui/providers/lazy-motion-provider
 * 
 * @example
 * ```tsx
 * // In root layout
 * <LazyMotionProvider>
 *   <App />
 * </LazyMotionProvider>
 * ```
 */

'use client';

import { LazyMotion as MotionLazyMotion, domAnimation } from 'motion/react';
import type { ReactNode } from 'react';
import type { FeatureBundle, LazyFeatureBundle } from 'motion/react';

export interface LazyMotionProviderProps {
  /**
   * Child components that will use Motion.dev animations
   */
  children: ReactNode;

  /**
   * Whether to use strict mode (throws error if motion components are used instead of m components)
   * @default false
   */
  strict?: boolean;

  /**
   * Feature bundle to load
   * @default domAnimation (4.6kb initial bundle)
   */
  features?: FeatureBundle | LazyFeatureBundle;
}

/**
 * Provider component that wraps the app with LazyMotion for bundle size optimization.
 * 
 * This reduces the initial Motion.dev bundle from ~34kb to ~4.6kb by lazy-loading
 * animation features. Features are loaded on-demand, improving initial page load.
 * 
 * **Important:** Existing `motion` imports will continue to work. For new components,
 * consider using `m` from `motion/react-m` for even better code splitting.
 * 
 * @param props - Provider props
 * @returns LazyMotion wrapper component
 * 
 * @see https://motion.dev/docs/react/lazy-motion
 */
export function LazyMotionProvider({
  children,
  strict = false,
  features = domAnimation,
}: LazyMotionProviderProps) {
  return (
    <MotionLazyMotion features={features} strict={strict}>
      {children}
    </MotionLazyMotion>
  );
}
