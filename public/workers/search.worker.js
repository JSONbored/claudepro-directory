/**
 * Search Web Worker
 *
 * Offloads fuzzy search computation from the main thread to prevent UI blocking.
 * Uses fuzzysort for high-performance fuzzy searching.
 *
 * Benefits:
 * - Main thread stays responsive during search
 * - 60fps UI maintained even with large datasets
 * - Progressive enhancement (falls back to main thread if workers not supported)
 *
 * Communication Protocol:
 * - Message Type: { type: 'search', query, items, options }
 * - Response Type: { type: 'results', results } | { type: 'error', error }
 */

// Import fuzzysort from CDN for Web Worker compatibility
importScripts('https://cdn.jsdelivr.net/npm/fuzzysort@3.0.2/fuzzysort.min.js');

// Cache for prepared items (per session)
const preparedCache = new Map();

/**
 * Prepare items for fast searching
 */
function prepareItems(items) {
  return items.map((item, index) => {
    const cacheKey = `${item.category}:${item.slug || item.name || index}`;
    
    // Check cache first
    if (preparedCache.has(cacheKey)) {
      return preparedCache.get(cacheKey);
    }

    // Prepare all searchable fields
    const prepared = {
      item,
      titlePrepared: item.title ? fuzzysort.prepare(item.title) : undefined,
      namePrepared: item.name ? fuzzysort.prepare(item.name) : undefined,
      descriptionPrepared: item.description ? fuzzysort.prepare(item.description) : undefined,
      tagsPrepared: item.tags?.length ? fuzzysort.prepare(item.tags.join(' ')) : undefined,
      categoryPrepared: item.category ? fuzzysort.prepare(item.category) : undefined,
    };

    // Cache for future use (limit cache size to prevent memory issues)
    if (preparedCache.size < 1000) {
      preparedCache.set(cacheKey, prepared);
    }

    return prepared;
  });
}

/**
 * Convert Fuse.js threshold to Fuzzysort threshold
 */
function convertThreshold(fuseThreshold) {
  if (fuseThreshold === 0) return -Infinity;
  if (fuseThreshold >= 1) return 0;
  return -10000 * (1 - fuseThreshold);
}

/**
 * Perform fuzzy search
 */
function performSearch(query, items, options = {}) {
  try {
    // Handle empty query - return all items
    if (!query.trim()) {
      return items;
    }

    // Prepare items
    const prepared = prepareItems(items);

    // Convert threshold
    const threshold = options.threshold !== undefined 
      ? convertThreshold(options.threshold) 
      : -10000;

    // Search targets
    const targets = [
      'titlePrepared',
      'namePrepared', 
      'descriptionPrepared',
      'tagsPrepared',
      'categoryPrepared',
    ];

    // Perform search
    const results = fuzzysort.go(query, prepared, {
      keys: targets,
      threshold,
      limit: options.limit ?? 100,
      all: false,
    });

    // Extract items from results
    return results.map(result => result.obj.item);
  } catch (error) {
    // Fallback to simple filtering on error
    const queryLower = query.toLowerCase();
    return items.filter(item => {
      const searchText = [
        item.title || '',
        item.name || '',
        item.description || '',
        ...(item.tags || []),
        item.category || '',
      ].join(' ').toLowerCase();
      
      return searchText.includes(queryLower);
    });
  }
}

/**
 * Message handler
 */
self.onmessage = function(e) {
  const { type, query, items, options, requestId } = e.data;

  if (type === 'search') {
    try {
      const results = performSearch(query, items, options);
      
      self.postMessage({
        type: 'results',
        results,
        requestId,
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message || 'Search failed',
        requestId,
      });
    }
  } else if (type === 'clear-cache') {
    preparedCache.clear();
    self.postMessage({
      type: 'cache-cleared',
      requestId,
    });
  }
};
