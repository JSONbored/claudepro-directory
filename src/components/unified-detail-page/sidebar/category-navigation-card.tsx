/**
 * CategoryNavigationCard - Server Component for category navigation
 *
 * CONVERTED: Client → Server component (Link works in server components)
 * Pure rendering of category navigation links
 *
 * Performance: Eliminated from client bundle, server-rendered
 */

/**
 * CategoryNavigationCard - Category navigation with icons
 *
 * Extracted from unified-sidebar.tsx (lines 246-272)
 * Reusable category navigation component for any categorized content
 *
 * @see components/unified-sidebar.tsx - Original implementation
 */

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Schema for category info
 */
const categoryInfoSchema = z.object({
  label: nonEmptyString,
  icon: z.custom<LucideIcon>(),
  description: nonEmptyString,
  color: z.string().optional(),
  activeColor: z.string().optional(),
});

/**
 * Schema for CategoryNavigationCard props
 */
const categoryNavigationCardPropsSchema = z.object({
  currentCategory: z.string().optional(),
  categories: z.record(z.string(), categoryInfoSchema),
  basePath: nonEmptyString.default('/guides'),
});

export type CategoryNavigationCardProps = z.infer<typeof categoryNavigationCardPropsSchema>;

/**
 * CategoryNavigationCard Component (Server Component)
 *
 * Renders category navigation with icons and tooltips.
 * Supports active state highlighting and custom colors.
 * No React.memo needed - server components don't re-render
 */
export function CategoryNavigationCard({
  currentCategory,
  categories,
  basePath = '/guides',
}: CategoryNavigationCardProps) {
  // Validate props
  const validatedProps = categoryNavigationCardPropsSchema.parse({
    currentCategory,
    categories,
    basePath,
  });

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} px-1`}>
        {Object.entries(validatedProps.categories).map(([key, info]) => {
          const Icon = info.icon;
          const isActive = validatedProps.currentCategory === key;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Link
                  href={`${validatedProps.basePath}/${key}`}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? info.activeColor || 'text-primary bg-primary/10'
                      : `text-muted-foreground ${info.color || `${UI_CLASSES.HOVER_TEXT_PRIMARY} ${UI_CLASSES.HOVER_BG_MUTED_50}`}`
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                <div className="font-semibold">{info.label}</div>
                <div className="text-muted-foreground mt-0.5">{info.description}</div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
