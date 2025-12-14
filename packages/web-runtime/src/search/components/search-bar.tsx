'use client';

/**
 * SearchBar Component - Unified Search Input
 *
 * Replaces UnifiedSearch + MagneticSearchWrapper + AnimatedSearchInput
 * Provides a clean, composable search bar with variants.
 *
 * Features:
 * - Multiple variants (default, magnetic, minimal)
 * - URL synchronization
 * - Focus management
 * - Motion.dev animations (optimized)
 * - Accessibility support
 *
 * NOTE: For magnetic variant with animations, use AnimatedSearchBar wrapper.
 * This component handles only the input logic when variant="magnetic".
 *
 * PERFORMANCE FIX: Uses uncontrolled input with local state to prevent
 * value mismatch issues. Syncs to context on debounce only.
 *
 * @module web-runtime/search/components/search-bar
 */

import { Search } from '@heyclaude/web-runtime/icons';
import { Input, cn } from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useRef, useState, useId } from 'react';
import { useDebounceValue } from '@heyclaude/web-runtime/hooks';

import { useSearchContext } from '../context/search-provider';

export interface SearchBarProps {
  /** Variant style */
  variant?: 'default' | 'magnetic' | 'minimal';
  /** Placeholder text */
  placeholder?: string;
  /** Callback when search query changes */
  onSearch?: (query: string) => void;
  /** Callback when focus state changes */
  onFocusChange?: (isFocused: boolean) => void;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * SearchBar - Unified search input component
 *
 * @example
 * ```tsx
 * <SearchProvider>
 *   <SearchBar
 *     variant="magnetic"
 *     placeholder="Search..."
 *     onFocusChange={(focused) => console.log(focused)}
 *   />
 * </SearchProvider>
 * ```
 */
export function SearchBar({
  variant = 'default',
  placeholder = 'Search...',
  onSearch,
  onFocusChange,
  className,
  size = 'md',
}: SearchBarProps) {
  const { query, setQuery } = useSearchContext();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // CRITICAL FIX: Use uncontrolled input with local state
  // This prevents value mismatch where URL sync overwrites user input
  const [localQuery, setLocalQuery] = useState(query);
  
  // Sync from context to local state (only when context changes externally, not from user input)
  useEffect(() => {
    // Only sync if local state differs and it's not from user typing
    // This handles browser back/forward navigation
    // CRITICAL FIX: Add SSR-safe check for document
    if (
      typeof document !== 'undefined' &&
      query !== localQuery &&
      inputRef.current &&
      document.activeElement !== inputRef.current
    ) {
      setLocalQuery(query);
    } else if (query !== localQuery && typeof document === 'undefined') {
      // SSR: sync immediately (no focus check needed)
      setLocalQuery(query);
    }
  }, [query, localQuery]); // Include localQuery in deps for proper comparison
  
  // Debounced sync from local state to context (for search execution)
  const [debouncedLocalQuery] = useDebounceValue(localQuery, 300);
  
  useEffect(() => {
    if (debouncedLocalQuery !== query) {
      setQuery(debouncedLocalQuery);
    }
  }, [debouncedLocalQuery, query, setQuery]);

  // Handle input change - immediate local update (no debounce)
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setLocalQuery(newQuery); // Immediate update - no debounce
      onSearch?.(newQuery);
    },
    [onSearch]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    onFocusChange?.(true);
  }, [onFocusChange]);

  // Handle blur
  const handleBlur = useCallback(() => {
    onFocusChange?.(false);
  }, [onFocusChange]);

  // Size classes
  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  };

  // Generate unique ID for the input (for autofill support)
  // CRITICAL FIX: Use useId() for consistent server/client IDs
  const generatedId = useId();
  // Remove the colon that useId() adds (it's not valid in HTML IDs)
  const inputId = `search-input-${generatedId.replace(/:/g, '-')}`;

  // Base input component - Controlled by local state (prevents URL sync overwrites)
  const inputElement = (
    <Input
      ref={inputRef}
      id={inputId}
      name="search-query"
      type="search"
      value={localQuery}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        'w-full',
        sizeClasses[size],
        variant === 'magnetic' && 'bg-transparent',
        className
      )}
      aria-label="Search"
    />
  );

  // Default variant - simple input
  if (variant === 'minimal') {
    return (
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <div className="pl-10">{inputElement}</div>
      </div>
    );
  }

  // Magnetic variant - simplified (animations handled by AnimatedSearchBar wrapper)
  if (variant === 'magnetic') {
    return (
      <>
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <Search className="text-muted-foreground h-4 w-4" />
        </div>

        {/* Input */}
        <div className="pl-10 pr-4">{inputElement}</div>
      </>
    );
  }

  // Default variant - standard input with icon
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      <div className="pl-10">{inputElement}</div>
    </div>
  );
}
