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

import type { content_category } from '@heyclaude/data-layer/prisma';
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
 */
const categoryGradients: Record<
  content_category,
  string
> = {
  agents: 'from-violet-500 via-purple-500 to-blue-500',
  mcp: 'from-cyan-500 via-blue-500 to-indigo-500',
  commands: 'from-blue-500 via-cyan-500 to-teal-500',
  rules: 'from-amber-500 via-orange-500 to-yellow-500',
  hooks: 'from-emerald-500 via-teal-500 to-cyan-500',
  statuslines: 'from-teal-500 via-cyan-500 to-blue-500',
  collections: 'from-indigo-500 via-purple-500 to-pink-500',
  skills: 'from-pink-500 via-rose-500 to-red-500',
  guides: 'from-violet-500 via-purple-500 to-fuchsia-500',
  jobs: 'from-orange-500 via-red-500 to-pink-500',
  changelog: 'from-slate-500 via-gray-500 to-zinc-500',
};

const defaultGradient = 'from-slate-500 via-gray-500 to-zinc-500';

export function Navigation3DCard({
  href,
  label,
  description,
  category,
  className,
}: Navigation3DCardProps) {
  const { value: isHovered, setTrue: setIsHoveredTrue, setFalse: setIsHoveredFalse } = useBoolean();

  const gradient = category
    ? categoryGradients[category] ?? defaultGradient
    : defaultGradient;

  const cardContent = (
    <div
      className={cn('relative group/pin cursor-pointer h-full w-full perspective-[1000px]', 'flex items-center justify-center', className)}
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
          'w-[120px] h-[70px] rounded-2xl',
          'shadow-[0_8px_16px_rgb(0_0_0/0.4)] bg-black border border-white/[0.1]',
          'group-hover/pin:border-white/[0.2] transition-all duration-700 overflow-hidden'
        )}
      >
        <div className={cn('flex flex-col', 'basis-full', 'p-2', 'tracking-tight text-slate-100/50 w-full h-full')}>
          {/* Title */}
          <h3 className={cn('max-w-xs', 'pb-0.5', '!m-0 font-bold', 'text-[10px]', 'text-slate-100 leading-tight')}>
            {label}
          </h3>

          {/* Badge (if category) */}
          {category && (
            <div className="mb-1">
              <UnifiedBadge
                variant="category"
                category={category}
                href={null}
                className={cn('text-[8px]', 'px-1', 'py-4')}
              />
            </div>
          )}

          {/* Gradient block at bottom (shadcn 3d-pin style) */}
          <div
            className={cn(
              'flex flex-1 w-full rounded-lg',
              'mt-1',
              'bg-gradient-to-br',
              gradient
            )}
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
            <div className={cn('font-semibold', 'mb-[18px]')}>{label}</div>
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
