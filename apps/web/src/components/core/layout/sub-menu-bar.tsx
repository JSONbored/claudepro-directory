'use client';

/**
 * Sub-Menu Bar Component
 * 
 * A subtle navigation bar that appears below the main navigation, featuring:
 * - Breadcrumbs on the left
 * - "Explore here" dropdown on the right
 * 
 * Inspired by Claude Code's sub-menu design with very light separators.
 */

import { type Database } from '@heyclaude/database-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import { Breadcrumbs } from '@heyclaude/web-runtime/ui';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { ExploreDropdown } from '@/src/components/content/explore-dropdown';

/**
 * Determines if sub-menu bar should be shown based on pathname
 * 
 * Shows sitewide except on home, auth, and account pages.
 */
function shouldShowSubMenu(pathname: string): boolean {
  // Hide on home, auth, and account pages
  const hidePaths = ['/', '/login', '/signup'];
  if (hidePaths.includes(pathname)) return false;
  
  // Hide on account pages
  if (pathname.startsWith('/account')) return false;
  
  // Show on all other pages (sitewide)
  return true;
}

/**
 * Extracts route information from pathname to determine ExploreDropdown options
 * 
 * Handles:
 * - Content category pages (e.g., /agents, /mcp)
 * - Content detail pages (e.g., /agents/my-agent)
 * - Changelog pages (e.g., /changelog, /changelog/my-entry)
 * - Tools pages (e.g., /tools/config-recommender)
 * - Other pages (no category, but may have sitewide exports)
 */
function extractRouteInfo(pathname: string): {
  category?: Database['public']['Enums']['content_category'];
  slug?: string;
  pageType: 'detail' | 'category' | 'home';
  // Additional route types for ExploreDropdown
  isChangelog?: boolean;
  isTools?: boolean;
} {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return { pageType: 'home' };
  }
  
  const firstSegment = segments[0]!;
  
  // Handle changelog routes
  if (firstSegment === 'changelog') {
    if (segments.length === 1) {
      return { pageType: 'category', isChangelog: true };
    }
    return { 
      pageType: 'detail', 
      isChangelog: true,
      slug: segments[1]!,
    };
  }
  
  // Handle tools routes
  if (firstSegment === 'tools') {
    return { 
      pageType: 'detail',
      isTools: true,
      slug: segments.slice(1).join('/'), // Handle nested paths like config-recommender/results/[id]
    };
  }
  
  // Handle content category routes
  if (isValidCategory(firstSegment)) {
    const category = firstSegment as Database['public']['Enums']['content_category'];
    
    if (segments.length === 1) {
      return { category, pageType: 'category' };
    }
    
    const slug = segments[1]!;
    return { category, slug, pageType: 'detail' };
  }
  
  // Other pages (no category, but may have sitewide functionality)
  return { pageType: 'home' };
}

export function SubMenuBar() {
  const pathname = usePathname();
  
  const { shouldShow, category, slug, pageType, isChangelog, isTools } = useMemo(() => {
    const show = shouldShowSubMenu(pathname);
    if (!show) {
      return { shouldShow: false, pageType: 'home' as const };
    }
    
    const routeInfo = extractRouteInfo(pathname);
    return {
      shouldShow: true,
      category: routeInfo.category,
      slug: routeInfo.slug,
      pageType: routeInfo.pageType,
      isChangelog: routeInfo.isChangelog,
      isTools: routeInfo.isTools,
    };
  }, [pathname]);
  
  if (!shouldShow) {
    return null;
  }
  
  return (
    <div className="border-border/30 bg-background/95 border-b backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-10">
          {/* Breadcrumbs on the left */}
          <div className="flex-1 min-w-0">
            <Breadcrumbs className="mb-0" />
          </div>
          
          {/* Explore here dropdown on the right */}
          <div className="flex-shrink-0 ml-4">
            <ExploreDropdown
              {...(category ? { category } : {})}
              {...(slug ? { slug } : {})}
              pageType={pageType}
              {...(isChangelog ? { isChangelog } : {})}
              {...(isTools ? { isTools } : {})}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
