'use client';

/**
 * Checklist - Interactive checklist component for prerequisites, testing, security
 * Used in 7+ MDX files across the codebase
 */

import React from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { AlertTriangle, BookOpen, CheckCircle } from '@/src/lib/icons';
import type { ChecklistProps } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function Checklist(props: ChecklistProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, items, description, type } = props;
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
    prerequisites: <BookOpen className={UI_CLASSES.ICON_MD} />,
    security: <AlertTriangle className={UI_CLASSES.ICON_MD} />,
    testing: <CheckCircle className={UI_CLASSES.ICON_MD} />,
  };

  return (
    <Card itemScope itemType="https://schema.org/ItemList" className="my-8">
      <CardHeader>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            {typeIcons[type]}
            {title || `${type.charAt(0).toUpperCase() + type.slice(1)} Checklist`}
          </CardTitle>
          <UnifiedBadge variant="base" style={progress === 100 ? 'default' : 'secondary'}>
            {progress}% Complete
          </UnifiedBadge>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className={'h-2 w-full rounded-full bg-muted'}>
            <div
              className={'h-2 rounded-full bg-primary transition-all duration-300'}
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
              className={
                'flex items-start gap-3 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50'
              }
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className="mt-0.5 flex-shrink-0"
                aria-label={`Mark ${item.task} as ${checkedItems.has(index) ? 'incomplete' : 'complete'}`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                    checkedItems.has(index)
                      ? 'border-primary bg-primary'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {checkedItems.has(index) && (
                    <CheckCircle className={`${UI_CLASSES.ICON_XS} text-primary-foreground`} />
                  )}
                </div>
              </button>
              <div className="flex-1">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <span
                    itemProp="name"
                    className={`font-medium ${checkedItems.has(index) ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {item.task}
                  </span>
                  {item.priority && (
                    <span className={`font-medium text-xs ${priorityColors[item.priority]}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 text-muted-foreground text-sm" itemProp="description">
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
