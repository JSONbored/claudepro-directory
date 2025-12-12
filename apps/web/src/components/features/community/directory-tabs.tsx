'use client';

/**
 * Community Directory Tabs Component
 * 
 * Client component for organizing community directory content with tabs
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@heyclaude/web-runtime/ui';
import type { ReactNode } from 'react';

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
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All Members</TabsTrigger>
        <TabsTrigger value="contributors">Contributors</TabsTrigger>
        <TabsTrigger value="new">New Members</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="space-y-6">
        {allMembers}
      </TabsContent>
      <TabsContent value="contributors" className="space-y-6">
        {contributors}
      </TabsContent>
      <TabsContent value="new" className="space-y-6">
        {newMembers}
      </TabsContent>
    </Tabs>
  );
}
