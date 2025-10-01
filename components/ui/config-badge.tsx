'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const configBadgeVariants = cva('text-xs font-medium border transition-colors', {
  variants: {
    type: {
      rules: 'badge-category-rules',
      mcp: 'badge-category-mcp',
      agents: 'badge-category-agents',
      commands: 'badge-category-commands',
      hooks: 'badge-category-hooks',
      guides: 'badge-category-guides',
      default: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    },
    source: {
      official: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      partner: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      community: 'bg-green-500/10 text-green-400 border-green-500/20',
      verified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      experimental: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    },
    status: {
      active: 'bg-accent text-accent-foreground shadow-lg shadow-primary/25',
      trending: 'bg-primary/10 text-primary border-primary/20',
      new: 'bg-green-500/10 text-green-400 border-green-500/20',
      updated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      deprecated: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  },
  defaultVariants: {
    type: 'default',
  },
});

export interface ConfigBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof configBadgeVariants> {
  type?: 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks' | 'guides' | 'default';
  source?: 'official' | 'partner' | 'community' | 'verified' | 'experimental' | 'other';
  status?: 'active' | 'trending' | 'new' | 'updated' | 'deprecated';
}

export function ConfigBadge({
  className,
  type,
  source,
  status,
  children,
  ...props
}: ConfigBadgeProps) {
  let computedClassName = '';

  if (type) {
    computedClassName = configBadgeVariants({ type });
  } else if (source) {
    computedClassName = configBadgeVariants({ source });
  } else if (status) {
    computedClassName = configBadgeVariants({ status });
  }

  if (computedClassName) {
    return (
      <div className={cn(computedClassName, className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <Badge className={className} {...props}>
      {children}
    </Badge>
  );
}

export function TypeBadge({
  type,
  className,
  ...props
}: { type: 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks' | 'guides' } & Omit<
  ConfigBadgeProps,
  'type'
>) {
  const displayText =
    type === 'mcp'
      ? 'MCP'
      : type === 'rules'
        ? 'Rule'
        : type === 'agents'
          ? 'Agent'
          : type === 'commands'
            ? 'Command'
            : type === 'hooks'
              ? 'Hook'
              : 'Guide';

  return (
    <ConfigBadge type={type} className={className} {...props}>
      {displayText}
    </ConfigBadge>
  );
}

export function SourceBadge({
  source,
  className,
  ...props
}: { source: string } & Omit<ConfigBadgeProps, 'source'>) {
  const normalizedSource = source.toLowerCase();
  const validSources = ['official', 'partner', 'community', 'verified', 'experimental'];
  const badgeSource = validSources.includes(normalizedSource)
    ? (normalizedSource as 'official' | 'partner' | 'community' | 'verified' | 'experimental')
    : ('other' as const);

  return (
    <ConfigBadge source={badgeSource} className={cn('border', className)} {...props}>
      {source}
    </ConfigBadge>
  );
}

export function TagBadge({
  tag,
  isActive = false,
  onClick,
  onRemove,
  className,
  ...props
}: {
  tag: string;
  isActive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
} & Omit<ConfigBadgeProps, 'status'>) {
  const handleClick = onClick ? () => onClick() : undefined;

  if (isActive) {
    return (
      <ConfigBadge
        status="active"
        className={cn(
          'cursor-pointer transition-all duration-200 bg-accent text-accent-foreground shadow-lg shadow-primary/25',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {tag}
        {onRemove && (
          <button
            type="button"
            className="ml-1 hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            ×
          </button>
        )}
      </ConfigBadge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'cursor-pointer transition-all duration-200 hover:bg-accent/10 hover:border-accent/30 border-muted-foreground/20 text-muted-foreground hover:text-accent',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          className="ml-1 hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </Badge>
  );
}

export { configBadgeVariants };
