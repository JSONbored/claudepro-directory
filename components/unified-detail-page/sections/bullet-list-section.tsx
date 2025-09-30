/**
 * BulletListSection - Server Component for bullet lists
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of features, use cases, requirements, security, examples
 *
 * Consolidates 5 duplicate render functions from unified-detail-page.tsx:
 * - renderFeatures() - 25 lines
 * - renderUseCases() - 31 lines
 * - renderRequirements() - 25 lines
 * - renderSecurity() - 26 lines
 * - renderExamples() - 26 lines
 *
 * Total duplication eliminated: ~133 lines → 1 component (40 lines)
 * Performance: Eliminated from client bundle, server-rendered
 *
 * @see components/unified-detail-page.tsx - Original implementation
 */

import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { componentDescriptionString, componentTitleString } from '@/lib/schemas/primitives';
import { cn } from '@/lib/utils';

/**
 * Schema for BulletListSection props using primitives
 */
const bulletListSectionPropsSchema = z.object({
  title: componentTitleString,
  description: componentDescriptionString,
  items: z.array(z.string().min(1)),
  icon: z.custom<LucideIcon>(),
  bulletColor: z
    .enum(['primary', 'accent', 'orange', 'red', 'green', 'blue'])
    .default('primary')
    .optional(),
  className: z.string().optional(),
  variant: z.enum(['default', 'mono']).default('default').optional(),
});

export type BulletListSectionProps = z.infer<typeof bulletListSectionPropsSchema>;

/**
 * Bullet color class mapping
 */
const bulletColorMap = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
} as const;

/**
 * BulletListSection Component (Server Component)
 *
 * Renders a card with icon, title, description, and bulleted list items.
 * Supports different bullet colors and text variants (default or monospace).
 * No React.memo needed - server components don't re-render
 */
export function BulletListSection({
  title,
  description,
  items,
  icon: Icon,
  bulletColor = 'primary',
  className,
  variant = 'default',
}: BulletListSectionProps) {
  // Validate props (production safety)
  const validated = bulletListSectionPropsSchema.parse({
    title,
    description,
    items,
    icon: Icon,
    bulletColor,
    className,
    variant,
  });

  // Don't render if no items
  if (validated.items.length === 0) return null;

  const bulletClass = bulletColorMap[validated.bulletColor ?? 'primary'];
  const textClass = validated.variant === 'mono' ? 'font-mono text-xs' : 'text-sm';

  return (
    <Card className={cn('', validated.className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {validated.title}
        </CardTitle>
        {validated.description && <CardDescription>{validated.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {validated.items.map((item) => (
            <li key={item.slice(0, 50)} className="flex items-start gap-3">
              <div className={cn('h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0', bulletClass)} />
              <span className={cn('leading-relaxed', textClass)}>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
