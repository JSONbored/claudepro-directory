'use client';

/**
 * Empty State Component
 *
 * Reusable component for displaying empty states across the application.
 * Follows existing patterns from loading-skeleton.tsx and uses Motion.dev for animations.
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
 * <EmptyState
 *   icon={Search}
 *   title="No results found"
 *   description="Try different keywords or submit your own!"
 *   actionLabel="Submit Config"
 *   actionHref="/submit"
 * />
 * ```
 */

import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/src/components/primitives/ui/button';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@/src/lib/design-tokens/submission-form';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

export interface EmptyStateProps {
  /** Icon component to display */
  icon: LucideIcon;
  /** Main heading */
  title: string;
  /** Supporting description text */
  description: string;
  /** Optional CTA button label */
  actionLabel?: string;
  /** Optional CTA button href */
  actionHref?: string;
  /** Optional secondary action label */
  secondaryActionLabel?: string;
  /** Optional secondary action href */
  secondaryActionHref?: string;
  /** Visual variant */
  variant?: 'default' | 'search' | 'error' | 'success';
  /** Custom className */
  className?: string;
  /** Disable animations */
  noAnimation?: boolean;
}

/**
 * Variant color configurations
 */
const variantConfig = {
  default: {
    iconBg: `${TOKENS.colors.accent.primary}10`,
    iconColor: TOKENS.colors.accent.primary,
  },
  search: {
    iconBg: `${TOKENS.colors.info.bg}`,
    iconColor: TOKENS.colors.info.text,
  },
  error: {
    iconBg: `${TOKENS.colors.error.bg}`,
    iconColor: TOKENS.colors.error.text,
  },
  success: {
    iconBg: `${TOKENS.colors.success.bg}`,
    iconColor: TOKENS.colors.success.text,
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
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
        transition: TOKENS.animations.spring.smooth,
      };

  const iconAnimation = noAnimation
    ? {}
    : {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { ...TOKENS.animations.spring.bouncy, delay: 0.15 },
      };

  const ctaAnimation = noAnimation
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { ...TOKENS.animations.spring.smooth, delay: 0.3 },
      };

  return (
    <motion.div
      {...containerAnimation}
      className={cn('flex flex-col items-center justify-center px-4 py-16 text-center', className)}
    >
      {/* Animated Icon */}
      <motion.div
        {...iconAnimation}
        className="mb-6 rounded-full p-6"
        style={{
          backgroundColor: colors.iconBg,
        }}
      >
        <Icon className="h-12 w-12" style={{ color: colors.iconColor }} aria-hidden="true" />
      </motion.div>

      {/* Title */}
      <h3 className="mb-2 font-semibold text-foreground text-xl">{title}</h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-muted-foreground leading-relaxed">{description}</p>

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          {...ctaAnimation}
          className={cn(UI_CLASSES.SPACE_DEFAULT, 'flex flex-col sm:flex-row')}
        >
          {actionLabel && actionHref && (
            <Button asChild={true} size="lg">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          )}
          {secondaryActionLabel && secondaryActionHref && (
            <Button asChild={true} size="lg" variant="outline">
              <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Pre-configured empty state variants for common use cases
 */

export function EmptySearchResults({
  searchQuery,
  category,
  className,
}: {
  searchQuery: string;
  category?: string;
  className?: string;
}) {
  const { Search } = require('@/src/lib/icons');

  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        category
          ? `No ${category} matching "${searchQuery}". Try different keywords or submit your own!`
          : `No results found for "${searchQuery}". Try different keywords or browse all content.`
      }
      actionLabel="Submit New Config"
      actionHref="/submit/wizard"
      secondaryActionLabel="Browse All"
      secondaryActionHref="/"
      variant="search"
      {...(className ? { className } : {})}
    />
  );
}

export function EmptyBookmarks({ className }: { className?: string }) {
  const { Bookmark } = require('@/src/lib/icons');

  return (
    <EmptyState
      icon={Bookmark}
      title="No bookmarks yet"
      description="Start bookmarking your favorite configs to build your personal collection. Bookmarks sync across devices and help you quickly find content you love."
      actionLabel="Browse Configs"
      actionHref="/agents"
      variant="default"
      {...(className ? { className } : {})}
    />
  );
}

export function EmptySubmissions({ className }: { className?: string }) {
  const { FileText } = require('@/src/lib/icons');

  return (
    <EmptyState
      icon={FileText}
      title="No submissions yet"
      description="You haven't submitted any configs yet. Share your Claude agents, MCP servers, and more with the community!"
      actionLabel="Submit Your First Config"
      actionHref="/submit/wizard"
      variant="default"
      {...(className ? { className } : {})}
    />
  );
}

export function EmptyCollections({ className }: { className?: string }) {
  const { Layers } = require('@/src/lib/icons');

  return (
    <EmptyState
      icon={Layers}
      title="No collections yet"
      description="Collections help you organize and share groups of related configs. Create your first collection to get started."
      actionLabel="Create Collection"
      actionHref="/collections/new"
      variant="default"
      {...(className ? { className } : {})}
    />
  );
}

export function EmptyCategory({ category, className }: { category: string; className?: string }) {
  const { Sparkles } = require('@/src/lib/icons');

  return (
    <EmptyState
      icon={Sparkles}
      title={`No ${category} yet`}
      description={`Be the first to submit a ${category.slice(0, -1)} to the directory! Your contribution will help the community discover new Claude configurations.`}
      actionLabel={`Submit ${category.slice(0, -1)}`}
      actionHref="/submit/wizard"
      variant="default"
      {...(className ? { className } : {})}
    />
  );
}

export function NotFoundEmpty({ className }: { className?: string }) {
  const { AlertCircle } = require('@/src/lib/icons');

  return (
    <EmptyState
      icon={AlertCircle}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved. Let's get you back on track!"
      actionLabel="Go to Homepage"
      actionHref="/"
      secondaryActionLabel="Browse Configs"
      secondaryActionHref="/agents"
      variant="error"
      {...(className ? { className } : {})}
    />
  );
}

export function ErrorEmpty({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  const { AlertTriangle } = require('@/src/lib/icons');

  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={description}
      actionLabel="Try Again"
      actionHref="#"
      secondaryActionLabel="Contact Support"
      secondaryActionHref="/contact"
      variant="error"
      {...(className ? { className } : {})}
    />
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
        className="mb-3 rounded-full p-3"
        style={{
          backgroundColor: `${TOKENS.colors.accent.primary}10`,
        }}
      >
        <Icon
          className="h-6 w-6"
          style={{ color: TOKENS.colors.accent.primary }}
          aria-hidden="true"
        />
      </div>
      <h4 className="mb-1 font-medium text-foreground text-sm">{title}</h4>
      <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
    </div>
  );
}
