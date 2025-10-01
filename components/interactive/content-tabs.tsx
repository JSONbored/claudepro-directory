'use client';

/**
 * ContentTabs - Interactive tabs for content organization
 * Used in 23+ MDX files across the codebase
 * Leverages existing shadcn/ui tabs with custom styling
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type ContentTabsProps, contentTabsPropsSchema } from '@/lib/schemas/shared.schema';

export function ContentTabs(props: ContentTabsProps) {
  const validated = contentTabsPropsSchema.parse(props);
  const { items, title, description, defaultValue } = validated;
  const validItems = items;

  if (validItems.length === 0) {
    return null;
  }

  const firstValue = defaultValue || validItems[0]?.value || '';

  return (
    <section itemScope itemType="https://schema.org/ItemList" className="my-8">
      {title && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2" itemProp="name">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue={firstValue} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 h-auto p-1">
          {validItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {validItems.map((item) => (
          <TabsContent
            key={item.value}
            value={item.value}
            className="mt-6"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <div
              itemProp="description"
              className="prose prose-neutral dark:prose-invert max-w-none"
            >
              {item.content}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
