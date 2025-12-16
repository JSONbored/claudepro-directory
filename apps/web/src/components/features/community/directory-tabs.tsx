'use client';

/**
 * Community Directory Tabs Component
 * 
 * Client component for organizing community directory content with tabs
 */

import { Tabs, TabsList, TabsTrigger, TabsContent, LayoutGroup } from '@heyclaude/web-runtime/ui';
import type { ReactNode } from 'react';
import { marginBottom, spaceY } from "@heyclaude/web-runtime/design-system";

export interface DirectoryTabsProps {
  /**
   * All members tab content
   */
  allMembers: ReactNode;

  /**
   * Contributors tab content
   */
  contributors: ReactNode;

  /**
   * New members tab content
   */
  newMembers: ReactNode;
}

/**
 * Tabbed community directory content organizer
 */
export function DirectoryTabs({
  allMembers,
  contributors,
  newMembers,
}: DirectoryTabsProps) {
  return (
    <LayoutGroup>
      <Tabs defaultValue="all" className={`w-full`}>
        <TabsList className={`${marginBottom.comfortable}`}>
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="new">New Members</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className={`${spaceY.relaxed}`}>
          {allMembers}
        </TabsContent>
        <TabsContent value="contributors" className={`${spaceY.relaxed}`}>
          {contributors}
        </TabsContent>
        <TabsContent value="new" className={`${spaceY.relaxed}`}>
          {newMembers}
        </TabsContent>
      </Tabs>
    </LayoutGroup>
  );
}
