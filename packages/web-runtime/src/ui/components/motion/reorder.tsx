/**
 * Reorder Components
 * 
 * Drag-to-reorder list components for creating reorderable lists like tabs, todo items,
 * or collection items. Handles layout animations automatically.
 * 
 * @module web-runtime/ui/components/motion/reorder
 * 
 * @example
 * ```tsx
 * function ReorderableList({ items, onReorder }) {
 *   return (
 *     <Reorder.Group axis="y" values={items} onReorder={onReorder}>
 *       {items.map((item) => (
 *         <Reorder.Item key={item.id} value={item}>
 *           {item.content}
 *         </Reorder.Item>
 *       ))}
 *     </Reorder.Group>
 *   );
 * }
 * ```
 */

'use client';

import { Reorder as MotionReorder } from 'motion/react';
import type { ReactNode } from 'react';

export interface ReorderGroupProps {
  /**
   * Child Reorder.Item components
   */
  children: ReactNode;

  /**
   * The values array that will be reordered
   */
  values: unknown[];

  /**
   * Callback fired when items are reordered
   */
  onReorder: (newOrder: unknown[]) => void;

  /**
   * Direction of reorder detection
   * @default "y"
   */
  axis?: 'x' | 'y';

  /**
   * Underlying element to render as
   * @default "ul"
   */
  as?: 'ul' | 'ol' | 'div';

  /**
   * Whether the container is scrollable (for scrollable lists)
   * @default false
   */
  layoutScroll?: boolean;

  /**
   * Additional className
   */
  className?: string;
}

export interface ReorderItemProps {
  /**
   * Child content
   */
  children: ReactNode;

  /**
   * The value this item represents (must match an item in the values array)
   */
  value: unknown;

  /**
   * Underlying element to render as
   * @default "li"
   */
  as?: 'li' | 'div';

  /**
   * Additional className
   */
  className?: string;

  /**
   * Whether to disable automatic drag listener (use with dragControls)
   * @default false
   */
  dragListener?: boolean;
}

/**
 * Group component for reorderable lists.
 * 
 * Wraps Reorder.Item components and manages the reordering state.
 * 
 * @see https://motion.dev/docs/react/reorder
 */
export function ReorderGroup({
  children,
  values,
  onReorder,
  axis = 'y',
  as = 'ul',
  layoutScroll = false,
  className,
  ...props
}: ReorderGroupProps) {
  return (
    <MotionReorder.Group
      axis={axis}
      values={values}
      onReorder={onReorder}
      as={as}
      layoutScroll={layoutScroll}
      className={className}
      {...props}
    >
      {children}
    </MotionReorder.Group>
  );
}

/**
 * Item component for reorderable lists.
 * 
 * Represents a single item in a reorderable list. Must be a child of ReorderGroup.
 * 
 * @see https://motion.dev/docs/react/reorder
 */
export function ReorderItem({
  children,
  value,
  as = 'li',
  className,
  dragListener = true,
  ...props
}: ReorderItemProps) {
  return (
    <MotionReorder.Item
      value={value}
      as={as}
      className={className}
      dragListener={dragListener}
      {...props}
    >
      {children}
    </MotionReorder.Item>
  );
}

/**
 * Reorder components namespace
 */
export const Reorder = {
  Group: ReorderGroup,
  Item: ReorderItem,
};
