/**
 * SmartRelatedContent Server Component
 * Automatically discovers and displays related content with Redis caching
 */

import { headers } from 'next/headers';
import { Suspense } from 'react';
import { relatedContentService } from '@/lib/related-content/service';
import type { ContentCategory, SmartRelatedContentProps } from '@/lib/related-content/types';
import { RelatedCarouselClient } from './carousel';

// Loading skeleton
function RelatedContentSkeleton() {
  return (
    <div className="mt-12 space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Server component that fetches related content
async function RelatedContentServer({
  featured,
  exclude,
  limit = 6,
  trackingEnabled = true,
}: SmartRelatedContentProps) {
  // Get current page info from headers
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Parse current page metadata
  const { category, tags, keywords } = parseCurrentPage(pathname);

  // Get related content from service
  const response = await relatedContentService.getRelatedContent({
    currentPath: pathname,
    ...(category && { currentCategory: category }),
    currentTags: tags || [],
    currentKeywords: keywords || [],
    ...(featured && { featured }),
    ...(exclude && { exclude }),
    limit,
  });

  if (response.items.length === 0) {
    return null;
  }

  return (
    <RelatedCarouselClient
      items={response.items}
      performance={response.performance}
      trackingEnabled={trackingEnabled}
      title="Related Content"
      showTitle={true}
    />
  );
}

// Parse current page to extract metadata
function parseCurrentPage(pathname: string): {
  category?: ContentCategory;
  tags?: string[];
  keywords?: string[];
} {
  // Parse category from URL
  let category: ContentCategory | undefined;

  if (pathname.includes('/agents')) category = 'agents';
  else if (pathname.includes('/mcp')) category = 'mcp';
  else if (pathname.includes('/rules')) category = 'rules';
  else if (pathname.includes('/commands')) category = 'commands';
  else if (pathname.includes('/hooks')) category = 'hooks';
  else if (pathname.includes('/tutorials')) category = 'tutorials';
  else if (pathname.includes('/comparisons')) category = 'comparisons';
  else if (pathname.includes('/workflows')) category = 'workflows';
  else if (pathname.includes('/use-cases')) category = 'use-cases';
  else if (pathname.includes('/troubleshooting')) category = 'troubleshooting';

  // TODO: Extract tags and keywords from page metadata
  // This will be populated from the MDX frontmatter in production

  const result: {
    category?: ContentCategory;
    tags?: string[];
    keywords?: string[];
  } = {};

  if (category) {
    result.category = category;
  }

  return result;
}

// Main export with Suspense boundary
export function SmartRelatedContent(props: SmartRelatedContentProps) {
  return (
    <Suspense fallback={<RelatedContentSkeleton />}>
      <RelatedContentServer {...props} />
    </Suspense>
  );
}
