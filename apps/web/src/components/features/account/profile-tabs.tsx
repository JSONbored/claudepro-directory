'use client';

/**
 * Profile Tabs Component
 * 
 * Client component for organizing user profile content with tabs
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@heyclaude/web-runtime/ui';
import type { ReactNode } from 'react';

export interface ProfileTabsProps {
  /**
   * Overview tab content (stats + all content)
   */
  overview: ReactNode;

  /**
   * Collections tab content
   */
  collections: ReactNode;

  /**
   * Contributions tab content
   */
  contributions: ReactNode;
}

/**
 * Tabbed profile content organizer
 */
export function ProfileTabs({
  overview,
  collections,
  contributions,
}: ProfileTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="collections">Collections</TabsTrigger>
        <TabsTrigger value="contributions">Contributions</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-6">
        {overview}
      </TabsContent>
      <TabsContent value="collections" className="space-y-6">
        {collections}
      </TabsContent>
      <TabsContent value="contributions" className="space-y-6">
        {contributions}
      </TabsContent>
    </Tabs>
  );
}
