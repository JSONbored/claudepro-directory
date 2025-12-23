'use client';

/**
 * Navigation 3D Card Component
 *
 * Interactive 3D card matching shadcn 3d-pin design exactly.
 * Cards tilt forward on hover like opening a door, with perspective-based depth.
 *
 * Features:
 * - Fixed forward tilt on hover (rotateX 20deg, scale 0.95)
 * - Perspective container for 3D viewing angle
 * - Category-specific gradient blocks at bottom
 * - Compact size (half of previous)
 * - Tooltip for description (hover for details)
 * - Hardware-accelerated transforms
 */

import type { content_category } from '@prisma/client';
import type { LucideIcon } from '@heyclaude/web-runtime/icons';
import {
  UnifiedBadge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

export interface Navigation3DCardProps {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon | undefined;
  category?: content_category | undefined;
  badge?: string;
  className?: string;
}

/**
 * Category color configuration for gradient blocks (shadcn 3d-pin style)
 * Uses Tailwind utilities auto-generated from @theme block design tokens
 */
const categoryGradients: Record<content_category, string> = {
  agents: 'bg-category-agents-bg',
  mcp: 'bg-category-mcp-bg',
  commands: 'bg-category-commands-bg',
  rules: 'bg-category-rules-bg',
  hooks: 'bg-category-hooks-bg',
  statuslines: 'bg-category-statuslines-bg',
  collections: 'bg-muted/50',
  skills: 'bg-muted/50',
  guides: 'bg-muted/50',
  jobs: 'bg-primary/10',
  changelog: 'bg-muted/50',
};

const defaultGradient = 'bg-muted/50';

export function Navigation3DCard({
  href,
  label,
  description,
  category,
  className,
}: Navigation3DCardProps) {
  const { value: isHovered, setTrue: setIsHoveredTrue, setFalse: setIsHoveredFalse } = useBoolean();

  const gradient = category ? (categoryGradients[category] ?? defaultGradient) : defaultGradient;

  const cardContent = (
    <div
      className={cn(
        'group/pin relative h-full w-full cursor-pointer perspective-[1000px]',
        'flex items-center justify-center',
        className
      )}
      onMouseEnter={setIsHoveredTrue}
      onMouseLeave={setIsHoveredFalse}
    >
      {/* Card with forward tilt transform (shadcn 3d-pin style) */}
      <div
        style={{
          transform: isHovered
            ? 'rotateX(15deg) translateZ(15px) scale(0.92)'
            : 'rotateX(0deg) translateZ(0px) scale(1)',
          transformStyle: 'preserve-3d',
          transformOrigin: 'center bottom',
        }}
        className={cn(
          'h-16 w-28 rounded-2xl', // 70px ≈ 4rem (h-16), 120px ≈ 7rem (w-28)
          'border border-foreground/10 bg-background shadow-lg',
          'overflow-hidden transition-all duration-700 group-hover/pin:border-foreground/20'
        )}
      >
        <div
          className={cn(
            'flex flex-col',
            'basis-full',
            'p-2',
            'h-full w-full tracking-tight text-foreground/50'
          )}
        >
          {/* Title */}
          <h3
            className={cn(
              'max-w-xs',
              'pb-0.5',
              '!m-0 font-bold',
              'text-xs', // 10px ≈ text-xs (0.75rem)
              'leading-tight text-foreground'
            )}
          >
            {label}
          </h3>

          {/* Badge (if category) */}
          {category && (
            <div className="mb-1">
              <UnifiedBadge
                variant="category"
                category={category}
                href={null}
                className={cn('text-4xs', 'px-1', 'py-4')} // 8px = text-4xs
              />
            </div>
          )}

          {/* Gradient block at bottom (shadcn 3d-pin style) */}
          <div
            className={cn('flex w-full flex-1 rounded-lg', 'mt-1', gradient)}
          />
        </div>
      </div>
    </div>
  );

  // Wrap in Link and Tooltip if description provided
  if (description) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href} prefetch className="block h-full w-full">
              {cardContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs">
            <div className={cn('font-semibold', 'mb-4')}>{label}</div> {/* 18px ≈ 1rem (mb-4) */}
            <div className="text-muted-foreground">{description}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={href} prefetch className="block h-full w-full">
      {cardContent}
    </Link>
  );
}
