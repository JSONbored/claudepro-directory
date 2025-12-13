/**
 * useSpring Hook
 * 
 * Creates a spring-animated MotionValue that smoothly animates to target values
 * using physics-based spring animations. Perfect for natural, bouncy motion.
 * 
 * @module web-runtime/hooks/motion/use-spring
 * 
 * @example
 * ```tsx
 * function AnimatedCounter({ targetValue }) {
 *   const spring = useSpring(0, SPRING.smooth);
 *   
 *   useEffect(() => {
 *     spring.set(targetValue);
 *   }, [targetValue, spring]);
 *   
 *   return <div>{Math.round(spring.get())}</div>;
 * }
 * ```
 */

'use client';

import { useSpring as useMotionSpring } from 'motion/react';

/**
 * Hook that creates a spring-animated MotionValue.
 * 
 * Spring animations use physics-based motion for natural, bouncy animations.
 * The value will smoothly animate to the target using spring physics.
 * 
 * This is a re-export of Motion.dev's useSpring for consistency
 * and centralized imports.
 * 
 * @param initial - Initial value for the spring
 * @param springConfig - Spring configuration (damping, stiffness, mass, etc.)
 * @returns A spring-animated MotionValue
 * 
 * @see https://motion.dev/docs/react/utilities/use-spring
 */
export const useSpring = useMotionSpring;
