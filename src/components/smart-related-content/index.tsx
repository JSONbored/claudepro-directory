/**
 * SmartRelatedContent - Simplified Server Component
 * Displays related content with clean, streamlined architecture
 */

import { headers } from 'next/headers';
import { Suspense } from 'react';
import { logger } from '@/src/lib/logger';
import { relatedContentService } from '@/src/lib/related-content/service';
import type { SmartRelatedContentProps } from '@/src/lib/schemas/related-content.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { RelatedCarouselClient } from './carousel';

// Loading skeleton
function RelatedContentSkeleton() {
  return (
    <div className="mt-12 space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-48 bg-muted animate-pulse ${UI_CLASSES.ROUNDED_LG}`} />
        ))}
      </div>
    </div>
  );
}

// Server component that fetches related content
async function RelatedContentServer({
  featured = [],
  exclude = [],
  limit = 3,
  trackingEnabled = true,
  currentTags = [],
  currentKeywords = [],
  pathname: providedPathname,
  title = 'Related Content',
  showTitle = true,
}: SmartRelatedContentProps) {
  // Get pathname from props or headers
  const headersList = await headers();
  const pathname = providedPathname || headersList.get('x-pathname') || '';

  // Extract category from pathname
  const getCategory = (path: string): string => {
    if (path.includes('/agents')) return 'agents';
    if (path.includes('/mcp')) return 'mcp';
    if (path.includes('/rules')) return 'rules';
    if (path.includes('/commands')) return 'commands';
    if (path.includes('/hooks')) return 'hooks';
    if (path.includes('/tutorials')) return 'tutorials';
    if (path.includes('/comparisons')) return 'comparisons';
    if (path.includes('/workflows')) return 'workflows';
    if (path.includes('/use-cases')) return 'use-cases';
    if (path.includes('/troubleshooting')) return 'troubleshooting';
    return 'tutorials';
  };

  try {
    // Get related content from simplified service
    const response = await relatedContentService.getRelatedContent({
      currentPath: pathname,
      currentCategory: getCategory(pathname),
      currentTags,
      currentKeywords,
      featured,
      exclude,
      limit,
    });

    // Return early if no items
    if (response.items.length === 0) {
      return null;
    }

    // Transform service response to match RelatedContentItem interface
    const transformedItems = response.items.map((item) => ({
      ...item,
      // Map service response fields to RelatedContentItem fields
      author: 'Community', // Default author since not provided by service
      dateAdded: new Date().toISOString(), // Default date since not provided by service
      tags: [] as const, // Default empty tags since not provided by service
      source: 'community' as const, // Default source since not provided by service
    }));

    return (
      <RelatedCarouselClient
        items={transformedItems}
        performance={response.performance}
        trackingEnabled={trackingEnabled}
        title={title}
        showTitle={showTitle}
        autoPlay={false}
        autoPlayInterval={5000}
        showDots={true}
        showArrows={true}
      />
    );
  } catch (error) {
    // Log error properly through logger utility
    logger.error(
      'SmartRelatedContent rendering failed',
      error instanceof Error ? error : new Error(String(error)),
      { component: 'SmartRelatedContent', pathname }
    );
    return null;
  }
}

// Main export with Suspense boundary
export function SmartRelatedContent(props: SmartRelatedContentProps) {
  return (
    <Suspense fallback={<RelatedContentSkeleton />}>
      <RelatedContentServer {...props} />
    </Suspense>
  );
}
