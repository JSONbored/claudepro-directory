import type * as React from 'react';

import { baseBadgeVariants } from '@/src/components/core/domain/unified-badge';
import { ANIMATION_CONSTANTS } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

/**
 * Announcement Component System
 *
 * Compound components for creating attention-grabbing announcements.
 * Built on top of Badge component with additional features for site-wide notifications.
 *
 * @example
 * ```tsx
 * <Announcement variant="outline" themed>
 *   <AnnouncementTag>New</AnnouncementTag>
 *   <AnnouncementTitle>
 *     Introducing Statuslines - Customize your editor
 *     <ArrowUpRight className="ml-1 h-3 w-3" />
 *   </AnnouncementTitle>
 * </Announcement>
 * ```
 *
 * Features:
 * - Compound component architecture
 * - Variant support (default, outline, secondary, destructive)
 * - Themed styling with hover effects
 * - Responsive design
 * - Accessibility support
 *
 * @see Research Report: "shadcn Announcement Component Integration"
 */

export interface AnnouncementProps extends React.OutputHTMLAttributes<HTMLOutputElement> {
  /**
   * Badge variant for styling
   * @default "outline"
   */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';

  /**
   * Enable themed styling with additional visual effects
   * @default false
   */
  themed?: boolean;
}

/**
 * Announcement - Main container component
 *
 * Wraps announcement content with badge styling and optional themed effects.
 */
export function Announcement({
  className,
  variant = 'outline',
  themed = false,
  ...props
}: AnnouncementProps) {
  return (
    <output
      className={cn(
        baseBadgeVariants({ variant }),
        // Announcement-specific styles
        'inline-flex items-center gap-2',
        'px-3 py-1.5',
        'text-sm',
        ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT,
        // Themed enhancements
        themed && ['shadow-sm hover:shadow-md', 'hover:scale-[1.02]', 'active:scale-[0.98]'],
        className
      )}
      {...props}
    />
  );
}

export interface AnnouncementTagProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * AnnouncementTag - Small category/label badge
 *
 * Displays a small badge/tag for categorizing announcements (e.g., "New", "Beta", "Update")
 */
export function AnnouncementTag({ className, ...props }: AnnouncementTagProps) {
  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'px-1.5 py-0.5',
        'font-semibold text-[10px] uppercase tracking-wider',
        'rounded',
        'bg-accent text-accent-foreground',
        'flex-shrink-0',
        className
      )}
      {...props}
    />
  );
}

export interface AnnouncementTitleProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * AnnouncementTitle - Main announcement content
 *
 * Displays the primary announcement text with proper typography and layout.
 */
export function AnnouncementTitle({ className, ...props }: AnnouncementTitleProps) {
  return (
    <span
      className={cn(
        // Typography
        'font-medium text-sm',
        // Layout
        'inline-flex items-center gap-1',
        // Responsive
        'truncate',
        className
      )}
      {...props}
    />
  );
}
