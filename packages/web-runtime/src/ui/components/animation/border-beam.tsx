/**
 * Border Beam Component
 *
 * Animated beam of light that travels along the border of its container
 * Based on Magic UI / shadcn implementation
 * Fixed to ensure beam stays visible along entire border perimeter
 */

'use client';

import { useEffect, useRef } from 'react';
import { cn } from '../../../ui/utils.ts';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  delay = 0,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  borderWidth = 1.5,
}: BorderBeamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);

  useEffect(() => {
    const controls = animate(progress, 1, {
      duration: duration * 1000, // Convert seconds to milliseconds
      delay: delay * 1000,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'linear',
    });

    return () => controls.stop();
  }, [duration, delay, progress]);

  // Calculate x position along border perimeter
  // Path: top (left→right) → right (top→bottom) → bottom (right→left) → left (bottom→top)
  const x = useTransform(progress, (p) => {
    const container = containerRef.current;
    if (!container) return 0;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const perimeter = 2 * (width + height);
    const distance = (p * perimeter) % perimeter;

    if (distance < width) {
      // Top edge: left to right
      return distance - size / 2;
    } else if (distance < width + height) {
      // Right edge: stay at right
      return width - size / 2;
    } else if (distance < 2 * width + height) {
      // Bottom edge: right to left
      return width - (distance - width - height) - size / 2;
    } else {
      // Left edge: stay at left
      return -size / 2;
    }
  });

  // Calculate y position along border perimeter
  const y = useTransform(progress, (p) => {
    const container = containerRef.current;
    if (!container) return 0;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const perimeter = 2 * (width + height);
    const distance = (p * perimeter) % perimeter;

    if (distance < width) {
      // Top edge: stay at top
      return -size / 2;
    } else if (distance < width + height) {
      // Right edge: top to bottom
      return distance - width - size / 2;
    } else if (distance < 2 * width + height) {
      // Bottom edge: stay at bottom
      return height - size / 2;
    } else {
      // Left edge: bottom to top
      return height - (distance - 2 * width - height) - size / 2;
    }
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        className
      )}
    >
      <motion.div
        className="absolute"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: `linear-gradient(to right, ${colorFrom}, ${colorTo}, transparent)`,
          borderRadius: '999px',
          filter: 'blur(20px)',
          opacity: 0.8,
          x,
          y,
        }}
      />
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          padding: `${borderWidth}px`,
          background: 'transparent',
        }}
      >
        <div className="h-full w-full rounded-[inherit] bg-background" />
      </div>
    </div>
  );
}
