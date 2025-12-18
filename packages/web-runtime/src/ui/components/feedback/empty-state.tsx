'use client';

/**
 * Empty State Component
 *
 * Reusable component for displaying empty states across the application.
 * Follows existing patterns and uses Motion.dev for animations.
 *
 * Architecture:
 * - Client component (uses Motion.dev animations)
 * - Next.js-specific (uses Next.js Link component)
 * - Uses web-runtime UI constants and design tokens
 * - Accepts custom action rendering for flexibility
 *
 * Features:
 * - Animated entrance with spring physics
 * - Icon + title + description + optional CTA
 * - Multiple variants for different contexts
 * - Consistent with existing UI patterns
 * - Fully accessible
 *
 * Usage:
 * ```tsx
 * import { EmptyState } from '@heyclaude/web-runtime/ui';
 * import { Button } from '@/components/ui/button';
 * import Link from 'next/link';
 *
 * <EmptyState
 *   icon={Search}
 *   title="No results found"
 *   description="Try different keywords or submit your own!"
 *   renderAction={(href) => (
 *     <Button asChild>
 *       <Link href={href}>Submit Config</Link>
 *     </Button>
 *   )}
 *   actionHref="/submit"
 * />
 * ```
 */

import {
  AlertCircle,
  AlertTriangle,
} from '../../../icons.tsx';
import { cn } from '../../utils.ts';
// TOKENS removed - using direct Tailwind utilities
import { SPRING, STAGGER } from '../../../design-system/index.ts';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Icon component to display */
  icon: LucideIcon;
  /** Main heading */
  title: string;
  /** Supporting description text */
  description: string;
  /** Optional CTA button label (requires actionHref) */
  actionLabel?: string;
  /** Optional CTA button href */
  actionHref?: string;
  /** Optional secondary action label (requires secondaryActionHref) */
  secondaryActionLabel?: string;
  /** Optional secondary action href */
  secondaryActionHref?: string;
  /** Custom action renderer (overrides actionLabel/actionHref) */
  renderAction?: (href: string, label: string) => ReactNode;
  /** Custom secondary action renderer (overrides secondaryActionLabel/secondaryActionHref) */
  renderSecondaryAction?: (href: string, label: string) => ReactNode;
  /** Visual variant */
  variant?: 'default' | 'search' | 'error' | 'success';
  /** Custom className */
  className?: string;
  /** Disable animations */
  noAnimation?: boolean;
}

/**
 * Variant color configurations - using Tailwind utilities (NO inline styles)
 */
const variantConfig = {
  default: {
    iconBgClass: 'bg-color-accent-primary/10',
    iconColorClass: 'text-color-accent-primary',
  },
  search: {
    iconBgClass: 'bg-color-info-bg',
    iconColorClass: 'text-color-info',
  },
  error: {
    iconBgClass: 'bg-color-error-bg',
    iconColorClass: 'text-color-error',
  },
  success: {
    iconBgClass: 'bg-color-success-bg',
    iconColorClass: 'text-color-success',
  },
} as const;

/**
 * Generic Empty State Component
 *
 * Displays an empty state with icon, title, description, and optional actions.
 * Accepts custom action rendering for flexibility with different button components.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  renderAction,
  renderSecondaryAction,
  variant = 'default',
  className,
  noAnimation = false,
}: EmptyStateProps) {
  const colors = variantConfig[variant];

  const containerAnimation = noAnimation
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: SPRING.smooth,
      };

  const iconAnimation = noAnimation
    ? {}
    : {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { ...SPRING.bouncy, delay: STAGGER.medium },
      };

  const ctaAnimation = noAnimation
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { ...SPRING.smooth, delay: STAGGER.slow },
      };

  // Render action button
  const renderActionButton = () => {
    if (renderAction && actionHref && actionLabel) {
      return renderAction(actionHref, actionLabel);
    }
    if (actionLabel && actionHref) {
      // Default: simple Link (app can wrap with Button if needed)
      return (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {actionLabel}
        </Link>
      );
    }
    return null;
  };

  // Render secondary action button
  const renderSecondaryActionButton = () => {
    if (renderSecondaryAction && secondaryActionHref && secondaryActionLabel) {
      return renderSecondaryAction(secondaryActionHref, secondaryActionLabel);
    }
    if (secondaryActionLabel && secondaryActionHref) {
      // Default: simple Link with outline style
      return (
        <Link
          href={secondaryActionHref}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {secondaryActionLabel}
        </Link>
      );
    }
    return null;
  };

  return (
    <motion.div
      {...containerAnimation}
      className={cn('flex flex-col items-center justify-center px-4 py-16 text-center', className)}
    >
      {/* Animated Icon */}
      <motion.div
        {...iconAnimation}
        className={cn("mb-6 rounded-full p-6", colors.iconBgClass)}
      >
        <Icon className={cn('h-12 w-12', colors.iconColorClass)} aria-hidden="true" />
      </motion.div>

      {/* Title */}
      <h3 className="mb-2 font-semibold text-foreground text-xl">{title}</h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-muted-foreground leading-relaxed">{description}</p>

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel || renderAction || renderSecondaryAction) && (
        <motion.div
          {...ctaAnimation}
          className={cn('flex flex-col gap-3 sm:flex-row')}
        >
          {renderActionButton()}
          {renderSecondaryActionButton()}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Compact empty state for smaller spaces (sidebars, modals)
 */
export function CompactEmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-4 py-8 text-center', className)}
    >
      <div
        className="mb-3 rounded-full p-3 bg-color-accent-primary/10"
      >
        <Icon
          className="h-6 w-6 text-color-accent-primary"
          aria-hidden="true"
        />
      </div>
      <h4 className="mb-1 font-medium text-foreground text-sm">{title}</h4>
      <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * Generic error empty state
 */
export function ErrorEmpty({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  className,
  renderAction,
  renderSecondaryAction,
}: {
  title?: string;
  description?: string;
  className?: string;
  renderAction?: (href: string, label: string) => ReactNode;
  renderSecondaryAction?: (href: string, label: string) => ReactNode;
}) {
  const props: EmptyStateProps = {
    icon: AlertTriangle,
    title,
    description,
    actionLabel: 'Try Again',
    actionHref: '#',
    secondaryActionLabel: 'Contact Support',
    secondaryActionHref: '/contact',
    variant: 'error',
    ...(className ? { className } : {}),
    ...(renderAction ? { renderAction } : {}),
    ...(renderSecondaryAction ? { renderSecondaryAction } : {}),
  };
  return <EmptyState {...props} />;
}

/**
 * Generic not found empty state
 */
export function NotFoundEmpty({
  className,
  renderAction,
  renderSecondaryAction,
}: {
  className?: string;
  renderAction?: (href: string, label: string) => ReactNode;
  renderSecondaryAction?: (href: string, label: string) => ReactNode;
}) {
  const props: EmptyStateProps = {
    icon: AlertCircle,
    title: 'Page not found',
    description: "The page you're looking for doesn't exist or has been moved. Let's get you back on track!",
    actionLabel: 'Go to Homepage',
    actionHref: '/',
    secondaryActionLabel: 'Browse Configs',
    secondaryActionHref: '/agents',
    variant: 'error',
    ...(className ? { className } : {}),
    ...(renderAction ? { renderAction } : {}),
    ...(renderSecondaryAction ? { renderSecondaryAction } : {}),
  };
  return <EmptyState {...props} />;
}
