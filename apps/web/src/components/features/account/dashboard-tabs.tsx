'use client';

/**
 * Dashboard Tabs Component
 * 
 * Client component for organizing dashboard content with tabs
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@heyclaude/web-runtime/ui';
import type { ReactNode } from 'react';

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
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-6">
        {overview}
      </TabsContent>
      <TabsContent value="bookmarks" className="space-y-6">
        {bookmarks}
      </TabsContent>
      <TabsContent value="recommendations" className="space-y-6">
        {recommendations}
      </TabsContent>
    </Tabs>
  );
}
