'use client';

/**
 * TroubleshootingSection - Troubleshooting guide section
 *
 * Consolidates troubleshooting rendering from unified-detail-page.tsx (lines 307-348)
 * Handles both string arrays and issue/solution object arrays
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import { Copy } from 'lucide-react';
import { memo } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { componentDescriptionString } from '@/lib/schemas/primitives';

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
 * TroubleshootingSection Component
 *
 * Renders common issues and solutions with two formats:
 * - Simple string array for basic troubleshooting tips
 * - Issue/solution objects for structured problem-solving
 */
export const TroubleshootingSection = memo(function TroubleshootingSection({
  items,
  description,
}: TroubleshootingSectionProps) {
  // Validate props
  const validated = troubleshootingSectionPropsSchema.parse({ items, description });

  if (validated.items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Troubleshooting
        </CardTitle>
        {validated.description && <CardDescription>{validated.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {validated.items.map((trouble) => {
            // Simple string format
            if (typeof trouble === 'string') {
              return (
                <li key={trouble.slice(0, 50)} className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{trouble}</span>
                </li>
              );
            }

            // Issue/solution object format
            return (
              <li key={trouble.issue.slice(0, 50)} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div className="space-y-1">
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
});
