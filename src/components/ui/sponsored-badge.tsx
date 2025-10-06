import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { Star, TrendingUp, Zap } from '@/src/lib/icons';
import { cn } from '@/src/lib/utils';

/**
 * Sponsored Badge Component
 * Transparent disclosure badges for sponsored/promoted content
 *
 * Follows existing badge.tsx patterns with sponsor-specific variants
 */

const sponsoredBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      tier: {
        featured: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        promoted: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        spotlight: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
        sponsored: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
      },
    },
    defaultVariants: {
      tier: 'sponsored',
    },
  }
);

export interface SponsoredBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sponsoredBadgeVariants> {
  showIcon?: boolean;
}

function SponsoredBadge({ className, tier, showIcon = true, ...props }: SponsoredBadgeProps) {
  const getIcon = () => {
    if (!showIcon) return null;

    switch (tier) {
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
    switch (tier) {
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
      className={cn(sponsoredBadgeVariants({ tier }), className)}
      aria-label={`${getLabel()} content`}
      {...props}
    >
      {getIcon()}
      {getLabel()}
    </div>
  );
}

export { SponsoredBadge, sponsoredBadgeVariants };
