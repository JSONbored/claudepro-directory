/**
 * HeyClaude Gradient Text Component
 *
 * Apple-inspired multicolor gradient text for brand identity.
 * Used in navigation and footer for consistent branding.
 *
 * @module components/layout/heyclaude-text
 */

'use client';

import { cn } from '@/src/lib/utils';

interface HeyClaudeTextProps {
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
   * Custom aria-label for accessibility
   */
  ariaLabel?: string;
}

/**
 * HeyClaudeText Component
 *
 * Displays "HeyClaude" with Apple-inspired multicolor gradient.
 * Gradient: Pink → Purple → Blue → Cyan → Teal
 *
 * @example
 * ```tsx
 * <HeyClaudeText size="lg" />
 * ```
 */
export function HeyClaudeText({
  size = 'md',
  className,
  ariaLabel = 'HeyClaude',
}: HeyClaudeTextProps) {
  const sizeClasses = {
    sm: 'text-base md:text-lg',
    md: 'text-lg md:text-xl',
    lg: 'text-xl md:text-2xl',
    xl: 'text-2xl md:text-3xl lg:text-4xl',
  };

  return (
    <span
      className={cn(
        'font-bold',
        'bg-gradient-to-r from-[#FF6B9D] via-[#C239B3] via-[#5B8DEF] via-[#0CA5E9] to-[#14B8A6]',
        'bg-clip-text text-transparent',
        'select-none',
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={ariaLabel}
    >
      HeyClaude
    </span>
  );
}
