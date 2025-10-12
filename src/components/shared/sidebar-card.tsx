/**
 * SidebarCard - Configuration-Driven Sidebar Card Component
 *
 * Consolidates 10 sidebar card components (818 LOC) into single reusable pattern.
 * Eliminates duplication across submit and detail page sidebars.
 *
 * Replaces:
 * - submit/sidebar/tips-card.tsx (37 LOC)
 * - submit/sidebar/submit-stats-card.tsx (55 LOC)
 * - submit/sidebar/recent-submissions-card.tsx (85 LOC)
 * - submit/sidebar/top-contributors-card.tsx (56 LOC)
 * - unified-detail-page/sidebar/trending-guides-card.tsx (100 LOC)
 * - unified-detail-page/sidebar/sidebar-resources-card.tsx (81 LOC)
 * - unified-detail-page/sidebar/sidebar-related-items-card.tsx (75 LOC)
 * - unified-detail-page/sidebar/sidebar-details-card.tsx (143 LOC)
 * - unified-detail-page/sidebar/recent-guides-card.tsx (83 LOC)
 * - unified-detail-page/sidebar/category-navigation-card.tsx (103 LOC)
 *
 * Architecture:
 * - Composition over duplication
 * - Render props for content flexibility
 * - Type-safe configuration
 * - Tree-shakeable imports
 *
 * @module components/shared/sidebar-card
 */

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

/**
 * Props for SidebarCard component
 */
export interface SidebarCardProps {
  /**
   * Card title (supports string or ReactNode for icons/emojis)
   */
  title: ReactNode;

  /**
   * Card content to render
   */
  children: ReactNode;

  /**
   * Optional custom className for Card wrapper
   * @example "bg-blue-500/5 border-blue-500/20"
   */
  className?: string;

  /**
   * Optional custom className for CardTitle
   */
  titleClassName?: string;

  /**
   * Optional custom className for CardHeader
   */
  headerClassName?: string;

  /**
   * Optional custom className for CardContent
   */
  contentClassName?: string;

  /**
   * Hide the card if condition is false
   * @default true
   */
  show?: boolean;
}

/**
 * SidebarCard Component
 *
 * Reusable sidebar card with configurable title and content.
 * Replaces 10 duplicate sidebar card components.
 *
 * @param props - Component props
 * @returns Configured sidebar card or null if hidden
 *
 * @example
 * // Tips card
 * <SidebarCard
 *   title={<><Lightbulb className="h-4 w-4" /> Tips</>}
 *   className="bg-blue-500/5"
 * >
 *   <ul>{tips.map(...)}</ul>
 * </SidebarCard>
 *
 * @example
 * // Resources card
 * <SidebarCard title="Resources" show={hasLinks}>
 *   <Button>GitHub</Button>
 *   <Button>Docs</Button>
 * </SidebarCard>
 */
export function SidebarCard({
  title,
  children,
  className,
  titleClassName,
  headerClassName,
  contentClassName,
  show = true,
}: SidebarCardProps) {
  if (!show) return null;

  return (
    <Card className={className}>
      <CardHeader className={headerClassName}>
        <CardTitle className={titleClassName}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
