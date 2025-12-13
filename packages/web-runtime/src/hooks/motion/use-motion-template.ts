/**
 * useMotionTemplate Hook
 * 
 * Creates a motion value from a string template containing other motion values.
 * The template automatically updates when any motion value within it changes.
 * 
 * This is a direct re-export of Motion.dev's useMotionTemplate for consistency
 * and centralized imports.
 * 
 * @module web-runtime/hooks/motion/use-motion-template
 * 
 * @example
 * ```tsx
 * import { useMotionTemplate, useMotionValue } from '@heyclaude/web-runtime/hooks/motion';
 * 
 * const blur = useMotionValue(10);
 * const saturate = useMotionValue(50);
 * const filter = useMotionTemplate`blur(${blur}px) saturate(${saturate}%)`;
 * 
 * return <motion.div style={{ filter }} />;
 * ```
 * 
 * @example
 * ```tsx
 * // Drop shadow with motion values
 * const shadowX = useSpring(0);
 * const shadowY = useMotionValue(0);
 * const filter = useMotionTemplate`drop-shadow(${shadowX}px ${shadowY}px 20px rgba(0,0,0,0.3))`;
 * ```
 * 
 * @see https://motion.dev/docs/react-use-motion-template
 */

'use client';

import { useMotionTemplate as useMotionTemplateOriginal } from 'motion/react';

/**
 * Creates a motion value from a string template containing other motion values.
 * 
 * This is a tagged template function, so it's called as a template literal:
 * ```tsx
 * const filter = useMotionTemplate`blur(${blur}px) saturate(${saturate}%)`;
 * ```
 * 
 * The returned motion value will automatically update whenever any motion value
 * within the template changes.
 * 
 * @param template - Template literal with motion values interpolated
 * @returns Motion value that updates when template values change
 */
export const useMotionTemplate = useMotionTemplateOriginal;
