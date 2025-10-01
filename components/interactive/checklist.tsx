'use client';

/**
 * Checklist - Interactive checklist component for prerequisites, testing, security
 * Used in 7+ MDX files across the codebase
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, BookOpen, CheckCircle } from '@/lib/icons';
import { type ChecklistProps, checklistPropsSchema } from '@/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

export function Checklist(props: ChecklistProps) {
  const validated = checklistPropsSchema.parse(props);
  const { title, items, description, type } = validated;
  const validItems = items;

  const [checkedItems, setCheckedItems] = React.useState<Set<number>>(
    new Set(validItems.map((item, index) => (item.completed ? index : -1)).filter((i) => i !== -1))
  );

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (checkedItems.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const progress =
    validItems.length > 0 ? Math.round((checkedItems.size / validItems.length) * 100) : 0;

  const priorityColors = {
    critical: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded',
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-green-600 dark:text-green-400',
  };

  const typeIcons = {
    prerequisites: <BookOpen className="h-5 w-5" />,
    security: <AlertTriangle className="h-5 w-5" />,
    testing: <CheckCircle className="h-5 w-5" />,
  };

  return (
    <Card itemScope itemType="https://schema.org/ItemList" className="my-8">
      <CardHeader>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            {typeIcons[type]}
            {title || `${type.charAt(0).toUpperCase() + type.slice(1)} Checklist`}
          </CardTitle>
          <Badge variant={progress === 100 ? 'default' : 'secondary'}>{progress}% Complete</Badge>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={UI_CLASSES.MB_4}>
          <div className={`w-full bg-muted ${UI_CLASSES.ROUNDED_FULL} h-2`}>
            <div
              className={`bg-primary h-2 ${UI_CLASSES.ROUNDED_FULL} transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="space-y-3">
          {validItems.map((item, index) => (
            <div
              key={`${item.task}-${index}`}
              itemScope
              itemType="https://schema.org/ListItem"
              className={`flex ${UI_CLASSES.ITEMS_START} gap-3 p-3 ${UI_CLASSES.ROUNDED_LG} bg-muted/30 ${UI_CLASSES.HOVER_BG_MUTED_50} ${UI_CLASSES.TRANSITION_COLORS}`}
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className="flex-shrink-0 mt-0.5"
                aria-label={`Mark ${item.task} as ${checkedItems.has(index) ? 'incomplete' : 'complete'}`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.TRANSITION_COLORS} ${
                    checkedItems.has(index)
                      ? 'bg-primary border-primary'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {checkedItems.has(index) && (
                    <CheckCircle className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
              </button>
              <div className={UI_CLASSES.FLEX_1}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <span
                    itemProp="name"
                    className={`font-medium ${checkedItems.has(index) ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {item.task}
                  </span>
                  {item.priority && (
                    <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1" itemProp="description">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
