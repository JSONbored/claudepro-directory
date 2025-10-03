'use client';

/**
 * ContentTabs - Interactive tabs for content organization
 * Used in 23+ MDX files across the codebase
 * Leverages existing shadcn/ui tabs with custom styling
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { type ContentTabsProps, contentTabsPropsSchema } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
        <div className={UI_CLASSES.MB_6}>
          <h3
            className={`${UI_CLASSES.TEXT_XL} ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`}
            itemProp="name"
          >
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue={firstValue} className={UI_CLASSES.W_FULL}>
        <TabsList
          className={`${UI_CLASSES.GRID} ${UI_CLASSES.W_FULL} grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 h-auto p-1`}
        >
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
            className={UI_CLASSES.MT_4}
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
