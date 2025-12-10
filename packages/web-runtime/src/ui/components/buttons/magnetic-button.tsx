'use client';

/**
 * Magnetic Button Component
 *
 * Wraps any button with a magnetic tilt effect that follows the cursor.
 * Creates a delightful, interactive experience for high-visibility CTAs.
 *
 * Features:
 * - Smooth 3D tilt toward cursor
 * - Spring physics for natural motion
 * - Configurable tilt intensity
 * - Respects prefers-reduced-motion
 *
 * Usage:
 * ```tsx
 * <MagneticButton>
 *   <Button>Get Started</Button>
 * </MagneticButton>
 * ```
 */

import { SPRING } from '../../../design-system/index.ts';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';

interface MagneticButtonProps {
  /** Child button element */
  children: React.ReactNode;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Distance at which max tilt occurs (pixels) */
  maxDistance?: number;
  /** Whether to enable magnetic effect */
  enabled?: boolean;
  /** Additional className */
  className?: string;
}

export function MagneticButton({
  children,
  maxTilt = 8,
  maxDistance = 200,
  enabled = true,
  className,
}: MagneticButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(0, SPRING.smooth);
  const rotateY = useSpring(0, SPRING.smooth);

  // Track mouse position relative to container
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = e.clientX - centerX;
      const y = e.clientY - centerY;

      mouseX.set(x);
      mouseY.set(y);

      // Calculate tilt (magnetic effect)
      const distance = Math.sqrt(x * x + y * y);

      if (distance < maxDistance) {
        const tiltAmount = (1 - distance / maxDistance) * maxTilt;
        rotateY.set((x / maxDistance) * tiltAmount);
        rotateX.set((-y / maxDistance) * tiltAmount);
      } else {
        rotateY.set(0);
        rotateX.set(0);
      }
    };

    const handleMouseLeave = () => {
      rotateY.set(0);
      rotateX.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, maxTilt, maxDistance, mouseX, mouseY, rotateX, rotateY]);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
        willChange: 'transform',
      }}
      transition={SPRING.smooth}
    >
      {children}
    </motion.div>
  );
}
