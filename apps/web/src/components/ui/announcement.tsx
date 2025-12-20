'use client';

/**
 * Announcement Component
 *
 * A badge-style announcement component for highlighting important information, updates, or features.
 * Perfect for feature announcements, status updates, and promotional content.
 *
 * @example
 * ```tsx
 * <Announcement themed>
 *   <AnnouncementTag>New</AnnouncementTag>
 *   <AnnouncementTitle>Check out our latest feature!</AnnouncementTitle>
 * </Announcement>
 * ```
 *
 * **When to use:**
 * - Feature announcements: New features or updates
 * - Status updates: Important information
 * - Promotional content: Special offers or highlights
 * - Notification badges: Alert-style messages
 *
 * **Key features:**
 * - Badge-based design
 * - Optional themed styling
 * - Tag support for labels
 * - Title/content support
 * - Hover effects
 */

import type { ComponentProps, HTMLAttributes } from 'react';
import { Badge, cn } from '@heyclaude/web-runtime/ui';

export type AnnouncementProps = ComponentProps<typeof Badge> & {
  themed?: boolean;
};

export const Announcement = ({
  variant = 'outline',
  themed = false,
  className,
  ...props
}: AnnouncementProps) => (
  <Badge
    className={cn(
      'group bg-background max-w-full gap-2 rounded-full px-4 py-0.5 font-medium shadow-sm transition-all',
      'hover:shadow-md',
      themed && 'announcement-themed border-foreground/5',
      className
    )}
    variant={variant}
    {...(props as any)}
  />
);

export type AnnouncementTagProps = HTMLAttributes<HTMLDivElement>;

export const AnnouncementTag = ({ className, ...props }: AnnouncementTagProps) => (
  <div
    className={cn(
      'bg-foreground/5 -ml-2.5 shrink-0 truncate rounded-full px-2.5 py-1 text-xs',
      'group-[.announcement-themed]:bg-background/60',
      className
    )}
    {...(props as any)}
  />
);

export type AnnouncementTitleProps = HTMLAttributes<HTMLDivElement>;

export const AnnouncementTitle = ({ className, ...props }: AnnouncementTitleProps) => (
  <div className={cn('flex items-center gap-1 truncate py-1', className)} {...(props as any)} />
);
