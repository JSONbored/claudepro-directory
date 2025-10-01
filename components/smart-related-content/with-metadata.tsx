/**
 * Wrapper component that provides metadata to SmartRelatedContent
 * Used by MDXRenderer to pass frontmatter data to the component
 *
 * NOTE: Module-level state is safe in Next.js App Router server components
 * Each request gets its own execution context, so there's no cross-request
 * state leakage. This pattern is used to pass metadata through MDX's
 * component tree without prop drilling.
 */

import type { SmartRelatedContentWithMetadataProps } from '@/lib/schemas/related-content.schema';
import { SmartRelatedContent } from './index';

/**
 * Global metadata store (safe in server components)
 * Populated by MDXRenderer before rendering MDX content
 */
let currentPageMetadata: {
  tags?: string[];
  keywords?: string[];
} = {};

/**
 * Set metadata for current request
 * Called by MDXRenderer before rendering MDX content
 */
export function setPageMetadata(metadata: { tags?: string[]; keywords?: string[] }) {
  currentPageMetadata = metadata;
}

// Wrapper component that injects metadata
export function SmartRelatedContentWithMetadata({
  pathname,
  ...props
}: SmartRelatedContentWithMetadataProps) {
  return (
    <SmartRelatedContent
      {...props}
      currentTags={currentPageMetadata.tags || []}
      currentKeywords={currentPageMetadata.keywords || []}
      pathname={pathname || ''}
    />
  );
}
