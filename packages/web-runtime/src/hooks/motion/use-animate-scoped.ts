/**
 * useAnimateScoped Hook
 * 
 * Provides a way of using the animate function that is scoped to the elements within your component.
 * This allows you to use manual animation controls, timelines, selectors scoped to your component,
 * and automatic cleanup.
 * 
 * @module web-runtime/hooks/motion/use-animate-scoped
 * 
 * @example
 * ```tsx
 * function Component() {
 *   const [scope, animate] = useAnimateScoped();
 *   
 *   useEffect(() => {
 *     // This "li" selector will only select children of scope
 *     animate("li", { opacity: 1 });
 *   }, [animate]);
 *   
 *   return <ul ref={scope}>{children}</ul>;
 * }
 * ```
 * 
 * @example
 * ```tsx
 * function FormWizard({ currentStep }) {
 *   const [scope, animate] = useAnimateScoped();
 *   
 *   useEffect(() => {
 *     // Animate step transition
 *     animate(scope.current, { opacity: 0 }, { duration: 0.2 });
 *     animate(scope.current, { opacity: 1 }, { duration: 0.3 });
 *   }, [currentStep, animate, scope]);
 *   
 *   return <div ref={scope}>{/* Step content *\/}</div>;
 * }
 * ```
 */

'use client';

import { useAnimate } from 'motion/react';

/**
 * Scoped animation hook that provides a scope ref and animate function.
 * 
 * The scope ref must be passed to either a regular HTML/SVG element or a motion component.
 * The animate function can be used with:
 * - Direct element references: `animate(scope.current, { opacity: 1 })`
 * - Scoped selectors: `animate("li", { opacity: 1 })` (only affects children of scope)
 * 
 * When the component unmounts, all animations started with this animate function are
 * automatically cleaned up.
 * 
 * @returns Tuple of `[scope, animate]` where:
 *   - `scope`: Ref to attach to the root element
 *   - `animate`: Function to animate elements within the scope
 * 
 * @see https://motion.dev/docs/react/utilities/use-animate
 */
export function useAnimateScoped(): ReturnType<typeof useAnimate> {
  return useAnimate();
}
