'use client';

/**
 * Status Component
 * 
 * A status indicator badge component with animated ping effect.
 * Perfect for showing system status, service availability, or connection state.
 * 
 * @example
 * ```tsx
 * <Status status="online">
 *   <StatusIndicator />
 *   <StatusLabel>System Online</StatusLabel>
 * </Status>
 * ```
 * 
 * **When to use:**
 * - System status pages: Show service availability
 * - API status indicators: Connection state
 * - Health check displays: Service health
 * - Status dashboards: Real-time status updates
 * 
 * **Key features:**
 * - Animated ping effect
 * - Color-coded status (online/offline/maintenance/degraded)
 * - Badge integration
 * - Accessible status labels
 */

import type { ComponentProps, HTMLAttributes } from 'react';
import { Badge, cn } from '@heyclaude/web-runtime/ui';

export type StatusProps = ComponentProps<typeof Badge> & {
  status: 'online' | 'offline' | 'maintenance' | 'degraded';
};

export const Status = ({ className, status, ...props }: StatusProps) => (
  <Badge
    className={cn('flex items-center gap-2', 'group', status, className)}
    variant="secondary"
    {...(props as any)}
  />
);

export type StatusIndicatorProps = HTMLAttributes<HTMLSpanElement>;

export const StatusIndicator = ({
  className,
  ...props
}: StatusIndicatorProps) => (
  <span className={cn('relative flex h-2 w-2', className)} {...(props as any)}>
    <span
      className={cn(
        'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
        'group-[.online]:bg-emerald-500',
        'group-[.offline]:bg-red-500',
        'group-[.maintenance]:bg-blue-500',
        'group-[.degraded]:bg-amber-500'
      )}
    />
    <span
      className={cn(
        'relative inline-flex h-2 w-2 rounded-full',
        'group-[.online]:bg-emerald-500',
        'group-[.offline]:bg-red-500',
        'group-[.maintenance]:bg-blue-500',
        'group-[.degraded]:bg-amber-500'
      )}
    />
  </span>
);

export type StatusLabelProps = HTMLAttributes<HTMLSpanElement>;

export const StatusLabel = ({
  className,
  children,
  ...props
}: StatusLabelProps) => (
  <span className={cn('text-muted-foreground', className)} {...(props as any)}>
    {children ?? (
      <>
        <span className="hidden group-[.online]:block">Online</span>
        <span className="hidden group-[.offline]:block">Offline</span>
        <span className="hidden group-[.maintenance]:block">Maintenance</span>
        <span className="hidden group-[.degraded]:block">Degraded</span>
      </>
    )}
  </span>
);

