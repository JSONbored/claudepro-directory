/**
 * Usage Hints Helper
 *
 * Provides contextual usage hints for AI agents based on tool responses.
 * Helps AI agents understand how to use the data they receive.
 */

/**
 * Get usage hints for a content item
 *
 * @param category - Content category
 * @param slug - Content slug
 * @returns Array of usage hint strings
 */
export function getContentUsageHints(category: string, slug: string): string[] {
  return [
    `Use downloadContentForPlatform to get this content formatted for your platform (Claude Code, Cursor, Codex)`,
    `Use getRelatedContent with category="${category}" and slug="${slug}" to find similar content`,
    `Check the tags in the metadata to discover related content with getContentByTag`,
    `Use searchContent to find more content in the "${category}" category`,
  ];
}

/**
 * Get usage hints for search results
 *
 * @param hasResults - Whether search returned results
 * @param category - Optional category filter
 * @returns Array of usage hint strings
 */
export function getSearchUsageHints(hasResults: boolean, category?: string): string[] {
  if (!hasResults) {
    return [
      'Try broadening your search query',
      'Use getSearchSuggestions to see popular searches',
      'Use getSearchFacets to see available filters',
      category
        ? `Try searching without the category filter`
        : 'Try adding a category filter with listCategories',
    ];
  }

  return [
    'Use getContentDetail to get full details for any result',
    'Use downloadContentForPlatform to get formatted versions',
    'Use getRelatedContent to find similar items',
    'Check the tags to refine your search with getContentByTag',
  ];
}

/**
 * Get usage hints for category listing
 *
 * @returns Array of usage hint strings
 */
export function getCategoryUsageHints(): string[] {
  return [
    'Use searchContent with a category filter to browse content',
    'Use getTrending to see popular content in a category',
    'Use getRecent to see newly added content',
    'Use getCategoryConfigs for detailed category configuration',
  ];
}
