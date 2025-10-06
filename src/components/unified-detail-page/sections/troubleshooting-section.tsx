/**
 * TroubleshootingSection - Server Component for troubleshooting
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of issues and solutions
 *
 * Consolidates troubleshooting rendering from unified-detail-page.tsx (lines 307-348)
 * Handles both string arrays and issue/solution object arrays
 * Performance: Eliminated from client bundle, server-rendered
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Copy } from '@/src/lib/icons';
import { componentDescriptionString } from '@/src/lib/schemas/primitives/ui-component-primitives';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Troubleshooting item can be either a string or an issue/solution pair
 */
const troubleshootingItemSchema = z.union([
  z.string().min(1),
  z.object({
    issue: z.string().min(1),
    solution: z.string().min(1),
  }),
]);

/**
 * Schema for TroubleshootingSection props
 */
const troubleshootingSectionPropsSchema = z.object({
  items: z.array(troubleshootingItemSchema).min(1),
  description: componentDescriptionString,
});

export type TroubleshootingSectionProps = z.infer<typeof troubleshootingSectionPropsSchema>;

/**
 * TroubleshootingSection Component (Server Component)
 *
 * Renders common issues and solutions with two formats:
 * - Simple string array for basic troubleshooting tips
 * - Issue/solution objects for structured problem-solving
 * No React.memo needed - server components don't re-render
 */
export function TroubleshootingSection({ items, description }: TroubleshootingSectionProps) {
  // Validate props
  const validated = troubleshootingSectionPropsSchema.parse({
    items,
    description,
  });

  if (validated.items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <Copy className="h-5 w-5" />
          Troubleshooting
        </CardTitle>
        {validated.description && <CardDescription>{validated.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ul className={UI_CLASSES.SPACE_Y_4}>
          {validated.items.map((trouble) => {
            // Simple string format
            if (typeof trouble === 'string') {
              return (
                <li key={trouble.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{trouble}</span>
                </li>
              );
            }

            // Issue/solution object format
            return (
              <li key={trouble.issue.slice(0, 50)} className={UI_CLASSES.SPACE_Y_2}>
                <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div className={UI_CLASSES.SPACE_Y_1}>
                    <p className="text-sm font-medium text-foreground">{trouble.issue}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {trouble.solution}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
