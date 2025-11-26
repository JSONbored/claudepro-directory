'use client';

/**
 * Unified Badge Component
 *
 * Single component that handles all badge variants with full type safety.
 * Supports categories, sources, status, tags, sponsored content, and more.
 *
 * Architecture:
 * - Client component (uses Motion.dev animations, hooks)
 * - Uses web-runtime UI constants and design tokens
 * - Structured logging for errors
 * - Type-safe discriminated union for all variants
 * - Optional Tooltip support for new-indicator variant (app provides Tooltip components)
 *
 * Features:
 * - Multiple badge variants (base, category, source, status, sponsored, tag, new-indicator, new-badge, notification-count)
 * - Animated hover effects with configurable spring physics
 * - Full TypeScript type safety
 * - Accessible (ARIA labels, semantic HTML)
 *
 * Usage:
 * ```tsx
 * import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
 *
 * // Base badge
 * <UnifiedBadge variant="base" style="default">Label</UnifiedBadge>
 *
 * // Category badge
 * <UnifiedBadge variant="category" category="mcp">MCP</UnifiedBadge>
 *
 * // New indicator with tooltip (app provides Tooltip components)
 * <UnifiedBadge
 *   variant="new-indicator"
 *   label="New feature"
 *   TooltipProvider={TooltipProvider}
 *   Tooltip={Tooltip}
 *   TooltipTrigger={TooltipTrigger}
 *   TooltipContent={TooltipContent}
 * />
 * ```
 */

import type { Database } from '@heyclaude/database-types';
import { logger } from '../../../logger.ts';
import { getAnimationConfig } from '../../../actions/feature-flags.ts';
import { Star, TrendingUp, Zap } from '../../../icons.tsx';
import { ANIMATION_CONSTANTS, UI_CLASSES } from '../../constants.ts';
import { cn } from '../../utils.ts';
import { SEMANTIC_COLORS } from '../../colors.ts';
import { cva } from 'class-variance-authority';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useEffect, useState } from 'react';

/**
 * Base badge variants (from original badge.tsx)
 */
const baseBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent text-accent-foreground hover:bg-accent/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Category badge styles - only for categories that have badge styles defined
// Note: 'changelog' and 'jobs' are ContentCategory but don't have badge styles
const categoryBadgeStyles = {
  rules: 'badge-category-rules',
  mcp: 'badge-category-mcp',
  agents: 'badge-category-agents',
  commands: 'badge-category-commands',
  hooks: 'badge-category-hooks',
  statuslines: 'badge-category-statuslines',
  collections: 'badge-category-collections',
  guides: 'badge-category-guides',
  skills: 'badge-category-skills',
} as const satisfies Partial<Record<Database['public']['Enums']['content_category'], string>>;

const sourceBadgeStyles = {
  official: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  partner: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  community: 'bg-green-500/10 text-green-400 border-green-500/20',
  verified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  experimental: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
} as const;

const statusBadgeStyles = {
  active: 'bg-accent text-accent-foreground shadow-lg shadow-primary/25',
  trending: 'bg-primary/10 text-primary border-primary/20',
  new: 'bg-green-500/10 text-green-400 border-green-500/20',
  updated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  deprecated: 'bg-red-500/10 text-red-400 border-red-500/20',
} as const;

/**
 * Sponsored badge styles (from sponsored-badge.tsx)
 */
const sponsoredBadgeStyles = {
  featured: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  promoted: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  spotlight: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  sponsored: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
} as const;

/**
 * Tooltip component types for new-indicator variant
 * App provides these components to enable tooltip functionality
 */
export interface TooltipComponents {
  Provider: React.ComponentType<{ delayDuration?: number; children: React.ReactNode }>;
  Root: React.ComponentType<{ children: React.ReactNode }>;
  Trigger: React.ComponentType<{ asChild?: boolean; children: React.ReactNode }>;
  Content: React.ComponentType<{ side?: 'top' | 'right' | 'bottom' | 'left'; className?: string; children: React.ReactNode }>;
}

/**
 * Discriminated Union: All Badge Variants
 *
 * TypeScript enforces that only valid prop combinations can be used.
 * Each variant has its own required and optional props.
 */
export type UnifiedBadgeProps =
  | {
      /** Base badge variant (shadcn/ui style) */
      variant: 'base';
      style?: 'default' | 'secondary' | 'destructive' | 'outline';
      children: React.ReactNode;
      className?: string;
    }
  | {
      /** Category/content-type badge */
      variant: 'category';
      category: Database['public']['Enums']['content_category'];
      children: React.ReactNode;
      className?: string;
    }
  | {
      /** Source badge (official, partner, community, etc.) */
      variant: 'source';
      source: 'official' | 'partner' | 'community' | 'verified' | 'experimental' | 'other';
      children: React.ReactNode;
      className?: string;
    }
  | {
      /** Status badge (new, trending, active, etc.) */
      variant: 'status';
      status: 'active' | 'trending' | 'new' | 'updated' | 'deprecated';
      children: React.ReactNode;
      className?: string;
    }
  | {
      /** Sponsored/promoted content badge */
      variant: 'sponsored';
      tier: Database['public']['Enums']['sponsorship_tier'];
      showIcon?: boolean;
      className?: string;
    }
  | {
      /** Tag badge (interactive, can be active/inactive) */
      variant: 'tag';
      tag: string;
      isActive?: boolean;
      onClick?: () => void;
      onRemove?: () => void;
      className?: string;
      children?: React.ReactNode; // Optional children for highlighted content
    }
  | {
      /** New indicator (animated dot with optional tooltip) */
      variant: 'new-indicator';
      label?: string;
      side?: 'top' | 'right' | 'bottom' | 'left';
      delayDuration?: number;
      className?: string;
      /** Optional Tooltip components from app (enables tooltip functionality) */
      TooltipProvider?: TooltipComponents['Provider'];
      Tooltip?: TooltipComponents['Root'];
      TooltipTrigger?: TooltipComponents['Trigger'];
      TooltipContent?: TooltipComponents['Content'];
    }
  | {
      /** New badge (text-based "NEW" badge) */
      variant: 'new-badge';
      badgeVariant?: 'default' | 'outline';
      children?: React.ReactNode;
      className?: string;
    }
  | {
      /** Counter badge overlay (social proof for action buttons) */
      variant: 'notification-count';
      count: number;
      type: 'view' | 'copy' | 'bookmark';
      className?: string;
    };

/**
 * BadgeWrapper - Wrap badges with hover animation
 * Extracted to module scope to avoid nested component definition
 */
const BadgeWrapper = ({
  children,
  springDefault,
}: {
  children: React.ReactNode;
  springDefault: { type: 'spring'; stiffness: number; damping: number };
}) => (
  <motion.div
    className="inline-block"
    whileHover={{
      y: -2,
      transition: springDefault,
    }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.div>
);

export function UnifiedBadge(props: UnifiedBadgeProps) {
  const [springDefault, setSpringDefault] = useState({
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  });

  useEffect(() => {
    getAnimationConfig({})
      .then((result) => {
        if (!result?.data) return;
        const config = result.data as {
          'animation.spring.default.stiffness': number;
          'animation.spring.default.damping': number;
        };
        setSpringDefault({
          type: 'spring' as const,
          stiffness: config['animation.spring.default.stiffness'],
          damping: config['animation.spring.default.damping'],
        });
      })
      .catch((error: unknown) => {
        const normalized = error instanceof Error ? error : new Error(String(error));
        logger.error('UnifiedBadge: failed to load animation config', normalized);
      });
  }, []);

  // Base badge variant
  if (props.variant === 'base') {
    return (
      <BadgeWrapper springDefault={springDefault}>
        <div
          className={cn(
            baseBadgeVariants({ variant: props.style }),
            'hover:shadow-md hover:shadow-primary/20',
            props.className
          )}
        >
          {props.children}
        </div>
      </BadgeWrapper>
    );
  }

  // Category badge variant
  if (props.variant === 'category') {
    return (
      <BadgeWrapper springDefault={springDefault}>
        <div
          className={cn(
            `border font-medium text-xs ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:shadow-md hover:shadow-primary/20`,
            categoryBadgeStyles[props.category as keyof typeof categoryBadgeStyles] ??
              'badge-category-rules',
            props.className
          )}
        >
          {props.children}
        </div>
      </BadgeWrapper>
    );
  }

  // Source badge variant
  if (props.variant === 'source') {
    return (
      <BadgeWrapper springDefault={springDefault}>
        <div
          className={cn(
            `border font-medium text-xs ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:shadow-md hover:shadow-primary/20`,
            sourceBadgeStyles[props.source],
            props.className
          )}
        >
          {props.children}
        </div>
      </BadgeWrapper>
    );
  }

  // Status badge variant
  if (props.variant === 'status') {
    return (
      <BadgeWrapper springDefault={springDefault}>
        <div
          className={cn(
            `border font-medium text-xs ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:shadow-md hover:shadow-primary/20`,
            statusBadgeStyles[props.status],
            props.className
          )}
        >
          {props.children}
        </div>
      </BadgeWrapper>
    );
  }

  // Sponsored badge variant
  if (props.variant === 'sponsored') {
    const getIcon = () => {
      if (!props.showIcon) return null;

      switch (props.tier) {
        case 'featured':
          return <Star className="mr-1 h-3 w-3 fill-current" aria-hidden="true" />;
        case 'promoted':
          return <TrendingUp className={UI_CLASSES.ICON_XS_LEADING} aria-hidden="true" />;
        case 'spotlight':
          return <Zap className={UI_CLASSES.ICON_XS_LEADING} aria-hidden="true" />;
        default:
          return null;
      }
    };

    const getLabel = () => {
      switch (props.tier) {
        case 'featured':
          return 'Featured';
        case 'promoted':
          return 'Promoted';
        case 'spotlight':
          return 'Spotlight';
        default:
          return 'Sponsored';
      }
    };

    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors',
          sponsoredBadgeStyles[props.tier],
          props.className
        )}
      >
        {getIcon()}
        {getLabel()}
      </div>
    );
  }

  // Tag badge variant
  if (props.variant === 'tag') {
    const handleClick = props.onClick ? () => props.onClick?.() : undefined;

    if (props.isActive) {
      return (
        <button
          type="button"
          className={cn(
            `inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`,
            'cursor-pointer bg-accent text-accent-foreground shadow-lg shadow-primary/25',
            props.className
          )}
          onClick={handleClick}
        >
          {props.children || props.tag}
          {props.onRemove && (
            <button
              type="button"
              className="ml-1 hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                props.onRemove?.();
              }}
              aria-label={`Remove ${props.tag}`}
            >
              ×
            </button>
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-all duration-200',
          'cursor-pointer border-muted-foreground/20 text-muted-foreground hover:border-accent/30 hover:bg-accent/10 hover:text-accent',
          props.className
        )}
        onClick={handleClick}
      >
        {props.children || props.tag}
        {props.onRemove && (
          <button
            type="button"
            className="ml-1 hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              props.onRemove?.();
            }}
            aria-label={`Remove ${props.tag}`}
          >
            ×
          </button>
        )}
      </button>
    );
  }

  // New indicator variant (animated dot with optional tooltip)
  if (props.variant === 'new-indicator') {
    const label = props.label || 'New feature';
    const side = props.side || 'bottom';
    const delayDuration = props.delayDuration || 300;

    // Indicator dot component
    const IndicatorDot = (
      <output className={cn('relative flex h-2 w-2', props.className)} aria-label={label}>
        <span className="sr-only">{label}</span>
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full bg-accent"
          aria-hidden="true"
        />
      </output>
    );

    // If Tooltip components are provided, wrap with tooltip
    if (
      props.TooltipProvider &&
      props.Tooltip &&
      props.TooltipTrigger &&
      props.TooltipContent
    ) {
      const { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } = props;
      return (
        <TooltipProvider delayDuration={delayDuration}>
          <Tooltip>
            <TooltipTrigger asChild={true}>{IndicatorDot}</TooltipTrigger>
            <TooltipContent side={side} className="font-medium text-xs">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Otherwise, render without tooltip
    return IndicatorDot;
  }

  // New badge variant (text-based "NEW")
  if (props.variant === 'new-badge') {
    const badgeVariant = props.badgeVariant || 'default';
    const children = props.children || 'NEW';

    const variantStyles = {
      default: 'bg-green-500/10 text-green-400 border-green-500/20',
      outline: 'bg-accent/10 text-accent border-accent/20',
    };

    return (
      <output
        className={cn(
          'inline-flex items-center justify-center',
          'px-2.5 py-0.5',
          'font-semibold text-[10px] uppercase tracking-wider',
          'rounded-full border',
          ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT,
          variantStyles[badgeVariant],
          props.className
        )}
        aria-label="New"
      >
        {children}
      </output>
    );
  }

  // Counter badge overlay variant (social proof)
  if (props.variant === 'notification-count') {
    const { count, type } = props;

    // Don't render if count is 0 or negative
    if (count <= 0) return null;

    // Format count for social proof: exact up to 1k, then compact notation (1k, 1.1k, etc.)
    const displayCount =
      count < 1000
        ? count.toString()
        : count < 10000
          ? `${(count / 1000).toFixed(1)}k`
          : `${Math.floor(count / 1000)}k`;

    // Minimal semantic colors - just the text color, no background
    const colorStyles = {
      view: SEMANTIC_COLORS.SOCIAL_VIEW,
      copy: SEMANTIC_COLORS.SOCIAL_COPY,
      bookmark: SEMANTIC_COLORS.SOCIAL_BOOKMARK,
    };

    // Custom font size: text-[10px] instead of text-xs (12px) for minimal badge overlays
    // where 12px would be too large and obtrusive
    return (
      <span
        className={cn(
          '-top-1 -right-1 absolute',
          'font-semibold text-[10px] tabular-nums leading-none',
          'pointer-events-none',
          colorStyles[type],
          props.className
        )}
        aria-hidden="true"
      >
        {displayCount}
      </span>
    );
  }

  // TypeScript exhaustive check - will error if new variant added without handling
  const _exhaustiveCheck: never = props;
  return _exhaustiveCheck;
}

/**
 * Type guard helper: Check if a string is a valid source
 */
export function isValidSource(
  value: string
): value is UnifiedBadgeProps & { variant: 'source' } extends infer T
  ? T extends { source: infer S }
    ? S
    : never
  : never {
  return ['official', 'partner', 'community', 'verified', 'experimental', 'other'].includes(value);
}

/**
 * Export base variants for external use if needed
 */
export { baseBadgeVariants };
