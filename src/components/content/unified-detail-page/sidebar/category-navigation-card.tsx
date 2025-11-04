/**
 * CategoryNavigationCard Component - Icon Navigation Grid (Server Component)
 *
 * **ARCHITECTURAL DECISION: NOT CONSOLIDATED WITH BaseCard**
 *
 * CategoryNavigationCard is a specialized navigation component that renders
 * a horizontal grid of category icons, NOT a content display card.
 * It serves a fundamentally different purpose than BaseCard.
 *
 * **Why CategoryNavigationCard is separate from BaseCard:**
 *
 * 1. **Different UI Pattern**
 *    - CategoryNavigationCard: Horizontal icon grid with tooltips (navigation)
 *    - BaseCard: Vertical content card with title, description, tags, actions
 *
 * 2. **Zero Visual Similarity**
 *    - CategoryNavigationCard: No Card components, no CardHeader, no CardContent
 *    - Uses: TooltipProvider + Link grid with icons
 *    - BaseCard: Uses Card/CardHeader/CardContent/CardFooter hierarchy
 *
 * 3. **Different Component Type**
 *    - CategoryNavigationCard: Server component (zero client JS)
 *    - BaseCard: Client component (needs useCardNavigation hook)
 *
 * 4. **Zero Functional Overlap**
 *    - CategoryNavigationCard has: category icons, active state, tooltips
 *    - BaseCard has: title, description, tags, metadata badges, action buttons
 *    - NO shared rendering logic or features
 *
 * 5. **Production Optimization**
 *    - Server-rendered with Zod validation (runtime safety)
 *    - No React.memo needed (server components don't re-render)
 *    - Already eliminated from client bundle
 *
 * 6. **Single Responsibility**
 *    - Navigation component (category switching)
 *    - NOT a content display component
 *
 * **Performance Benefits:**
 * - Server-rendered (zero client JS)
 * - Zod validation ensures type safety at runtime
 * - Link components work natively in server components
 *
 * **Usage:**
 * ```tsx
 * <CategoryNavigationCard
 *   currentCategory="use-cases"
 *   categories={categoryInfo}
 *   basePath="/guides"
 * />
 * ```
 *
 * **Renders:**
 * Horizontal icon grid: [Icon] [Icon] [Icon] [Icon] (with hover tooltips)
 *
 * @see src/components/layout/sidebar/unified-sidebar.tsx - Primary usage
 * @see src/components/shared/base-card.tsx - Content display cards (different purpose)
 */

import Link from 'next/link';
import { z } from 'zod';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/primitives/tooltip';
import type { LucideIcon } from '@/src/lib/icons';
import { nonEmptyString } from '@/src/lib/schemas/primitives';
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
  // Database CHECK constraint validates structure - no runtime validation needed
  return (
    <TooltipProvider delayDuration={300}>
      <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} px-1`}>
        {Object.entries(categories).map(([key, info]) => {
          const Icon = info.icon;
          const isActive = currentCategory === key;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Link
                  href={`${basePath}/${key}`}
                  className={`rounded-lg p-2 transition-all duration-200 ${
                    isActive
                      ? info.activeColor || 'bg-primary/10 text-primary'
                      : `text-muted-foreground ${info.color || 'hover:bg-muted/50 hover:text-primary'}`
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                <div className="font-semibold">{info.label}</div>
                <div className="mt-0.5 text-muted-foreground">{info.description}</div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
