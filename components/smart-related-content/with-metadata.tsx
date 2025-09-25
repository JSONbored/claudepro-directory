/**
 * Wrapper component that provides metadata to SmartRelatedContent
 * Used by MDXRenderer to pass frontmatter data to the component
 */

import type { SmartRelatedContentProps } from '@/lib/related-content/types';
import { SmartRelatedContent } from './index';

interface SmartRelatedContentWithMetadataProps
  extends Omit<SmartRelatedContentProps, 'currentTags' | 'currentKeywords'> {
  // These will be provided by the wrapper
}

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
export function SmartRelatedContentWithMetadata(props: SmartRelatedContentWithMetadataProps) {
  return (
    <SmartRelatedContent
      {...props}
      currentTags={currentPageMetadata.tags || []}
      currentKeywords={currentPageMetadata.keywords || []}
    />
  );
}
