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
import { RESPONSIVE_PATTERNS } from '@/src/lib/ui-constants';
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
    sm: RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_MD,
    md: RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_LG,
    lg: RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_XL,
    xl: RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_2XL,
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
