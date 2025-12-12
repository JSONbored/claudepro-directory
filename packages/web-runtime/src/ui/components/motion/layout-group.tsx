/**
 * LayoutGroup Component
 * 
 * Groups components for coordinated layout animations. Components animate together
 * even if rendered separately. Useful for accordions, tabs, and lists.
 * 
 * @module web-runtime/ui/components/motion/layout-group
 * 
 * @example
 * ```tsx
 * function TabComponent({ tabs, activeTab }) {
 *   return (
 *     <LayoutGroup>
 *       {tabs.map((tab) => (
 *         <Tab key={tab.id} isSelected={activeTab === tab.id} />
 *       ))}
 *       {activeTab && (
 *         <motion.div layoutId="underline" className="tab-underline" />
 *       )}
 *     </LayoutGroup>
 *   );
 * }
 * ```
 */

'use client';

import { LayoutGroup as MotionLayoutGroup } from 'motion/react';
import type { ReactNode } from 'react';

export interface LayoutGroupProps {
  /**
   * Child components that should coordinate their layout animations
   */
  children: ReactNode;

  /**
   * Optional ID to namespace layoutId props (useful for multiple groups)
   */
  id?: string;
}

/**
 * Component that groups motion components for coordinated layout animations.
 * 
 * Components with `layout` prop or shared `layoutId` will animate together
 * even if they're rendered in different parts of the component tree.
 * 
 * @param props - LayoutGroup props
 * @returns LayoutGroup wrapper component
 * 
 * @see https://motion.dev/docs/react/layout-group
 */
export function LayoutGroup({
  children,
  id,
  ...props
}: LayoutGroupProps) {
  return (
    <MotionLayoutGroup {...(id ? { id } : {})} {...props}>
      {children}
    </MotionLayoutGroup>
  );
}
