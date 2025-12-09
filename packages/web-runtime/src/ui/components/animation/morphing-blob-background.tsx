'use client';

/**
 * Morphing Blob Background Component
 *
 * Creates stunning, fluid SVG blob shapes that morph continuously and respond to user interaction.
 * Replaces static particles with dynamic, organic shapes that create visual interest.
 *
 * Features:
 * - 2-3 large morphing SVG blobs with smooth path animations
 * - Responds to mouse position (blobs lean toward cursor)
 * - Flows toward search bar when search is focused
 * - GPU-accelerated SVG path morphing
 * - Respects prefers-reduced-motion
 * - Performance optimized (uses Motion.dev's efficient SVG animation)
 *
 * Usage:
 * ```tsx
 * <div className="relative">
 *   <MorphingBlobBackground targetRef={searchRef} isTargetActive={isFocused} />
 *   <YourContent />
 * </div>
 * ```
 */

import { cn } from '../../utils.ts';
import { motion, useMotionValue, useSpring, animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface MorphingBlobBackgroundProps {
  /** Target element ref (e.g., search bar) - blobs will flow toward it when active */
  targetRef?: React.RefObject<HTMLElement>;
  /** Whether target is active (e.g., search is focused) */
  isTargetActive?: boolean;
  /** Number of blobs (default: 3) */
  blobCount?: number;
  /** Blob colors (default: orange gradient variations) */
  colors?: string[];
  /** Disable animations (respects prefers-reduced-motion) */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Generate a blob SVG path using smooth curves
 * Creates organic, flowing shapes that morph naturally
 */
function generateBlobPath(
  centerX: number,
  centerY: number,
  radius: number,
  complexity: number,
  time: number,
  seed: number
): string {
  const numPoints = 16; // More points = smoother blob
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Add time-based variation with seed for unique morphing per blob
    const variation = Math.sin(time * 0.3 + seed + i * 0.5) * complexity;
    const currentRadius = radius + variation;

    points.push({
      x: centerX + Math.cos(angle) * currentRadius,
      y: centerY + Math.sin(angle) * currentRadius,
    });
  }

  // Create smooth SVG path using cubic bezier curves for fluid motion
  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  
  for (let i = 0; i < numPoints; i++) {
    const current = points[i]!;
    const next = points[(i + 1) % numPoints]!;
    const nextNext = points[(i + 2) % numPoints]!;
    
    // Calculate control points for smooth curves
    const cp1x = current.x + (next.x - current.x) * 0.6;
    const cp1y = current.y + (next.y - current.y) * 0.6;
    const cp2x = next.x - (nextNext.x - next.x) * 0.2;
    const cp2y = next.y - (nextNext.y - next.y) * 0.2;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  path += ' Z';

  return path;
}

/**
 * Individual blob component with position and morphing
 */
function BlobShape({
  baseX,
  baseY,
  mouseX,
  mouseY,
  targetRef,
  isTargetActive,
  gradientId,
  seed,
  containerRef,
}: {
  baseX: number;
  baseY: number;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  targetRef?: React.RefObject<HTMLElement>;
  isTargetActive?: boolean;
  gradientId: string;
  seed: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Spring-animated position
  const x = useSpring(baseX, { stiffness: 50, damping: 25 });
  const y = useSpring(baseY, { stiffness: 50, damping: 25 });

  // Time value for morphing
  const time = useMotionValue(0);

  // Update position based on mouse/target
  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;

      let targetX = baseX;
      let targetY = baseY;

      // If search is focused, flow toward search bar
      if (isTargetActive && targetRef?.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const targetRect = targetRef.current.getBoundingClientRect();
        targetX = targetRect.left + targetRect.width / 2 - containerRect.left;
        targetY = targetRect.top + targetRect.height / 2 - containerRect.top;
      } else {
        // Otherwise, respond to mouse (with damping)
        const mouseXValue = mouseX.get();
        const mouseYValue = mouseY.get();

        if (mouseXValue !== 0 && mouseYValue !== 0) {
          // Calculate attraction (weaker than direct follow)
          const dx = mouseXValue - baseX;
          const dy = mouseYValue - baseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 400; // Maximum attraction distance

          if (distance < maxDistance && distance > 50) {
            const attraction = (1 - distance / maxDistance) * 0.4; // 40% max attraction
            targetX = baseX + dx * attraction;
            targetY = baseY + dy * attraction;
          }
        }
      }

      x.set(targetX);
      y.set(targetY);
    };

    const unsubscribeX = mouseX.on('change', updatePosition);
    const unsubscribeY = mouseY.on('change', updatePosition);

    // Also update periodically for target changes (throttled)
    const interval = setInterval(updatePosition, 100);

    // Initial update
    updatePosition();

    return () => {
      unsubscribeX();
      unsubscribeY();
      clearInterval(interval);
    };
  }, [baseX, baseY, mouseX, mouseY, targetRef, isTargetActive, x, y, containerRef]);

  // Animate time for continuous morphing
  useEffect(() => {
    const animation = animate(time, Infinity, {
      duration: 20,
      repeat: Infinity,
      ease: 'linear',
    });

    return () => animation.stop();
  }, [time]);

  // Generate paths for morphing - update based on position and time
  const [currentPath, setCurrentPath] = useState(() =>
    generateBlobPath(baseX, baseY, 200, 50, 0, seed)
  );
  const [nextPath, setNextPath] = useState(() =>
    generateBlobPath(baseX, baseY, 200, 60, 2, seed)
  );

  // Update paths when position or time changes (throttled for performance)
  useEffect(() => {
    let lastUpdate = 0;
    const throttleMs = 50; // Update at most every 50ms

    const updatePaths = () => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      const valX = x.get();
      const valY = y.get();
      const t = time.get();
      
      // Update current path
      setCurrentPath(generateBlobPath(valX, valY, 200, 50, t, seed));
      
      // Update next path for morphing
      setNextPath(generateBlobPath(valX, valY, 200, 55 + Math.sin(t) * 15, t + 2, seed));
    };

    const unsubscribeX = x.on('change', updatePaths);
    const unsubscribeY = y.on('change', updatePaths);
    const unsubscribeTime = time.on('change', updatePaths);

    // Also update periodically
    const interval = setInterval(updatePaths, 100);

    // Initial update
    updatePaths();

    return () => {
      unsubscribeX();
      unsubscribeY();
      unsubscribeTime();
      clearInterval(interval);
    };
  }, [x, y, time, seed]);

  // Cycle paths for continuous morphing
  useEffect(() => {
    const interval = setInterval(() => {
      const valX = x.get();
      const valY = y.get();
      const t = time.get();
      // Switch to next path and generate new next
      setCurrentPath(nextPath);
      setNextPath(generateBlobPath(valX, valY, 200, 50 + Math.random() * 20, t + 2, seed));
    }, 4000);

    return () => clearInterval(interval);
  }, [x, y, time, seed, nextPath]);

  return (
    <motion.g
      style={{
        filter: isTargetActive ? 'blur(25px)' : 'blur(20px)',
        opacity: isTargetActive ? 0.6 : 0.4,
      }}
    >
      <motion.path
        d={currentPath}
        animate={{ d: nextPath }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          fill: `url(#${gradientId})`,
        }}
      />
    </motion.g>
  );
}

export function MorphingBlobBackground({
  targetRef,
  isTargetActive = false,
  blobCount = 3,
  colors = ['#F97316', '#FB923C', '#FDBA74'], // Orange gradient variations
  disabled = false,
  className,
}: MorphingBlobBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  // Don't initialize positions until container is ready - prevents flash of wrong positions
  const [blobPositions, setBlobPositions] = useState<Array<{ x: number; y: number }>>([]);

  // Motion values for mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Check for reduced motion
  useEffect(() => {
    setIsMounted(true);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Initialize blob positions - wait for container to be ready
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        
        // Only set positions if container has valid dimensions (prevents flash of wrong positions)
        if (rect.width > 0 && rect.height > 0) {
          // Initialize blob positions (distributed across container)
          const positions = Array.from({ length: blobCount }, (_, i) => {
            const angle = (i / blobCount) * Math.PI * 2;
            const radius = Math.min(rect.width, rect.height) * 0.25;
            return {
              x: rect.width / 2 + Math.cos(angle) * radius,
              y: rect.height / 2 + Math.sin(angle) * radius,
            };
          });
          setBlobPositions(positions);
          return true; // Successfully set positions
        }
      }
      return false; // Container not ready
    };

    // Try immediately, then wait for next frame, then use ResizeObserver as fallback
    let rafId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Try immediately
    if (!updateContainerSize()) {
      // If not ready, wait for next frame
      rafId = requestAnimationFrame(() => {
        if (!updateContainerSize()) {
          // If still not ready, try again after a short delay
          timeoutId = setTimeout(() => {
            updateContainerSize();
          }, 100);
        }
      });
    }
    
    // Only set up animations if not reduced motion and not disabled
    if (!prefersReducedMotion && !disabled) {
      const resizeObserver = new ResizeObserver(updateContainerSize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      // Track mouse position
      const handleMouseMove = (e: MouseEvent) => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          mouseX.set(e.clientX - rect.left);
          mouseY.set(e.clientY - rect.top);
        }
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
        resizeObserver.disconnect();
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
    
    // If reduced motion or disabled, still update positions but don't set up animations
    // Use a one-time resize observer to get initial size
    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [blobCount, disabled, mouseX, mouseY]);

  // Don't render until positions are initialized (prevents flash of wrong positions)
  if (!isMounted || disabled || blobPositions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      <svg className="h-full w-full" style={{ opacity: 1 }}>
        <defs>
          {/* Gradient definitions for each blob */}
          {colors.map((color, index) => (
            <radialGradient key={index} id={`blob-gradient-${index}`}>
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="50%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.1} />
            </radialGradient>
          ))}
        </defs>

        {/* Render blobs */}
        {blobPositions.map((pos, index) => (
          <BlobShape
            key={index}
            baseX={pos.x}
            baseY={pos.y}
            mouseX={mouseX}
            mouseY={mouseY}
            {...(targetRef ? { targetRef } : {})}
            {...(isTargetActive !== undefined ? { isTargetActive } : {})}
            gradientId={`blob-gradient-${index}`}
            seed={index * 2.5} // Unique seed for each blob
            containerRef={containerRef}
          />
        ))}
      </svg>
    </div>
  );
}
