'use client';

/**
 * AnimatedSearchBar - Advanced Animation Wrapper
 *
 * Optional wrapper for SearchBar that adds advanced animations:
 * - Magnetic effects (cursor tracking) - Optimized with useTransform + frame utility
 * - Glassmorphism effects
 * - Particle effects when typing - Memoized for performance
 * - 3D transforms
 *
 * Performance optimizations:
 * - useTransform for derived values (no manual calculations)
 * - frame utility for batched DOM operations
 * - usePageInView to pause when tab hidden
 * - Memoized particle positions
 * - GPU acceleration hints (will-change, translateZ)
 *
 * @module web-runtime/search/components/animated-search-bar
 */

import { MICROINTERACTIONS, SPRING, STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
// COLORS removed - using CSS variables in Tailwind arbitrary values for dynamic gradients
import { useReducedMotion, usePageInView } from '@heyclaude/web-runtime/hooks/motion';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { frame } from 'motion';
import { useEffect, useRef, useMemo } from 'react';
import { useBoolean } from '../../hooks/use-boolean.ts';

import { useSearchContext } from '../context/search-provider';
import { SearchBar } from './search-bar';

export interface AnimatedSearchBarProps {
  /** Whether to enable magnetic effect */
  enableMagnetic?: boolean;
  /** Whether to enable expansion on focus */
  enableExpansion?: boolean;
  /** Whether to enable particle effects */
  enableParticles?: boolean;
  /** Callback when focus state changes */
  onFocusChange?: (isFocused: boolean) => void;
  /** All SearchBar props */
  searchBarProps?: React.ComponentProps<typeof SearchBar>;
  /** Custom className */
  className?: string;
}

/**
 * AnimatedSearchBar - Advanced animation wrapper for SearchBar
 *
 * @example
 * ```tsx
 * <SearchProvider>
 *   <AnimatedSearchBar
 *     enableMagnetic
 *     enableParticles
 *     searchBarProps={{
 *       placeholder: "Search...",
 *       variant: "magnetic"
 *     }}
 *   />
 * </SearchProvider>
 * ```
 */
export function AnimatedSearchBar({
  enableMagnetic = true,
  enableExpansion = true,
  enableParticles = true,
  onFocusChange,
  searchBarProps = {},
  className,
}: AnimatedSearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { value: isFocused, setValue: setIsFocused } = useBoolean();
  const { value: hasValue, setValue: setHasValue } = useBoolean();
  const { value: isMounted, setTrue: setIsMountedTrue } = useBoolean();
  const shouldReduceMotion = useReducedMotion();
  const isPageInView = usePageInView();

  // Wait for client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMountedTrue();
  }, [setIsMountedTrue]);

  // Motion values for magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Constants for magnetic effect
  const maxTilt = 6;
  const maxDistance = 250;

  // Springs that track tilt values (smooth, reactive)
  // CRITICAL FIX: useSpring takes initial value (number), not MotionValue
  // We'll update these springs directly in the useEffect, similar to magnetic-button.tsx
  const rotateX = useSpring(0, SPRING.smooth);
  const rotateY = useSpring(0, SPRING.smooth);
  const scale = useSpring(1, SPRING.default);

  // Track value changes from SearchBar context (for particle effects)
  // PERFORMANCE FIX: Disable particles during rapid typing
  const { query } = useSearchContext();
  const { value: isTyping, setTrue: setIsTypingTrue, setFalse: setIsTypingFalse } = useBoolean();

  useEffect(() => {
    const hasValue = query.length > 0;
    setHasValue(hasValue);

    // Mark as typing when query changes, clear after 300ms (reduced for better particle visibility)
    if (hasValue) {
      setIsTypingTrue();
      const timer = setTimeout(() => setIsTypingFalse(), 300);
      return () => clearTimeout(timer);
    } else {
      setIsTypingFalse();
      return undefined;
    }
  }, [query, setHasValue, setIsTypingTrue, setIsTypingFalse]);

  // Optimized mouse tracking with frame utility (prevents layout thrashing)
  // PERFORMANCE FIX: Throttle mouse events, only listen when hovering, pause when page hidden
  useEffect(() => {
    if (
      !enableMagnetic ||
      !containerRef.current ||
      shouldReduceMotion ||
      !isPageInView ||
      isTyping
    ) {
      // Reset to center when disabled
      if (enableMagnetic && containerRef.current) {
        frame.update(() => {
          mouseX.set(0);
          mouseY.set(0);
          rotateX.set(0);
          rotateY.set(0);
        });
      }
      return;
    }

    const container = containerRef.current;
    let isHovering = false;
    const lastMousePos = { x: 0, y: 0 };
    let rafId: number | null = null;
    let lastUpdateTime = 0;
    const THROTTLE_MS = 16; // ~60fps max

    // Only track mouse when hovering over search bar (not globally)
    const handleMouseEnter = () => {
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
      if (!isFocused) {
        frame.update(() => {
          mouseX.set(0);
          mouseY.set(0);
        });
      }
    };

    // Throttled mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) return; // Only process when hovering

      const now = performance.now();
      if (now - lastUpdateTime < THROTTLE_MS) return; // Throttle to ~60fps
      lastUpdateTime = now;

      lastMousePos.x = e.clientX;
      lastMousePos.y = e.clientY;
    };

    // Throttled frame callback (runs at ~30fps for magnetic effect, not every frame)
    const updateMouseTracking = () => {
      if (!isHovering || !container) {
        rafId = requestAnimationFrame(updateMouseTracking);
        return;
      }

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = lastMousePos.x - centerX;
      const y = lastMousePos.y - centerY;

      // Calculate tilt based on distance from center
      const distance = Math.sqrt(x * x + y * y);
      let newTiltX = 0;
      let newTiltY = 0;

      if (distance < maxDistance) {
        const tiltAmount = (1 - distance / maxDistance) * maxTilt;
        newTiltX = (-y / maxDistance) * tiltAmount;
        newTiltY = (x / maxDistance) * tiltAmount;
      }

      // Use frame.update() for value updates (batched)
      frame.update(() => {
        mouseX.set(x);
        mouseY.set(y);
        // CRITICAL FIX: Update springs directly (not MotionValues)
        rotateX.set(newTiltX);
        rotateY.set(newTiltY);
      });

      // Schedule next update (throttled to ~30fps instead of 60fps)
      rafId = requestAnimationFrame(updateMouseTracking);
    };

    // Start tracking
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousemove', handleMouseMove);
    rafId = requestAnimationFrame(updateMouseTracking);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      // Reset to center on cleanup
      frame.update(() => {
        mouseX.set(0);
        mouseY.set(0);
        rotateX.set(0);
        rotateY.set(0);
      });
    };
  }, [
    enableMagnetic,
    mouseX,
    mouseY,
    rotateX,
    rotateY,
    isFocused,
    shouldReduceMotion,
    isPageInView,
    isTyping,
    maxDistance,
    maxTilt,
  ]);

  // Handle focus state changes from SearchBar
  const handleFocusChange = (focused: boolean) => {
    setIsFocused(focused);
    if (enableExpansion) {
      scale.set(focused ? 1.015 : 1);
    }
    onFocusChange?.(focused);
  };

  // Memoize particle positions (prevents recalculation on every render)
  const particlePositions = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const angle = (i * Math.PI * 2) / 5;
      const baseRadius = 30;
      const variation = (i % 3) * 6.67;
      const radius = baseRadius + variation;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }, []);

  // Using CSS variables for dynamic gradients (already defined in globals.css)
  // These are used in inline styles for Framer Motion animations (necessary for dynamic values)
  const focusGlowGradient = useMemo(
    () =>
      `linear-gradient(to right, var(--color-search-glow-from), var(--color-search-glow-via), var(--color-search-glow-to))`,
    []
  );
  const particleBaseColor = useMemo(() => 'var(--color-search-particle-base)', []);
  const particleShadowColor = useMemo(() => 'var(--color-search-particle-shadow)', []);

  // Build style object - exclude Motion values during SSR
  const baseStyle =
    shouldReduceMotion || !enableMagnetic
      ? {}
      : {
          perspective: '1000px',
          transformStyle: 'preserve-3d' as const,
          willChange: 'transform',
        };

  // Only add Motion values after client-side mount
  const containerStyle =
    isMounted && !shouldReduceMotion && enableMagnetic
      ? ({
          ...baseStyle,
          scale,
          rotateX,
          rotateY,
        } as Record<string, unknown>)
      : baseStyle;

  const transitionConfig = isMounted
    ? {
        ...SPRING.hover,
        mass: 0.5,
      }
    : undefined;

  return (
    <motion.div
      ref={containerRef}
      className="relative"
      initial={false}
      style={containerStyle}
      {...(transitionConfig ? { transition: transitionConfig } : {})}
    >
      {/* Glassmorphism container */}
      <motion.div
        className="relative rounded-xl border backdrop-blur-xl"
        // Use initial={false} to prevent Motion.dev from applying initial styles during SSR
        // This ensures SSR and client render the same styles (prevents hydration mismatch)
        initial={false}
        {...(isMounted
          ? {
              animate: {
                ...(shouldReduceMotion
                  ? {}
                  : { scale: isFocused ? MICROINTERACTIONS.search.focus.scale : 1 }),
                borderColor: isFocused
                  ? MICROINTERACTIONS.search.focus.borderColor
                  : MICROINTERACTIONS.search.initial.borderColor,
                backgroundColor: isFocused
                  ? 'rgba(0, 0, 0, 0.4)'
                  : MICROINTERACTIONS.search.initial.backgroundColor,
              },
            }
          : {})}
        transition={{
          ...SPRING.hover,
          mass: 0.5,
        }}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          contain: 'layout style paint',
          // Use inline style for boxShadow to prevent Motion.dev from trying to animate it
          // This avoids OKLCH/OKLAB conversion issues when Motion.dev reads computed styles
          // Also ensures SSR and client render the same boxShadow (prevents hydration mismatch)
          boxShadow: isFocused
            ? `${MICROINTERACTIONS.search.focus.boxShadow}, 0 8px 32px rgba(0, 0, 0, 0.3)`
            : '0 4px 16px rgba(0, 0, 0, 0.15)', // Explicit RGB - prevents OKLCH conversion
          // Set initial borderColor and backgroundColor in style to match SSR
          // This ensures SSR and client render the same initial styles (prevents hydration mismatch)
          // Only set these when not mounted (SSR) or when not focused (initial state)
          borderColor:
            !isMounted || !isFocused ? MICROINTERACTIONS.search.initial.borderColor : undefined, // Let animate handle focused state after mount
          backgroundColor:
            !isMounted || !isFocused ? MICROINTERACTIONS.search.initial.backgroundColor : undefined, // Let animate handle focused state after mount
        }}
      >
        {/* Beautiful orange focus glow effect - More vibrant and visible */}
        {/* Uses design tokens for consistent colors */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              className="absolute -inset-1 -z-10 rounded-xl blur-xl"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{
                ...SPRING.hover,
                mass: 0.5,
              }}
              style={{
                willChange: 'opacity, transform',
                transform: 'translateZ(0)',
                background: focusGlowGradient,
              }}
            />
          )}
        </AnimatePresence>

        {/* Beautiful particle effects when typing - More visible orange particles */}
        {/* PERFORMANCE FIX: Disable particles during rapid typing */}
        {/* Uses design tokens for consistent colors */}
        <AnimatePresence>
          {isFocused && hasValue && enableParticles && !isTyping && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
              {particlePositions.map((pos, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    left: '50%',
                    top: '50%',
                    willChange: 'transform, opacity',
                    transform: 'translateZ(0)',
                    backgroundColor: particleBaseColor,
                    // Use inline style for boxShadow to prevent Motion.dev from trying to animate it
                    // This avoids OKLCH/OKLAB conversion issues when Motion.dev reads computed styles
                    boxShadow: `0 0 8px ${particleShadowColor}`,
                  }}
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0, x: 0, y: 0 }
                  }
                  animate={
                    shouldReduceMotion
                      ? { opacity: [0, 1, 0.8, 0] }
                      : {
                          opacity: [0, 1, 0.8, 0],
                          scale: [0, 1.2, 1, 0],
                          x: pos.x,
                          y: pos.y,
                        }
                  }
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                  transition={{
                    duration: DURATION.extendedLong,
                    repeat: Infinity,
                    delay: i * STAGGER.medium,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* SearchBar component */}
        <div className={className}>
          <SearchBar {...searchBarProps} variant="magnetic" onFocusChange={handleFocusChange} />
        </div>
      </motion.div>
    </motion.div>
  );
}
