'use client';

/**
 * SearchResults Component - Unified Results Display
 *
 * Replaces ContentSearchClient for displaying search results.
 * Handles empty states, loading, error states with animations.
 *
 * Features:
 * - Empty state with animations
 * - Loading skeleton
 * - Error state with retry
 * - Motion.dev animations
 * - Layout animations for grid changes
 *
 * @module web-runtime/search/components/search-results
 */

import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { Search, AlertCircle, RefreshCw } from '@heyclaude/web-runtime/icons';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { Button, UnifiedCardGrid, ConfigCard, cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useCallback } from 'react';

import { useSearchContext } from '../context/search-provider';

export interface SearchResultsProps {
  /** Render function for each result card */
  renderCard?: (item: DisplayableContent) => React.ReactNode;
  /** Show category badge */
  showCategory?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Callback when authentication is required */
  onAuthRequired?: () => void;
  /** Search query for highlighting */
  searchQuery?: string;
  /** Custom className */
  className?: string;
}

/**
 * SearchResults - Unified search results display component
 *
 * @example
 * ```tsx
 * <SearchProvider>
 *   <SearchResults
 *     showCategory
 *     showActions
 *     onAuthRequired={() => openAuthModal()}
 *   />
 * </SearchProvider>
 * ```
 */
export function SearchResults({
  renderCard,
  showCategory = true,
  showActions = true,
  emptyMessage = 'No results found',
  loadingMessage = 'Searching...',
  errorMessage = 'Failed to load results',
  onRetry,
  onAuthRequired,
  searchQuery,
  className,
}: SearchResultsProps) {
  const { results, isLoading, error, query } = useSearchContext();
  const shouldReduceMotion = useReducedMotion();

  // Default render function
  const defaultRenderCard = useCallback(
    (item: DisplayableContent) => (
      <ConfigCard
        item={item}
        variant="default"
        showCategory={showCategory}
        showActions={showActions}
        {...(searchQuery || query ? { searchQuery: searchQuery || query } : {})}
        {...(onAuthRequired ? { onAuthRequired } : {})}
      />
    ),
    [showCategory, showActions, searchQuery, query, onAuthRequired]
  );

  const cardRenderer = renderCard || defaultRenderCard;

  // Loading state
  if (isLoading && results.length === 0) {
    return (
      <motion.div
        className={cn('space-y-4', className)}
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
        style={{
          willChange: 'opacity, transform',
        }}
      >
        <div className="text-muted-foreground flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <Search className="h-12 w-12 animate-pulse" />
          <h3 className="text-lg font-semibold">{loadingMessage}</h3>
          <p className="text-sm">
            {query ? `Finding results for "${query}"` : 'Preparing search...'}
          </p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error && results.length === 0) {
    return (
      <motion.div
        className={cn('space-y-4', className)}
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
        style={{
          willChange: 'opacity, transform',
        }}
      >
        <div className="text-muted-foreground flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <motion.div
            initial={shouldReduceMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRING.bouncy}
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          >
            <AlertCircle className="text-destructive h-12 w-12" />
          </motion.div>
          <h3 className="text-lg font-semibold">{errorMessage}</h3>
          <p className="text-sm">{error.message || 'An error occurred while searching'}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Empty state - Only show after search completes (not during search)
  // FIX: Prevents flashing "no results" when user double-clicks and types new query
  // Keep previous results visible while searching, only show "no results" after search completes
  // Only show empty state if: not loading, no results, and query is not empty
  if (!isLoading && results.length === 0 && query.trim().length > 0) {
    return (
      <motion.div
        className={cn('space-y-4', className)}
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
        style={{
          willChange: 'opacity, transform',
        }}
      >
        <div className="text-muted-foreground flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <motion.div
            initial={shouldReduceMotion ? {} : { scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING.bouncy}
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          >
            <Search className="h-12 w-12" />
          </motion.div>
          <h3 className="text-lg font-semibold">{emptyMessage}</h3>
          <p className="text-sm">Try different keywords or browse our featured content below</p>
        </div>
      </motion.div>
    );
  }

  // Results
  if (results.length > 0) {
    return (
      <motion.div
        className={cn('space-y-4', className)}
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
        style={{
          willChange: 'opacity',
        }}
      >
        <UnifiedCardGrid
          items={results}
          variant="normal"
          infiniteScroll
          batchSize={30}
          emptyMessage={emptyMessage}
          ariaLabel="Search results"
          keyExtractor={(item, index) => item.slug ?? `search-result-${index}`}
          renderCard={cardRenderer}
        />
      </motion.div>
    );
  }

  // No query state (initial state)
  return null;
}
