'use client';

/**
 * Tabbed Detail Layout - Client component for tabbed content navigation
 * Maintains all content in DOM for SEO while providing tabbed UX
 */

import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/ui/tabs';
import { TabSectionRenderer } from './tab-section-renderer';
import { trackInteraction } from '@/src/lib/edge/client';
import { cn } from '@/src/lib/utils';
import type { TabbedDetailLayoutProps } from '@/src/lib/types/detail-tabs.types';

export function TabbedDetailLayout({
  item,
  config,
  tabs,
  sectionData,
}: TabbedDetailLayoutProps) {
  // Get initial tab from URL hash or default to first tab
  const getInitialTab = useCallback(() => {
    if (tabs.length === 0) return '';
    if (typeof window === 'undefined') return tabs[0]?.id || '';
    const hash = window.location.hash.slice(1);
    const matchingTab = tabs.find((tab) => tab.id === hash);
    return matchingTab ? matchingTab.id : tabs[0]?.id || '';
  }, [tabs]);

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  // Sync tab state with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const matchingTab = tabs.find((tab) => tab.id === hash);
      if (matchingTab) {
        setActiveTab(matchingTab.id);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [tabs]);

  // Handle tab change with analytics tracking
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);

      // Update URL hash without scrolling
      if (typeof window !== 'undefined') {
        const newUrl = `${window.location.pathname}${window.location.search}#${value}`;
        window.history.replaceState(null, '', newUrl);
      }

      // Track tab switch
      trackInteraction({
        interaction_type: 'click',
        content_type: item.category,
        content_slug: item.slug,
        metadata: {
          tab_id: value,
          tab_action: 'switch',
        },
      }).catch(() => {
        // Analytics failure should not affect UX
      });
    },
    [item.category, item.slug]
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      {/* Sticky tab bar */}
      <div className="sticky top-16 z-10 -mx-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto">
          <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0">
            {tabs.map((tab) => {
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              const label = isMobile && tab.mobileLabel ? tab.mobileLabel : tab.label;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'relative rounded-none border-b-2 border-transparent px-4 py-3',
                    'data-[state=active]:border-primary data-[state=active]:bg-transparent',
                    'hover:bg-muted/50',
                    // Mobile optimization
                    'text-sm md:text-base',
                    'min-w-[80px] md:min-w-[100px]'
                  )}
                >
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>

      {/* Tab content - all rendered in DOM for SEO */}
      <div className="container mx-auto px-4 py-8">
        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="mt-0 space-y-8"
            // Keep in DOM but hide when not active (SEO)
            forceMount
            hidden={activeTab !== tab.id}
          >
            {tab.sections.map((sectionId) => (
              <TabSectionRenderer
                key={sectionId}
                sectionId={sectionId}
                item={item}
                sectionData={sectionData}
                config={{
                  typeName: config.typeName,
                  sections: config.sections,
                }}
              />
            ))}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
