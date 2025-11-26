'use client';

/**
 * Tabbed Detail Layout - Client component for tabbed content navigation
 * Maintains all content in DOM for SEO while providing tabbed UX
 * Enhanced with mobile swipe gestures for improved touch UX
 */

import type { Database } from '@heyclaude/database-types';
import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import type { TabbedDetailLayoutProps } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@heyclaude/web-runtime/ui';

import { TabSectionRenderer } from './tab-section-renderer';

export function TabbedDetailLayout({ item, config, tabs, sectionData }: TabbedDetailLayoutProps) {
  const pulse = usePulse();
  // Get initial tab from URL hash or default to first tab
  const getInitialTab = useCallback(() => {
    if (tabs.length === 0) return '';
    if (typeof window === 'undefined') return tabs[0]?.id || '';
    const hash = window.location.hash.slice(1);
    const matchingTab = tabs.find((tab) => tab.id === hash);
    return matchingTab ? matchingTab.id : tabs[0]?.id || '';
  }, [tabs]);

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

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
      pulse
        .click({
          category: item.category as Database['public']['Enums']['content_category'],
          slug: item.slug,
          metadata: {
            tab_id: value,
            tab_action: 'switch',
          },
        })
        .catch((error) => {
          logUnhandledPromise('trackInteraction:tabbed-detail', error, {
            tabId: value,
            slug: item.slug,
          });
        });
    },
    [item.category, item.slug, pulse]
  );

  // Mobile swipe gesture navigation
  const goToNextTab = useCallback(() => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const nextTab = tabs[currentIndex + 1];
    if (nextTab) {
      handleTabChange(nextTab.id);
    }
  }, [activeTab, tabs, handleTabChange]);

  const goToPreviousTab = useCallback(() => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const prevTab = tabs[currentIndex - 1];
    if (prevTab) {
      handleTabChange(prevTab.id);
    }
  }, [activeTab, tabs, handleTabChange]);

  // Touch event handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartX.current = touch.clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchEndX.current = touch.clientX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50; // Minimum swipe distance
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) < swipeThreshold) return;

    if (swipeDistance > 0) {
      // Swiped left - go to next tab
      goToNextTab();
    } else {
      // Swiped right - go to previous tab
      goToPreviousTab();
    }
  }, [goToNextTab, goToPreviousTab]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      {/* Sticky tab bar */}
      <div className="-mx-4 sticky top-16 z-10 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
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
                    'relative rounded-none border-transparent border-b-2 px-4 py-3',
                    'data-[state=active]:border-primary data-[state=active]:bg-transparent',
                    'hover:bg-muted/50',
                    // Mobile optimization
                    'text-sm md:text-base',
                    'min-w-20 md:min-w-[100px]'
                  )}
                >
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>

      {/* Tab content - all rendered in DOM for SEO, with swipe gesture support */}
      <div
        className="container mx-auto px-4 py-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="mt-0 space-y-8"
            // Keep in DOM but hide when not active (SEO)
            forceMount={true}
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
