'use client';

/**
 * Dashboard Tabs Component
 * 
 * Client component for organizing dashboard content with tabs
 */

import { Tabs, TabsList, TabsTrigger, TabsContent, LayoutGroup } from '@heyclaude/web-runtime/ui';
import type { ReactNode } from 'react';
import { marginBottom, spaceY } from "@heyclaude/web-runtime/design-system";

export interface DashboardTabsProps {
  /**
   * Overview tab content (stats, quick actions)
   */
  overview: ReactNode;

  /**
   * Bookmarks tab content
   */
  bookmarks: ReactNode;

  /**
   * Recommendations tab content
   */
  recommendations: ReactNode;
}

/**
 * Tabbed dashboard content organizer
 */
export function DashboardTabs({
  overview,
  bookmarks,
  recommendations,
}: DashboardTabsProps) {
  return (
    <LayoutGroup>
      <Tabs defaultValue="overview" className={`w-full`}>
        <TabsList className={`${marginBottom.comfortable}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className={`${spaceY.relaxed}`}>
          {overview}
        </TabsContent>
        <TabsContent value="bookmarks" className={`${spaceY.relaxed}`}>
          {bookmarks}
        </TabsContent>
        <TabsContent value="recommendations" className={`${spaceY.relaxed}`}>
          {recommendations}
        </TabsContent>
      </Tabs>
    </LayoutGroup>
  );
}
