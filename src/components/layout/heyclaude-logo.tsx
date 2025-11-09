/**
 * HeyClaude Logo Component
 *
 * Modern highlighted text logo with expanding background effect.
 * Uses shadcn highlight-text component for smooth animations.
 *
 * @module components/layout/heyclaude-logo
 */

'use client';

import { HighlightText } from '@/src/components/ui/shadcn-io/highlight-text';
import { cn } from '@/src/lib/utils';

interface HeyClaudeLogoProps {
  /**
   * Size variant for different contexts
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to trigger animation only when in view
   * @default false
   */
  inView?: boolean;

  /**
   * Animation duration in seconds
   * @default 1.5
   */
  duration?: number;
}

/**
 * HeyClaude Logo Component
 *
 * Displays "heyclaude" with a smooth expanding highlight effect.
 * Perfect for navigation headers and footer branding.
 *
 * @example
 * ```tsx
 * <HeyClaudeLogo size="lg" />
 * ```
 */
export function HeyClaudeLogo({
  size = 'md',
  className,
  inView = false,
  duration = 1.5,
}: HeyClaudeLogoProps) {
  const sizeClasses = {
    sm: 'text-base md:text-lg',
    md: 'text-lg md:text-xl lg:text-2xl',
    lg: 'text-xl md:text-2xl lg:text-3xl',
    xl: 'text-2xl md:text-3xl lg:text-4xl',
  };

  return (
    <HighlightText
      text="heyclaude"
      inView={inView}
      transition={{ duration, ease: 'easeOut' }}
      className={cn(
        'font-bold tracking-tight',
        // Force solid orange color - uses ! prefix to override HighlightText defaults
        '!bg-accent',
        sizeClasses[size],
        className
      )}
    />
  );
}
