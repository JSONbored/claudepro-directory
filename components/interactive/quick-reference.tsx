'use client';

/**
 * QuickReference - Reference table for commands, shortcuts, and key-value pairs
 * Used in 17+ MDX files across the codebase
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from '@/lib/icons';
import { type QuickReferenceProps, quickReferencePropsSchema } from '@/lib/schemas/shared.schema';

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
        <CardTitle className="flex items-center gap-2">
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
              className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 bg-card/50 rounded-lg border"
            >
              <div className="sm:w-1/3">
                <dt itemProp="name" className="font-medium text-sm text-muted-foreground">
                  {item.label}
                </dt>
              </div>
              <div className="sm:w-2/3">
                <dd itemProp="value" className="font-semibold text-foreground mb-1">
                  {item.value}
                </dd>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
