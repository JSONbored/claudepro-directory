'use client';

/**
 * Magnetic Component
 * 
 * A component that creates a magnetic attraction effect when the mouse cursor approaches.
 * Perfect for buttons, cards, and interactive elements that need extra engagement.
 * 
 * @example
 * ```tsx
 * <Magnetic strength={0.5} range={120}>
 *   <Button>Hover me!</Button>
 * </Magnetic>
 * ```
 * 
 * **When to use:**
 * - CTA buttons: Make important buttons more engaging
 * - Interactive cards: Add playful hover effects
 * - Navigation elements: Enhance interactivity
 * - Hero sections: Eye-catching elements
 * 
 * **Key features:**
 * - Smooth spring-based animation
 * - Configurable strength and range
 * - Hover-only mode option
 * - Touch device detection
 * - Motion.dev integration
 */

import * as React from 'react';
import {
  type HTMLMotionProps,
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from 'motion/react';
import { useMediaQuery, useIsClient } from '@heyclaude/web-runtime/hooks';
 
type MagneticProps = {
  children: React.ReactElement;
  strength?: number;
  range?: number;
  springOptions?: SpringOptions;
  onlyOnHover?: boolean;
  disableOnTouch?: boolean;
} & HTMLMotionProps<'div'>;
 
function Magnetic({
  ref,
  children,
  strength = 0.5,
  range = 120,
  springOptions = { stiffness: 100, damping: 10, mass: 0.5 },
  onlyOnHover = false,
  disableOnTouch = true,
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  ...props
}: MagneticProps) {
  const localRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref as any, () => localRef.current as HTMLDivElement);
  
  // Use useMediaQuery for touch device detection (replaces window.matchMedia)
  const isTouchDevice = useMediaQuery('(pointer:coarse)');
  const isClient = useIsClient();
 
  const [active, setActive] = React.useState(!onlyOnHover);
 
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, springOptions);
  const y = useSpring(rawY, springOptions);
 
  // Cache element bounds to avoid forced reflows
  const boundsRef = React.useRef<{ left: number; top: number; width: number; height: number; cx: number; cy: number } | null>(null);
  const updateBoundsRef = React.useCallback(() => {
    if (!localRef.current) {
      boundsRef.current = null;
      return;
    }
    const rect = localRef.current.getBoundingClientRect();
    boundsRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
    };
  }, []);

  // Update bounds on mount and resize (batched via ResizeObserver)
  React.useEffect(() => {
    if (!isClient || (disableOnTouch && isTouchDevice)) return;
    
    updateBoundsRef();
    
    const resizeObserver = new ResizeObserver(() => {
      // Batch bounds updates to avoid forced reflows
      requestAnimationFrame(updateBoundsRef);
    });
    
    if (localRef.current) {
      resizeObserver.observe(localRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isClient, disableOnTouch, isTouchDevice, updateBoundsRef]);

  const compute = React.useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!localRef.current || !boundsRef.current) {
        updateBoundsRef();
        if (!boundsRef.current) return;
      }
      
      const { cx, cy } = boundsRef.current;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if ((active || !onlyOnHover) && dist <= range) {
        const factor = (1 - dist / range) * strength;
        rawX.set(dx * factor);
        rawY.set(dy * factor);
      } else {
        rawX.set(0);
        rawY.set(0);
      }
    },
    [active, onlyOnHover, range, strength, rawX, rawY, updateBoundsRef],
  );
 
  React.useEffect(() => {
    if (!isClient || (disableOnTouch && isTouchDevice)) return;
    const handle = (e: MouseEvent) => compute(e);
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [compute, disableOnTouch, isTouchDevice, isClient]);
 
  return (
    <motion.div
      ref={localRef}
      className="inline-block"
      style={{
        ...style,
        x,
        y,
        // GPU acceleration hint for smooth magnetic effect
        willChange: active ? 'transform' : 'auto',
      }}
      onMouseEnter={(e) => {
        if (onlyOnHover) setActive(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (onlyOnHover) setActive(false);
        rawX.set(0);
        rawY.set(0);
        onMouseLeave?.(e);
      }}
      onMouseMove={(e) => {
        if (onlyOnHover) compute(e);
        onMouseMove?.(e);
      }}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
 
export { Magnetic, type MagneticProps };
