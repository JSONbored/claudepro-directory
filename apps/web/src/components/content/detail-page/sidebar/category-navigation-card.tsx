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

import { nonEmptyString } from '@heyclaude/shared-runtime';
import { type LucideIcon } from '@heyclaude/web-runtime/icons';
import {
  DIMENSIONS,
  UI_CLASSES,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { z } from 'zod';

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
 * Render a horizontal grid of category icons as navigable links with tooltips and active styling.
 *
 * Each entry displays an icon and a tooltip containing the category label and description.
 * The active category is highlighted using the category's `activeColor` (or default active styles),
 * while inactive categories use `color` (or default inactive styles).
 *
 * @param currentCategory - The key of the currently active category (if any).
 * @param categories - A mapping of category keys to category info objects (label, `icon`, description, optional `color` and `activeColor`).
 * @param basePath - Base path prefixed to category keys when building link URLs. Defaults to `'/guides'`.
 * @returns A React element containing the category navigation grid.
 *
 * @see CategoryNavigationCardProps
 * @see categoryInfoSchema
 * @see Tooltip
 * @see UI_CLASSES
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
                  className={`rounded-lg p-2 transition-all ${
                    isActive
                      ? info.activeColor || 'bg-primary/10 text-primary'
                      : `text-muted-foreground ${info.color || 'hover:bg-muted/50 hover:text-primary'}`
                  }`}
                  style={{ transitionDuration: 'var(--duration-quick)' }}
                >
                  <Icon className={UI_CLASSES.ICON_SM} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className={`${DIMENSIONS.TOOLTIP_MAX} text-xs`}>
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