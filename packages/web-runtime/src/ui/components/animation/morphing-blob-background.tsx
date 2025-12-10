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
import { logClientInfo, logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';

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
 * CRITICAL: Validates all inputs to prevent NaN values
 */
function generateBlobPath(
  centerX: number,
  centerY: number,
  radius: number,
  complexity: number,
  time: number,
  seed: number
): string {
  // CRITICAL: Validate inputs to prevent NaN
  const safeCenterX = Number.isFinite(centerX) ? centerX : 600;
  const safeCenterY = Number.isFinite(centerY) ? centerY : 300;
  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : 200;
  const safeComplexity = Number.isFinite(complexity) && complexity > 0 ? complexity : 50;
  const safeTime = Number.isFinite(time) ? time : 0;
  const safeSeed = Number.isFinite(seed) ? seed : 0;

  // Log if we had to fix invalid values
  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
    logClientWarn(
      '[MorphingBlobBackground] Invalid position values in generateBlobPath',
      normalizeError(new Error('Invalid position values'), 'generateBlobPath validation failed'),
      'MorphingBlobBackground.generateBlobPath',
      {
        component: 'MorphingBlobBackground',
        action: 'path-generation',
        category: 'animation',
        originalCenterX: centerX,
        originalCenterY: centerY,
        safeCenterX,
        safeCenterY,
      }
    );
  }

  const numPoints = 16; // More points = smoother blob
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Add time-based variation with seed for unique morphing per blob
    const variation = Math.sin(safeTime * 0.3 + safeSeed + i * 0.5) * safeComplexity;
    const currentRadius = safeRadius + variation;

    const pointX = safeCenterX + Math.cos(angle) * currentRadius;
    const pointY = safeCenterY + Math.sin(angle) * currentRadius;

    // Final validation - ensure point is valid
    if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
      logClientWarn(
        '[MorphingBlobBackground] Invalid point calculated',
        normalizeError(new Error('Invalid point values'), 'Point calculation failed'),
        'MorphingBlobBackground.generateBlobPath',
        {
          component: 'MorphingBlobBackground',
          action: 'point-calculation',
          category: 'animation',
          pointIndex: i,
          pointX,
          pointY,
          centerX: safeCenterX,
          centerY: safeCenterY,
          radius: currentRadius,
        }
      );
      // Use fallback position
      points.push({
        x: safeCenterX + Math.cos(angle) * safeRadius,
        y: safeCenterY + Math.sin(angle) * safeRadius,
      });
    } else {
      points.push({ x: pointX, y: pointY });
    }
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
  // CRITICAL: Validate baseX/baseY before using - prevent NaN propagation
  const safeBaseX = Number.isFinite(baseX) ? baseX : 600;
  const safeBaseY = Number.isFinite(baseY) ? baseY : 300;

  // Log if we had to fix invalid values
  if (!Number.isFinite(baseX) || !Number.isFinite(baseY)) {
    logClientWarn(
      '[MorphingBlobBackground] Invalid baseX/baseY in BlobShape',
      normalizeError(new Error('Invalid position values'), 'BlobShape validation failed'),
      'MorphingBlobBackground.BlobShape',
      {
        component: 'MorphingBlobBackground',
        action: 'blob-initialization',
        category: 'animation',
        originalBaseX: baseX,
        originalBaseY: baseY,
        safeBaseX,
        safeBaseY,
      }
    );
  }

  // Spring-animated position - smoother, more liquid physics
  // Use safe values to prevent NaN initialization
  const x = useSpring(safeBaseX, { stiffness: 150, damping: 30, mass: 0.8 });
  const y = useSpring(safeBaseY, { stiffness: 150, damping: 30, mass: 0.8 });

  // Time value for morphing
  const time = useMotionValue(0);

  // Update position based on mouse/target
  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;

      // Use safe values
      let targetX = safeBaseX;
      let targetY = safeBaseY;

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

        if (mouseXValue !== 0 && mouseYValue !== 0 && Number.isFinite(mouseXValue) && Number.isFinite(mouseYValue)) {
          // Calculate attraction (weaker than direct follow)
          const dx = mouseXValue - safeBaseX;
          const dy = mouseYValue - safeBaseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 400; // Maximum attraction distance

          if (distance < maxDistance && distance > 50 && Number.isFinite(distance)) {
            const attraction = (1 - distance / maxDistance) * 0.4; // 40% max attraction
            targetX = safeBaseX + dx * attraction;
            targetY = safeBaseY + dy * attraction;
          }
        }
      }

      // Final validation before setting
      if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
        x.set(targetX);
        y.set(targetY);
      } else {
        logClientWarn(
          '[MorphingBlobBackground] Invalid targetX/targetY calculated',
          normalizeError(new Error('Invalid target position'), 'Position update failed'),
          'MorphingBlobBackground.BlobShape.updatePosition',
          {
            component: 'MorphingBlobBackground',
            action: 'position-update',
            category: 'animation',
            targetX,
            targetY,
            safeBaseX,
            safeBaseY,
          }
        );
      }
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
  }, [safeBaseX, safeBaseY, mouseX, mouseY, targetRef, isTargetActive, x, y, containerRef]);

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
  // Use safe values to prevent NaN
  const [currentPath, setCurrentPath] = useState(() =>
    generateBlobPath(safeBaseX, safeBaseY, 200, 50, 0, seed)
  );
  const [nextPath, setNextPath] = useState(() =>
    generateBlobPath(safeBaseX, safeBaseY, 200, 60, 2, seed)
  );

  // Update paths when position or time changes (throttled for performance)
  // PERFORMANCE: Increased throttle to 200ms and reduced interval to 200ms for smoother animations
  useEffect(() => {
    let lastUpdate = 0;
    const throttleMs = 200; // Update at most every 200ms (was 50ms - too frequent)

    const updatePaths = () => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      const valX = x.get();
      const valY = y.get();
      const t = time.get();
      
      // Validate values before generating paths
      if (!Number.isFinite(valX) || !Number.isFinite(valY) || !Number.isFinite(t)) {
        logClientWarn(
          '[MorphingBlobBackground] Invalid values in updatePaths',
          normalizeError(new Error('Invalid motion values'), 'Path update failed'),
          'MorphingBlobBackground.BlobShape.updatePaths',
          {
            component: 'MorphingBlobBackground',
            action: 'path-update',
            category: 'animation',
            valX,
            valY,
            t,
            safeBaseX,
            safeBaseY,
          }
        );
        return; // Skip update if values are invalid
      }
      
      // Update current path
      setCurrentPath(generateBlobPath(valX, valY, 200, 50, t, seed));
      
      // Update next path for morphing
      setNextPath(generateBlobPath(valX, valY, 200, 55 + Math.sin(t) * 15, t + 2, seed));
    };

    const unsubscribeX = x.on('change', updatePaths);
    const unsubscribeY = y.on('change', updatePaths);
    const unsubscribeTime = time.on('change', updatePaths);

    // PERFORMANCE: Reduced interval from 100ms to 200ms
    const interval = setInterval(updatePaths, 200);

    // Initial update
    updatePaths();

    return () => {
      unsubscribeX();
      unsubscribeY();
      unsubscribeTime();
      clearInterval(interval);
    };
  }, [x, y, time, seed]);

  // Cycle paths for continuous morphing - smoother transitions
  useEffect(() => {
    const interval = setInterval(() => {
      const valX = x.get();
      const valY = y.get();
      const t = time.get();
      
      // Validate values before generating paths
      if (!Number.isFinite(valX) || !Number.isFinite(valY) || !Number.isFinite(t)) {
        return; // Skip if values are invalid
      }
      
      // Switch to next path and generate new next
      setCurrentPath(nextPath);
      setNextPath(generateBlobPath(valX, valY, 200, 50 + Math.random() * 20, t + 2, seed));
    }, 5000); // Slower cycle for smoother morphing

    return () => clearInterval(interval);
  }, [x, y, time, seed, nextPath, safeBaseX, safeBaseY]);

  return (
    <motion.g
      style={{
        filter: isTargetActive ? 'blur(15px)' : 'blur(12px)',
        opacity: isTargetActive ? 0.8 : 0.6,
        willChange: 'transform, opacity', // PERFORMANCE: Hint to browser for GPU acceleration
      }}
    >
      <motion.path
        d={currentPath}
        animate={{ d: nextPath }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1], // Smooth cubic bezier for liquid feel
        }}
        style={{
          fill: `url(#${gradientId})`,
          willChange: 'd', // PERFORMANCE: Hint to browser for GPU acceleration
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
  
  // CRITICAL FIX: Initialize with default positions (consistent SSR/client values)
  // Use same default values for SSR and client to prevent hydration mismatch
  // Positions will be refined on client once container dimensions are available
  const [blobPositions, setBlobPositions] = useState<Array<{ x: number; y: number }>>(() => {
    // Use consistent default positions for both SSR and client
    // These will be refined once container dimensions are available
    const defaultWidth = 1200;
    const defaultHeight = 600;
    return Array.from({ length: blobCount }, (_, i) => {
      const angle = (i / blobCount) * Math.PI * 2;
      const radius = Math.min(defaultWidth, defaultHeight) * 0.25;
      return {
        x: defaultWidth / 2 + Math.cos(angle) * radius,
        y: defaultHeight / 2 + Math.sin(angle) * radius,
      };
    });
  });

  // Motion values for mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Mount check and reduced motion detection
  // CRITICAL: Set isMounted immediately on client (not in useEffect) to prevent SSR/client mismatch
  // This ensures the component renders on first client paint
  useEffect(() => {
    // Use requestAnimationFrame to ensure this runs after initial render
    requestAnimationFrame(() => {
      setIsMounted(true);
      logClientInfo(
        '[MorphingBlobBackground] Component mounted',
        'MorphingBlobBackground.mount',
        {
          component: 'MorphingBlobBackground',
          action: 'mount',
          category: 'animation',
          blobCount,
          disabled,
          hasTargetRef: Boolean(targetRef),
          isTargetActive,
        }
      );
    });
  }, [blobCount, disabled, isTargetActive, targetRef]);

  // CRITICAL FIX: Use useEffect (not useLayoutEffect) to avoid blocking paint
  // Refine positions once container dimensions are available
  // This ensures positions are preserved until container is ready
  useEffect(() => {
    if (!isMounted || disabled || !containerRef.current) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Refine positions based on actual container dimensions
    // CRITICAL: Only update if dimensions are valid - NEVER clear positions
    // Use functional setState to ensure we always have valid positions
    const refinePositions = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      
      // Only refine if container has valid dimensions (width and height > 0)
      // This prevents clearing positions when container dimensions aren't available yet
      if (rect.width > 0 && rect.height > 0) {
        const positions = Array.from({ length: blobCount }, (_, i) => {
          const angle = (i / blobCount) * Math.PI * 2;
          const radius = Math.min(rect.width, rect.height) * 0.25;
          return {
            x: rect.width / 2 + Math.cos(angle) * radius,
            y: rect.height / 2 + Math.sin(angle) * radius,
          };
        });
        
        logClientInfo(
          '[MorphingBlobBackground] Refined positions based on container',
          'MorphingBlobBackground.refinePositions',
          {
            component: 'MorphingBlobBackground',
            action: 'position-refinement',
            category: 'animation',
            width: rect.width,
            height: rect.height,
            positionCount: positions.length,
          }
        );
        
        // Use functional setState to ensure we always have valid positions
        setBlobPositions((prevPositions) => {
          // If previous positions exist and are valid, only update if new positions are also valid
          if (prevPositions.length === blobCount && positions.length === blobCount) {
            return positions;
          }
          // Fallback to previous positions if something went wrong
          return prevPositions.length > 0 ? prevPositions : positions;
        });
      } else {
        // Container doesn't have dimensions yet - preserve existing positions
        // This prevents clearing positions during initial render or layout shifts
        logClientInfo(
          '[MorphingBlobBackground] Container dimensions not ready, preserving existing positions',
          'MorphingBlobBackground.refinePositions',
          {
            component: 'MorphingBlobBackground',
            action: 'position-preservation',
            category: 'animation',
            width: rect.width,
            height: rect.height,
            currentPositionsCount: blobCount,
          }
        );
        // Explicitly preserve positions by not calling setBlobPositions
      }
    };

    // Try to refine positions after a short delay to ensure layout is complete
    // Use multiple attempts to handle cases where container isn't ready immediately
    let attemptCount = 0;
    const maxAttempts = 10;
    
    const tryRefine = () => {
      attemptCount++;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          refinePositions();
        } else if (attemptCount < maxAttempts) {
          // Try again after a short delay
          setTimeout(tryRefine, 50);
        }
      }
    };

    // Initial attempt after a short delay
    const initialTimeout = setTimeout(tryRefine, 100);

    // Set up ResizeObserver to refine positions when container size changes
    // Only observe if not reduced motion (for performance)
    let resizeObserver: ResizeObserver | null = null;
    if (!prefersReducedMotion && !disabled && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        // Throttle ResizeObserver callbacks to avoid excessive updates
        requestAnimationFrame(refinePositions);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(initialTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
    // Note: blobPositions is intentionally NOT in dependencies to avoid re-running when positions update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, blobCount, disabled]);

  // Set up mouse tracking and animations (only if not reduced motion and not disabled)
  useEffect(() => {
    if (!isMounted || disabled) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    logClientInfo(
      '[MorphingBlobBackground] Mouse tracking initialized',
      'MorphingBlobBackground.mouseTracking',
      {
        component: 'MorphingBlobBackground',
        action: 'mouse-tracking-init',
        category: 'animation',
      }
    );

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMounted, disabled, mouseX, mouseY]);

  if (!isMounted || disabled) {
    logClientInfo(
      '[MorphingBlobBackground] Not rendering',
      'MorphingBlobBackground.render',
      {
        component: 'MorphingBlobBackground',
        action: 'skip-render',
        category: 'animation',
        isMounted,
        disabled,
      }
    );
    return null;
  }
  
  // CRITICAL FIX: Always render SVG - never return placeholder
  // Positions are initialized with default values, so SVG always renders
  // Validate positions before rendering
  const validPositions = blobPositions.filter(
    (pos) => Number.isFinite(pos.x) && Number.isFinite(pos.y)
  );

  if (validPositions.length !== blobPositions.length) {
    logClientWarn(
      '[MorphingBlobBackground] Invalid positions detected, filtering',
      normalizeError(new Error('Invalid positions in blobPositions'), 'Position validation failed'),
      'MorphingBlobBackground.render',
      {
        component: 'MorphingBlobBackground',
        action: 'position-validation',
        category: 'animation',
        totalPositions: blobPositions.length,
        validPositions: validPositions.length,
        invalidPositions: blobPositions.length - validPositions.length,
      }
    );
  }

  logClientInfo(
    '[MorphingBlobBackground] Rendering SVG',
    'MorphingBlobBackground.render',
    {
      component: 'MorphingBlobBackground',
      action: 'render',
      category: 'animation',
      blobCount: validPositions.length,
      hasContainerRef: Boolean(containerRef.current),
      containerDimensions: containerRef.current
        ? {
            width: containerRef.current.getBoundingClientRect().width,
            height: containerRef.current.getBoundingClientRect().height,
          }
        : null,
    }
  );

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      aria-hidden="true"
      suppressHydrationWarning
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
      }}
    >
      <svg 
        className="h-full w-full" 
        style={{ 
          opacity: 1, 
          display: 'block',
          willChange: 'contents', // PERFORMANCE: Hint to browser for GPU acceleration
        }}
        suppressHydrationWarning
      >
        <defs>
          {/* Gradient definitions for each blob */}
          {colors.map((color, index) => (
            <radialGradient key={index} id={`blob-gradient-${index}`}>
              <stop offset="0%" stopColor={color} stopOpacity={0.7} />
              <stop offset="50%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0.2} />
            </radialGradient>
          ))}
        </defs>

        {/* Render blobs - only render valid positions */}
        {validPositions.map((pos, index) => (
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
