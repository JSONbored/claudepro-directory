/**
 * Unified Badge System
 *
 * Production-grade badge component with discriminated union pattern.
 * Consolidates badge.tsx, config-badge.tsx, sponsored-badge.tsx, and new-indicator.tsx
 *
 * Architecture:
 * - Type-safe discriminated unions (compiler enforces valid prop combinations)
 * - class-variance-authority for consistent styling
 * - Zero runtime overhead
 * - Excellent tree-shaking
 *
 * @module components/ui/unified-badge
 */

'use client';

import { cva } from 'class-variance-authority';
import type * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/primitives/tooltip';
import { Star, TrendingUp, Zap } from '@/src/lib/icons';
import { cn } from '@/src/lib/utils';

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

/**
 * Category badge styles (from config-badge.tsx)
 */
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
} as const;

/**
 * Source badge styles (from config-badge.tsx)
 */
const sourceBadgeStyles = {
  official: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  partner: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  community: 'bg-green-500/10 text-green-400 border-green-500/20',
  verified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  experimental: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
} as const;

/**
 * Status badge styles (from config-badge.tsx)
 */
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
      category:
        | 'rules'
        | 'mcp'
        | 'agents'
        | 'commands'
        | 'hooks'
        | 'statuslines'
        | 'collections'
        | 'guides'
        | 'skills';
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
      tier: 'featured' | 'promoted' | 'spotlight' | 'sponsored';
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
    }
  | {
      /** New indicator (animated dot with tooltip) */
      variant: 'new-indicator';
      label?: string;
      side?: 'top' | 'right' | 'bottom' | 'left';
      delayDuration?: number;
      className?: string;
    }
  | {
      /** New badge (text-based "NEW" badge) */
      variant: 'new-badge';
      badgeVariant?: 'default' | 'outline';
      children?: React.ReactNode;
      className?: string;
    };

/**
 * Unified Badge Component
 *
 * Single component that handles all badge variants with full type safety.
 *
 * @example
 * ```tsx
 * // Base badge
 * <UnifiedBadge variant="base" style="default">Label</UnifiedBadge>
 *
 * // Category badge
 * <UnifiedBadge variant="category" category="mcp">MCP</UnifiedBadge>
 *
 * // Sponsored badge
 * <UnifiedBadge variant="sponsored" tier="featured" showIcon />
 *
 * // New indicator
 * <UnifiedBadge variant="new-indicator" label="New feature" />
 *
 * // Tag badge
 * <UnifiedBadge
 *   variant="tag"
 *   tag="React"
 *   isActive
 *   onClick={() => {}}
 *   onRemove={() => {}}
 * />
 * ```
 */
export function UnifiedBadge(props: UnifiedBadgeProps) {
  // Base badge variant
  if (props.variant === 'base') {
    return (
      <div className={cn(baseBadgeVariants({ variant: props.style }), props.className)}>
        {props.children}
      </div>
    );
  }

  // Category badge variant
  if (props.variant === 'category') {
    return (
      <div
        className={cn(
          'text-xs font-medium border transition-colors',
          categoryBadgeStyles[props.category],
          props.className
        )}
      >
        {props.children}
      </div>
    );
  }

  // Source badge variant
  if (props.variant === 'source') {
    return (
      <div
        className={cn(
          'text-xs font-medium border transition-colors',
          sourceBadgeStyles[props.source],
          props.className
        )}
      >
        {props.children}
      </div>
    );
  }

  // Status badge variant
  if (props.variant === 'status') {
    return (
      <div
        className={cn(
          'text-xs font-medium border transition-colors',
          statusBadgeStyles[props.status],
          props.className
        )}
      >
        {props.children}
      </div>
    );
  }

  // Sponsored badge variant
  if (props.variant === 'sponsored') {
    const getIcon = () => {
      if (!props.showIcon) return null;

      switch (props.tier) {
        case 'featured':
          return <Star className="h-3 w-3 mr-1 fill-current" aria-hidden="true" />;
        case 'promoted':
          return <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />;
        case 'spotlight':
          return <Zap className="h-3 w-3 mr-1" aria-hidden="true" />;
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
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
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
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200',
            'cursor-pointer bg-accent text-accent-foreground shadow-lg shadow-primary/25',
            props.className
          )}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick?.();
            }
          }}
        >
          {props.tag}
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
        </div>
      );
    }

    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200',
          'cursor-pointer hover:bg-accent/10 hover:border-accent/30 border-muted-foreground/20 text-muted-foreground hover:text-accent',
          props.className
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick?.();
          }
        }}
      >
        {props.tag}
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
      </div>
    );
  }

  // New indicator variant (animated dot)
  if (props.variant === 'new-indicator') {
    const label = props.label || 'New feature';
    const side = props.side || 'bottom';
    const delayDuration = props.delayDuration || 300;

    return (
      <TooltipProvider delayDuration={delayDuration}>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side={side} className="text-xs font-medium">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
          'px-1.5 py-0.5',
          'text-[10px] font-semibold uppercase tracking-wider',
          'rounded border',
          'transition-colors duration-200',
          variantStyles[badgeVariant],
          props.className
        )}
        aria-label="New"
      >
        {children}
      </output>
    );
  }

  // TypeScript exhaustive check - will error if new variant added without handling
  const _exhaustiveCheck: never = props;
  return _exhaustiveCheck;
}

/**
 * Type guard helper: Check if a string is a valid category
 */
export function isValidCategory(
  value: string
): value is UnifiedBadgeProps & { variant: 'category' } extends infer T
  ? T extends { category: infer C }
    ? C
    : never
  : never {
  return [
    'rules',
    'mcp',
    'agents',
    'commands',
    'hooks',
    'statuslines',
    'collections',
    'guides',
    'skills',
  ].includes(value);
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
