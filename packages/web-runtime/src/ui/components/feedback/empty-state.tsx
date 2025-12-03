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
 * - Uses unified design system tokens
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
// Design System imports - unified tokens and composable styles
import { colors, animation } from '../../../design-system/tokens.ts';
import { center, stack, responsive, padding, marginBottom, maxWidth, display, flexDir, alignItems, justify } from '../../../design-system/styles/layout.ts';
import { iconSize } from '../../../design-system/styles/icons.ts';
import { hoverBg, transition } from '../../../design-system/styles/interactive.ts';
import { size, weight, muted, leading } from '../../../design-system/styles/typography.ts';
import { bgColor, textColor, borderColor, textAlign } from '../../../design-system/styles/colors.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import type { IconComponent } from '../../../icons.tsx';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Icon component to display */
  icon: IconComponent;
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
 * Variant color configurations using unified design tokens
 */
const variantConfig = {
  default: {
    iconBg: `${colors.brand.orange}10`,
    iconColor: colors.brand.orange,
  },
  search: {
    iconBg: colors.semantic.info.dark.bg,
    iconColor: colors.semantic.info.dark.text,
  },
  error: {
    iconBg: colors.semantic.error.dark.bg,
    iconColor: colors.semantic.error.dark.text,
  },
  success: {
    iconBg: colors.semantic.success.dark.bg,
    iconColor: colors.semantic.success.dark.text,
  },
};

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
  const variantColors = variantConfig[variant];

  // Animation configurations using unified design tokens
  const containerAnimation = noAnimation
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: animation.spring.smooth,
      };

  const iconAnimation = noAnimation
    ? {}
    : {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { ...animation.spring.bouncy, delay: 0.15 },
      };

  const ctaAnimation = noAnimation
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { ...animation.spring.smooth, delay: 0.3 },
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
          className={`${display.inlineFlex} ${alignItems.center} ${justify.center} ${radius.md} ${bgColor.accent} ${padding.xRelaxed} ${padding.yCompact} ${size.sm} ${weight.medium} ${textColor.accentForeground} ${transition.colors} ${hoverBg.max} focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
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
          className={`${display.inlineFlex} ${alignItems.center} ${justify.center} ${radius.md} border ${borderColor.input} ${bgColor.background} ${padding.xRelaxed} ${padding.yCompact} ${size.sm} ${weight.medium} ${transition.colors} ${hoverBg.accentSolid} hover:${textColor.accentForeground} focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
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
      className={cn(`${display.flex} ${flexDir.col} ${alignItems.center} ${justify.center} ${padding.xComfortable} ${padding.yHero} ${textAlign.center}`, className)}
    >
      {/* Animated Icon */}
      <motion.div
        {...iconAnimation}
        className={`${marginBottom.relaxed} ${radius.full} ${padding.comfortable}`}
        style={{
          backgroundColor: variantColors.iconBg,
        }}
      >
        <Icon className={iconSize['3xl']} style={{ color: variantColors.iconColor }} aria-hidden="true" />
      </motion.div>

      {/* Title */}
      <h3 className={`${marginBottom.compact} ${weight.semibold} ${textColor.foreground} ${size.xl}`}>{title}</h3>

      {/* Description */}
      <p className={`${marginBottom.relaxed} ${maxWidth.md} ${muted.default} ${leading.relaxed}`}>{description}</p>

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel || renderAction || renderSecondaryAction) && (
        <motion.div
          {...ctaAnimation}
          className={cn(stack.default, responsive.smRowGap)}
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
  icon: IconComponent;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(center.column, `${padding.xComfortable} ${padding.yLoose} ${textAlign.center}`, className)}
    >
      <div
        className={`${marginBottom.compact} ${radius.full} ${padding.compact}`}
        style={{
          backgroundColor: `${colors.brand.orange}10`,
        }}
      >
        <Icon
          className={iconSize.lg}
          style={{ color: colors.brand.orange }}
          aria-hidden="true"
        />
      </div>
      <h4 className={`${marginBottom.tight} ${weight.medium} ${textColor.foreground} ${size.sm}`}>{title}</h4>
      <p className={`${muted.default} ${size.xs} ${leading.relaxed}`}>{description}</p>
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
