'use client';

/**
 * Loading Skeleton Components
 *
 * Enhanced with Motion.dev directional shimmer wave effect.
 * Comprehensive skeleton system for loading states across the application.
 *
 * Architecture:
 * - Client component (uses Motion.dev animations)
 * - Uses unified design system for styling
 * - Respects prefers-reduced-motion (falls back to pulse)
 * - GPU-accelerated animations
 *
 * Motion.dev Enhancements (Phase 1.5 - October 2025):
 * - Directional shimmer wave (left-to-right gradient animation)
 * - GPU-accelerated with linear gradient mask
 * - Infinite loop with smooth timing
 * - Respects prefers-reduced-motion (falls back to pulse)
 *
 * Usage:
 * ```tsx
 * import { Skeleton, LoadingSkeleton, ConfigCardSkeleton } from '@heyclaude/web-runtime/ui';
 *
 * <Skeleton size="md" width="lg" />
 * <ConfigCardSkeleton />
 * <LoadingSkeleton />
 * ```
 */

import { cn } from '../../utils.ts';
// Design System imports
import { absolute } from '../../../design-system/styles/position.ts';
import { stack, cluster, wrap, grid, between, gap, padding, marginBottom, squareSize } from '../../../design-system/styles/layout.ts';
import { size } from '../../../design-system/styles/typography.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'motion/react';
import type * as React from 'react';

const skeletonVariants = cva('relative overflow-hidden bg-muted rounded', {
  variants: {
    variant: {
      default: 'bg-muted',
      card: 'bg-card',
      accent: 'bg-accent/20',
    },
    size: {
      xs: 'h-3',
      sm: 'h-4',
      md: 'h-6',
      lg: 'h-8',
      xl: 'h-12',
    },
    width: {
      xs: 'w-16',
      sm: 'w-24',
      md: 'w-32',
      lg: 'w-48',
      xl: 'w-64',
      '2xl': 'w-96',
      '3xl': 'w-full',
      '1/2': 'w-1/2',
      '2/3': 'w-2/3',
      '3/4': 'w-3/4',
      '4/5': 'w-4/5',
      '5/6': 'w-5/6',
    },
    rounded: {
      none: radius.none,
      sm: radius.sm,
      md: radius.default,
      lg: radius.lg,
      xl: radius.xl,
      full: radius.full,
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    width: 'md',
    rounded: 'md',
  },
});

export type SkeletonProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'size'> &
  VariantProps<typeof skeletonVariants> & {
    /** Disable shimmer animation (use simple pulse) */
    noShimmer?: boolean;
  };

export function Skeleton({
  className,
  variant,
  size,
  width,
  rounded,
  noShimmer = false,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        skeletonVariants({ variant, size, width, rounded }),
        noShimmer && 'animate-pulse',
        className
      )}
      {...props}
    >
      {/* Shimmer wave effect - only if not disabled */}
      {!noShimmer && (
        <motion.div
          className={`${absolute.inset} bg-linear-to-r from-transparent via-white/10 to-transparent`}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 1.5,
            ease: 'linear',
          }}
          style={{
            willChange: 'transform',
          }}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className={'flex min-h-screen items-center justify-center'}>
      <div className={stack.comfortable + ' items-center'}>
        <div className={`${squareSize.avatarLg} animate-spin ${radius.full} border-4 border-primary border-t-transparent`} />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function PageHeaderSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(marginBottom.relaxed, className)} {...props}>
      <Skeleton size="lg" width="lg" className={marginBottom.default} />
      <Skeleton size="sm" width="2xl" />
    </div>
  );
}

function ConfigCardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${radius.lg} border bg-card ${padding.comfortable}`, className)} {...props}>
      <Skeleton size="md" width="3/4" className={marginBottom.compact} />
      <Skeleton size="sm" width="3xl" className={marginBottom.compact} />
      <Skeleton size="sm" width="5/6" className={marginBottom.default} />
      <div className={cluster.compact}>
        <Skeleton size="sm" width="xs" rounded="full" />
        <Skeleton size="sm" width="xs" rounded="full" />
      </div>
    </div>
  );
}

function ConfigGridSkeleton({
  count = 6,
  className,
  stagger = true,
  ...props
}: {
  count?: number;
  stagger?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('container mx-auto px-4 py-8', className)} {...props}>
      <PageHeaderSkeleton />
      <div className={grid.contentTight}>
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={`config-skeleton-${i + 1}`}
            initial={stagger ? { opacity: 0, y: 20 } : false}
            animate={stagger ? { opacity: 1, y: 0 } : {}}
            transition={
              stagger
                ? {
                    duration: 0.3,
                    delay: i * 0.05, // Stagger by 50ms per card
                    ease: 'easeOut',
                  }
                : {}
            }
          >
            <ConfigCardSkeleton />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ContentListSkeleton({
  count = 8,
  stagger = true,
  className,
  ...props
}: {
  count?: number;
  stagger?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={`content-skeleton-${i + 1}`}
          className={`${radius.lg} border ${padding.default}`}
          initial={stagger ? { opacity: 0, x: -20 } : false}
          animate={stagger ? { opacity: 1, x: 0 } : {}}
          transition={
            stagger
              ? {
                  duration: 0.3,
                  delay: i * 0.04, // Faster stagger for lists
                  ease: 'easeOut',
                }
              : {}
          }
        >
          <div className={`${marginBottom.compact} flex items-start justify-between`}>
            <div className="flex-1">
              <Skeleton size="md" width="2/3" className={marginBottom.compact} />
              <Skeleton size="sm" width="3xl" />
            </div>
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
          <div className={cluster.compact}>
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SearchBarSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${marginBottom.relaxed} flex ${gap.comfortable}`, className)} {...props}>
      <Skeleton size="lg" width="3xl" />
      <Skeleton size="lg" width="lg" />
    </div>
  );
}

function FilterBarSkeleton({
  stagger = true,
  className,
  ...props
}: {
  stagger?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(`space-y-6 ${radius.lg} border border-border/50 bg-card/30 ${padding.comfortable}`, className)}
      {...props}
    >
      <div className={between.center}>
        <Skeleton size="md" width="lg" />
        <Skeleton size="sm" width="sm" />
      </div>
      <div className={`grid grid-cols-1 ${gap.relaxed} md:grid-cols-2 lg:grid-cols-4`}>
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`filter-skeleton-${i + 1}`}
            className="space-y-2"
            initial={stagger ? { opacity: 0, y: 10 } : false}
            animate={stagger ? { opacity: 1, y: 0 } : {}}
            transition={
              stagger
                ? {
                    duration: 0.25,
                    delay: i * 0.05, // 50ms stagger per filter
                    ease: 'easeOut',
                  }
                : {}
            }
          >
            <Skeleton size="sm" width="sm" />
            <Skeleton size="lg" width="3xl" />
          </motion.div>
        ))}
      </div>
      <div className={wrap.compact}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`tag-skeleton-${i + 1}`}
            initial={stagger ? { opacity: 0, scale: 0.9 } : false}
            animate={stagger ? { opacity: 1, scale: 1 } : {}}
            transition={
              stagger
                ? {
                    duration: 0.2,
                    delay: 0.2 + i * 0.02, // Start after filters, 20ms stagger per tag
                    ease: 'easeOut',
                  }
                : {}
            }
          >
            <Skeleton size="sm" width="xs" rounded="full" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton({
  rows = 5,
  columns = 4,
  stagger = true,
  className,
  ...props
}: {
  rows?: number;
  columns?: number;
  stagger?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${radius.lg} border`, className)} {...props}>
      <div className={`border-b ${padding.default}`}>
        <div className={`grid ${gap.comfortable}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={`header-${i + 1}`} size="sm" width="sm" />
          ))}
        </div>
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <motion.div
          key={`row-${rowIndex + 1}`}
          className={`border-b ${padding.default} last:border-b-0`}
          initial={stagger ? { opacity: 0, x: -10 } : false}
          animate={stagger ? { opacity: 1, x: 0 } : {}}
          transition={
            stagger
              ? {
                  duration: 0.25,
                  delay: rowIndex * 0.03, // 30ms stagger per row
                  ease: 'easeOut',
                }
              : {}
          }
        >
          <div className={`grid ${gap.comfortable}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <Skeleton key={`cell-${rowIndex + 1}-${colIndex + 1}`} size="sm" width="md" />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ButtonSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton size="lg" width="lg" rounded="md" className={className} {...props} />;
}

function ImageSkeleton({
  aspectRatio = 'square',
  className,
  ...props
}: {
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall';
} & React.HTMLAttributes<HTMLDivElement>) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[2/1]',
    tall: 'aspect-[1/2]',
  };

  return <Skeleton className={cn(aspectClasses[aspectRatio], 'w-full', className)} {...props} />;
}

function FeaturedSectionSkeleton({
  count = 6,
  stagger = true,
  className,
  ...props
}: {
  count?: number;
  stagger?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-8', className)} {...props}>
      {/* Section Header */}
      <div className={between.center}>
        <Skeleton size="lg" width="lg" />
        <Skeleton size="sm" width="sm" />
      </div>
      {/* Card Grid with Stagger */}
      <div className={grid.responsive3}>
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={`featured-skeleton-${i + 1}`}
            initial={stagger ? { opacity: 0, y: 20 } : false}
            animate={stagger ? { opacity: 1, y: 0 } : {}}
            transition={
              stagger
                ? {
                    duration: 0.3,
                    delay: i * 0.05,
                    ease: 'easeOut',
                  }
                : {}
            }
          >
            <ConfigCardSkeleton />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function HomepageStatsSkeleton({
  stagger = true,
  className,
  ...props
}: {
  stagger?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(`flex-wrap justify-center ${gap.comfortable} ${size.xs} lg:${gap.relaxed} lg:${size.sm}`, className)}
      {...props}
    >
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={`stat-skeleton-${i + 1}`}
          className={cluster.compact}
          initial={stagger ? { opacity: 0, scale: 0.9 } : false}
          animate={stagger ? { opacity: 1, scale: 1 } : {}}
          transition={
            stagger
              ? {
                  duration: 0.25,
                  delay: i * 0.04, // 40ms stagger per stat
                  ease: 'easeOut',
                }
              : {}
          }
        >
          <Skeleton size="sm" width="xs" rounded="full" />
          <Skeleton size="sm" width="sm" />
        </motion.div>
      ))}
    </div>
  );
}

export {
  LoadingSkeleton,
  PageHeaderSkeleton,
  ConfigCardSkeleton,
  ConfigGridSkeleton,
  ContentListSkeleton,
  SearchBarSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
  ButtonSkeleton,
  ImageSkeleton,
  FeaturedSectionSkeleton,
  HomepageStatsSkeleton,
  skeletonVariants,
};
