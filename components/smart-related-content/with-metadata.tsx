/**
 * Wrapper component that provides metadata to SmartRelatedContent
 * Used by MDXRenderer to pass frontmatter data to the component
 */

import type { SmartRelatedContentWithMetadataProps } from '@/lib/schemas';
import { SmartRelatedContent } from './index';

// This will be populated by MDXRenderer
let currentPageMetadata: {
  tags?: string[];
  keywords?: string[];
} = {};

// Function to set metadata (called by MDXRenderer)
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
