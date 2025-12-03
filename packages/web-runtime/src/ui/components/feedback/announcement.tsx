import type { Database } from '@heyclaude/database-types';
import { baseBadgeVariants } from '../badges/unified-badge.tsx';
import { transition } from '../../../design-system/styles/interactive.ts';
import { gap, display, alignItems, justify, padding, flexGrow } from '../../../design-system/styles/layout.ts';
import { size, weight, tracking, truncate, transform } from '../../../design-system/styles/typography.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { shadow } from '../../../design-system/styles/effects.ts';
import { bgColor, textColor } from '../../../design-system/styles/colors.ts';
import { cn } from '../../utils.ts';
import type * as React from 'react';

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
  variant?: Database['public']['Enums']['announcement_variant'];

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
        `${display.inlineFlex} ${alignItems.center} ${gap.compact}`,
        `${padding.xCompact} ${padding.ySnug}`,
        size.sm,
        transition.default,
        // Themed enhancements
        themed && [`${shadow.sm} hover:${shadow.md}`, 'hover:scale-[1.02]', 'active:scale-[0.98]'],
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
        `${display.inlineFlex} ${alignItems.center} ${justify.center}`,
        `${padding.xSnug} ${padding.yHair}`,
        `${weight.semibold} ${size['2xs']} ${transform.uppercase} ${tracking.wider}`,
        radius.default,
        `${bgColor.accent} ${textColor.accentForeground}`,
        flexGrow.shrink0,
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
        `${weight.medium} ${size.sm}`,
        // Layout
        `${display.inlineFlex} ${alignItems.center} ${gap.tight}`,
        // Responsive
        truncate.single,
        className
      )}
      {...props}
    />
  );
}
