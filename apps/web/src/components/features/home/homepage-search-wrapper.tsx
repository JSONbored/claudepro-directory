'use client';

/**
 * Homepage Search Bar - New Unified Search System
 *
 * Provides just the search bar component for homepage integration.
 * Replaces MagneticSearchWrapper + UnifiedSearch + AnimatedSearchInput.
 * Search results are handled separately via SearchResults component.
 *
 * @module apps/web/src/components/features/home/homepage-search-wrapper
 */

import { AnimatedSearchBar } from '@heyclaude/web-runtime/search/components/animated-search-bar';
import { useHeroSearchConnection } from './hero-search-connection';
import { useCallback } from 'react';

export interface HomepageSearchBarProps {
  /** Callback when focus state changes */
  onFocusChange?: (isFocused: boolean) => void;
}

/**
 * HomepageSearchBar - Search bar component for homepage
 * Must be used within SearchProvider context
 */
export function HomepageSearchBar({
  onFocusChange,
}: HomepageSearchBarProps) {
  const { setSearchFocused } = useHeroSearchConnection();

  // Handle focus change
  const handleFocusChange = useCallback(
    (focused: boolean) => {
      setSearchFocused(focused);
      onFocusChange?.(focused);
    },
    [setSearchFocused, onFocusChange]
  );

  return (
    <AnimatedSearchBar
      enableMagnetic
      enableExpansion
      enableParticles
      onFocusChange={handleFocusChange}
      searchBarProps={{
        placeholder: 'Search for rules, MCP servers, agents, commands, and more...',
        variant: 'magnetic',
        size: 'lg',
      }}
    />
  );
}
