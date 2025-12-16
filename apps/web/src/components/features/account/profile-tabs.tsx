'use client';

/**
 * Profile Tabs Component
 * 
 * Client component for organizing user profile content with tabs
 */

import { Tabs, TabsList, TabsTrigger, TabsContent, LayoutGroup } from '@heyclaude/web-runtime/ui';
import type { ReactNode } from 'react';
import { marginBottom, spaceY } from "@heyclaude/web-runtime/design-system";

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
    <LayoutGroup>
      <Tabs defaultValue="overview" className={`w-full`}>
        <TabsList className={`${marginBottom.comfortable}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className={`${spaceY.relaxed}`}>
          {overview}
        </TabsContent>
        <TabsContent value="collections" className={`${spaceY.relaxed}`}>
          {collections}
        </TabsContent>
        <TabsContent value="contributions" className={`${spaceY.relaxed}`}>
          {contributions}
        </TabsContent>
      </Tabs>
    </LayoutGroup>
  );
}
