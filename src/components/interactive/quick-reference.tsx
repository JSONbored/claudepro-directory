'use client';

/**
 * QuickReference - Reference table for commands, shortcuts, and key-value pairs
 * Used in 17+ MDX files across the codebase
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { BookOpen } from '@/src/lib/icons';
import {
  type QuickReferenceProps,
  quickReferencePropsSchema,
} from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function QuickReference(props: QuickReferenceProps) {
  const validated = quickReferencePropsSchema.parse(props);
  const { title, description, items, columns } = validated;
  const validItems = items;

  if (validItems.length === 0) {
    return null;
  }

  return (
    <Card
      itemScope
      itemType="https://schema.org/Table"
      className="my-8 border-l-4 border-accent bg-accent/5"
    >
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <BookOpen className="h-5 w-5 text-accent-foreground" />
          {title}
        </CardTitle>
        {description && <CardDescription itemProp="description">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
          {validItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              itemScope
              itemType="https://schema.org/PropertyValue"
              className={
                'flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 bg-card/50 rounded-lg border'
              }
            >
              <div className="sm:w-1/3">
                <dt itemProp="name" className={`font-medium ${UI_CLASSES.TEXT_SM_MUTED}`}>
                  {item.label}
                </dt>
              </div>
              <div className="sm:w-2/3">
                <dd itemProp="value" className="font-semibold text-foreground mb-1">
                  {item.value}
                </dd>
                {item.description && <p className={UI_CLASSES.TEXT_SM_MUTED}>{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
