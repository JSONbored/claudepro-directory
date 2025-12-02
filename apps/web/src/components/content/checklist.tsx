'use client';

/**
 * Checklist - Interactive checklist component for prerequisites, testing, security
 * Used in 7+ MDX files across the codebase
 */

import { AlertTriangle, BookOpen, CheckCircle } from '@heyclaude/web-runtime/icons';
import {
  animateDuration,
  between,
  bgColor,
  borderColor,
  cluster,
  flexGrow,
  hoverBg,
  hoverBorder,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  padding,
  radius,
  row,
  size,
  spaceY,
  textColor,
  transition,
  weight,
} from '@heyclaude/web-runtime/design-system';
import type { ChecklistProps } from '@heyclaude/web-runtime/types/component.types';
import React from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';

/**
 * Renders an interactive checklist card with per-item completion toggles and a progress indicator.
 *
 * @param props - ChecklistProps containing checklist configuration and items.
 * @param props.title - Optional title to display; when omitted a default title derived from `props.type` (e.g., "Prerequisites Checklist") is used.
 * @param props.items - Array of checklist items. Each item must include `task` and may include `description`, `priority` (one of `"critical" | "high" | "medium" | "low"`), and `completed`.
 * @param props.description - Optional descriptive text displayed under the header.
 * @param props.type - Checklist type that selects the header icon and default title (`"prerequisites" | "security" | "testing"`).
 * @returns A React element representing the checklist card, its progress bar, and the list of toggleable items.
 *
 * @see Card
 * @see UnifiedBadge
 * @see CardContent
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
    critical: `text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20 ${padding.xTight} ${padding.yHair} rounded`,
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
    <Card itemScope={true} itemType="https://schema.org/ItemList" className="my-8">
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
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={marginBottom.default}>
          <div className={`h-2 w-full ${radius.full} ${bgColor.muted}`}>
            <div
              className={`h-2 ${radius.full} ${bgColor.primary} ${transition.all} ${animateDuration.slow}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className={spaceY.default}>
          {validItems.map((item, index) => (
            <div
              key={`${item.task}-${index}`}
              itemScope={true}
              itemType="https://schema.org/ListItem"
              className={
                `${row.default} ${radius.lg} ${bgColor['muted/30']} ${padding.compact} ${transition.colors} ${hoverBg.muted}`
              }
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className={`${marginTop.micro} ${flexGrow.shrink0}`}
                aria-label={`Mark ${item.task} as ${checkedItems.has(index) ? 'incomplete' : 'complete'}`}
              >
                <div
                  className={`flex ${iconSize.md} ${alignItems.center} ${justify.center} rounded border-2 ${transition.colors} ${
                    checkedItems.has(index)
                      ? `${borderColor.primary} ${bgColor.primary}`
                      : `${borderColor.border} ${hoverBorder.primary}`
                  }`}
                >
                  {checkedItems.has(index) && (
                    <CheckCircle className={`${iconSize.xs} ${textColor.primaryForeground}`} />
                  )}
                </div>
              </button>
              <div className="flex-1">
                <div className={cluster.compact}>
                  <span
                    itemProp="name"
                    className={`${weight.medium} ${checkedItems.has(index) ? `${muted.default} line-through` : ''}`}
                  >
                    {item.task}
                  </span>
                  {item.priority && (
                    <span className={`${weight.medium} ${size.xs} ${priorityColors[item.priority]}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className={`${marginTop.tight} ${muted.sm}`} itemProp="description">
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