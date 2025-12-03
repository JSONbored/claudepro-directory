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
import {
  between,
  iconSize,
  transition,
  hoverBg,
  marginTop,
  weight,
  muted,
  radius,
  size,
  padding,
  textColor,
  maxWidth,
  bgColor,
} from '@heyclaude/web-runtime/design-system';
import type { IconComponent } from '@heyclaude/web-runtime/icons';
import Link from 'next/link';
import { z } from 'zod';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@heyclaude/web-runtime/ui';

/**
 * Schema for category info
 */
const categoryInfoSchema = z.object({
  label: nonEmptyString,
  icon: z.custom<IconComponent>(),
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
 * Render a horizontal navigation of category icons with tooltips and optional active highlighting.
 *
 * This is a server component; it performs no client-side data fetching and does not enable incremental
 * static regeneration. Each category is rendered as a linked icon with a tooltip showing its label and description.
 *
 * @param currentCategory - The key of the currently active category used to apply active styling
 * @param categories - Mapping of category keys to metadata: `label`, `icon`, `description`, optional `color` and `activeColor`
 * @param basePath - Base path prepended to each category link (defaults to `'/guides'`)
 * @returns A JSX element containing the horizontal category icon navigation
 *
 * @see Tooltip
 * @see TooltipTrigger
 * @see TooltipContent
 * @see between
 * @see iconSize
 */
export function CategoryNavigationCard({
  currentCategory,
  categories,
  basePath = '/guides',
}: CategoryNavigationCardProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  return (
    <TooltipProvider delayDuration={300}>
      <div className={`${between.center} ${padding.xMicro}`}>
        {Object.entries(categories).map(([key, info]) => {
          const Icon = info.icon;
          const isActive = currentCategory === key;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild={true}>
                <Link
                  href={`${basePath}/${key}`}
                  className={`${radius.lg} ${padding.tight} ${transition.default} ${
                    isActive
                      ? info.activeColor || `${bgColor['primary/10']} ${textColor.primary}`
                      : `${muted.default} ${info.color || `${hoverBg.muted} hover:${textColor.primary}`}`
                  }`}
                >
                  <Icon className={iconSize.sm} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className={`${maxWidth.tooltip} ${size.xs}`}>
                <div className={weight.semibold}>{info.label}</div>
                <div className={`${marginTop.micro} ${muted.default}`}>{info.description}</div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}