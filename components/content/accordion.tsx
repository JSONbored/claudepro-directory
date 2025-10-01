'use client';

/**
 * Accordion - Collapsible content sections with Schema.org FAQPage support
 * Used in 27+ MDX files across the codebase
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type AccordionProps, accordionPropsSchema } from '@/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

export function Accordion(props: AccordionProps) {
  const validated = accordionPropsSchema.parse(props);
  const { items, title, description, allowMultiple } = validated;
  const validItems = items;
  const [openItems, setOpenItems] = React.useState<Set<number>>(
    new Set(
      validItems.map((item, index) => (item.defaultOpen ? index : -1)).filter((i) => i !== -1)
    )
  );

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (openItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      if (!allowMultiple) {
        newOpenItems.clear();
      }
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section itemScope itemType="https://schema.org/FAQPage" className="my-8">
      {title && (
        <div className={UI_CLASSES.MB_6}>
          <h3 className={`text-xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`} itemProp="name">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {validItems.map((item, index) => (
          <Card
            key={`accordion-item-${index}-${item.title}`}
            itemScope
            itemType="https://schema.org/Question"
            className="border border-border"
          >
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className={`${UI_CLASSES.W_FULL} text-left`}
              aria-expanded={openItems.has(index)}
            >
              <CardHeader className={`hover:bg-muted/30 ${UI_CLASSES.TRANSITION_COLORS}`}>
                <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} itemProp="name">
                  <span>{item.title}</span>
                  <div className="ml-4 flex-shrink-0">
                    {openItems.has(index) ? (
                      <div className="w-4 h-4 text-muted-foreground">−</div>
                    ) : (
                      <div className="w-4 h-4 text-muted-foreground">+</div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
            </button>

            {openItems.has(index) && (
              <CardContent className="pt-0" itemScope itemType="https://schema.org/Answer">
                <div itemProp="text">{item.content}</div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
