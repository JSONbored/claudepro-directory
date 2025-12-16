'use client';

/**
 * Checklist - Interactive checklist component for prerequisites, testing, security
 * Used in 7+ MDX files across the codebase
 */

import { iconSize, between, cluster, marginY, marginBottom, spaceY, padding, gap, marginTop, transition, paddingX, paddingY } from '@heyclaude/web-runtime/design-system';
import { AlertTriangle, BookOpen, CheckCircle } from '@heyclaude/web-runtime/icons';
import { type ChecklistProps } from '@heyclaude/web-runtime/types/component.types';
import {
  UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from '@heyclaude/web-runtime/ui';
import React from 'react';

/**
 * Render an interactive checklist UI that displays tasks, a progress indicator, optional description, and toggleable completion state.
 *
 * @param props - Component props (see ChecklistProps) containing `title`, `items`, `description`, and `type`.
 * @returns The rendered Checklist React element showing progress and item controls.
 *
 * @see ChecklistProps
 * @see UnifiedBadge
 * @see Card
 */
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
    critical: cn('text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20', paddingX.compact, paddingY.micro, 'rounded'),
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-green-600 dark:text-green-400',
  };

  const typeIcons = {
    prerequisites: <BookOpen className={iconSize.md} />,
    security: <AlertTriangle className={iconSize.md} />,
    testing: <CheckCircle className={iconSize.md} />,
  };

  return (
    <Card itemScope itemType="https://schema.org/ItemList" className={`${marginY.relaxed}`}>
      <CardHeader>
        <div className={between.center}>
          <CardTitle className={cluster.compact}>
            {typeIcons[type]}
            {title || `${type.charAt(0).toUpperCase() + type.slice(1)} Checklist`}
          </CardTitle>
          <UnifiedBadge variant="base" style={progress === 100 ? 'default' : 'secondary'}>
            {progress}% Complete
          </UnifiedBadge>
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className={`${marginBottom.default}`}>
          <div className="bg-muted h-2 w-full rounded-full">
            <div
              className={cn("bg-primary h-2 rounded-full", transition.default)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className={`${spaceY.default}`}>
          {validItems.map((item, index) => (
            <div
              key={`${item.task}-${index}`}
              itemScope
              itemType="https://schema.org/ListItem"
              className={`bg-muted/30 hover:bg-muted/50 flex items-start ${gap.compact} rounded-lg ${padding.compact} transition-colors`}
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className={cn(marginTop['4.5'], 'shrink-0')}
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
                    <CheckCircle className={`${iconSize.xs} text-primary-foreground`} />
                  )}
                </div>
              </button>
              <div className="flex-1">
                <div className={cluster.compact}>
                  <span
                    itemProp="name"
                    className={`font-medium ${checkedItems.has(index) ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {item.task}
                  </span>
                  {item.priority ? (
                    <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  ) : null}
                </div>
                {item.description ? (
                  <p className={`text-muted-foreground ${marginTop.tight} text-sm`} itemProp="description">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}