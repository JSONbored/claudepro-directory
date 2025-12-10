/**
 * Animated Border Component
 *
 * A simple, reliable CSS-based animated gradient border
 * Perfect for navigation dropdowns and cards
 * Uses CSS animations for better performance and reliability
 */

'use client';

import { cn } from '../../../ui/utils.ts';

interface AnimatedBorderProps {
  className?: string;
  /** Gradient colors - defaults to heyclaude orange */
  colorFrom?: string;
  colorTo?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Border width in pixels */
  borderWidth?: number;
  /** Whether to show the animated border */
  enabled?: boolean;
}

export function AnimatedBorder({
  className,
  colorFrom = '#F97316',
  colorTo = '#FB923C',
  duration = 3,
  borderWidth = 2,
  enabled = true,
}: AnimatedBorderProps) {
  if (!enabled) return null;

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 rounded-[inherit]', className)}
      style={{
        padding: `${borderWidth}px`,
        background: `linear-gradient(90deg, ${colorFrom}, ${colorTo}, ${colorFrom})`,
        backgroundSize: '200% 100%',
        animation: `animated-border-gradient ${duration}s linear infinite`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    >
      <div className="h-full w-full rounded-[inherit] bg-background" />
    </div>
  );
}
