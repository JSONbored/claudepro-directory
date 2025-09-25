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
  limit = 3, // Changed from 6 to 3 - one row only
  trackingEnabled = true,
  currentTags,
  currentKeywords,
}: SmartRelatedContentProps) {
  // Get current page info from headers
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Get metadata from content index for the current page
  const pageMetadata = await getPageMetadataFromIndex(pathname);

  // Use provided tags/keywords, then index metadata, then parsed as fallback
  const effectiveTags = currentTags || pageMetadata.tags || [];
  const effectiveKeywords = currentKeywords || pageMetadata.keywords || [];

  // Get related content from service
  const response = await relatedContentService.getRelatedContent({
    currentPath: pathname,
    ...(pageMetadata.category && { currentCategory: pageMetadata.category }),
    currentTags: effectiveTags,
    currentKeywords: effectiveKeywords,
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

// Get metadata from content index for SEO pages
async function getPageMetadataFromIndex(pathname: string): Promise<{
  category?: ContentCategory;
  tags?: string[];
  keywords?: string[];
}> {
  try {
    // For SEO guide pages, extract from the content index
    if (pathname.includes('/guides/')) {
      // Load content index
      const contentIndex = await import('@/generated/content-index.json');

      // Extract slug from pathname (e.g., /guides/tutorials/multi-directory-setup -> multi-directory-setup)
      const pathParts = pathname.split('/');
      const category = pathParts[2]; // tutorials, workflows, etc.
      const slug = pathParts[pathParts.length - 1];

      // Find the item in content index
      const item = contentIndex.items.find(
        (item: any) => item.slug === slug && item.category === category
      );

      if (item) {
        return {
          category: item.category as ContentCategory,
          tags: item.tags || [],
          keywords: item.keywords || [],
        };
      }
    }
  } catch (_error) {
    // Silently fail and return parsed fallback
  }

  // Fall back to parsing the URL
  return parseCurrentPage(pathname);
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
