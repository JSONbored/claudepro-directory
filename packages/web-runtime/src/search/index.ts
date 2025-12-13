/**
 * Unified Search System
 *
 * Provides a complete, reusable search architecture with:
 * - SearchProvider context for state management
 * - useSearch hook for search logic
 * - URL synchronization
 * - Request deduplication and caching
 * - Type-safe APIs
 *
 * @module web-runtime/search
 */

// Context
export { SearchProvider, useSearchContext } from './context/search-provider';
export type { SearchContextValue, SearchProviderProps } from './context/search-provider';

// Hooks
export { useSearch } from './hooks/use-search';
export type { UseSearchOptions, UseSearchReturn } from './hooks/use-search';
export { useSearchAPI } from './hooks/use-search-api';
export type { UseSearchAPIOptions } from './hooks/use-search-api';

// Components
export * from './components/index';

// Utilities
export {
  createSearchURL,
  syncSearchStateFromURL,
  syncSearchStateToURL,
} from './utils/search-state';
export { enhancedSearchCache } from './utils/search-cache';
