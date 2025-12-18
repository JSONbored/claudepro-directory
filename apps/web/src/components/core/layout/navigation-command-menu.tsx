'use client';

import * as Icons from '@heyclaude/web-runtime/icons';
import { getCommandMenuNavigationData } from '@heyclaude/web-runtime/config/navigation';
import { logClientWarn, logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useEffect, useLayoutEffect, useId, useState, useCallback, useRef } from 'react';
import { useBoolean, useDebounceCallback } from '@heyclaude/web-runtime/hooks';

type NavigationMenuItem = {
  path: string;
  title: string;
  description: string | null;
  icon_name: string | null;
};

/**
 * Command palette with navigation + content search (like Vercel)
 * 
 * Features:
 * - Navigation items (static)
 * - Content search results (from Supabase API)
 * - Debounced search (300ms)
 * - Fast and optimized
 */

interface NavigationCommandMenuProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function NavigationCommandMenu({
  open: controlledOpen,
  onOpenChange,
}: NavigationCommandMenuProps) {
  const { value: internalOpen, setValue: setInternalOpen } = useBoolean();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DisplayableContent[]>([]);
  const { value: isSearching, setTrue: setIsSearchingTrue, setFalse: setIsSearchingFalse } = useBoolean();
  const router = useRouter();
  const inputId = useId();
  const abortControllerRef = useRef<AbortController | null>(null);

  const open = controlledOpen === undefined ? internalOpen : controlledOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // CRITICAL FIX: Ensure onOpenChange is called when controlledOpen changes
  useLayoutEffect(() => {
    if (controlledOpen !== undefined && onOpenChange) {
      if (internalOpen !== controlledOpen) {
        setInternalOpen(controlledOpen);
      }
    }
  }, [controlledOpen, onOpenChange, internalOpen]);

  // Get navigation data from static config (no RPC needed)
  const navigationData = useMemo(() => getCommandMenuNavigationData(), []);

  // Debounced search function
  const performSearch = useCallback(async () => {
    if (!open || !searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchingFalse();
      return;
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearchingTrue();

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8&entities=content`,
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      const results = (Array.isArray(data.results) ? data.results : []) as DisplayableContent[];

      if (controller.signal.aborted) return;

      setSearchResults(results);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore abort errors
      }
      const normalized = normalizeError(error, 'Search failed');
      logClientError(
        '[NavigationCommandMenu] Search error',
        normalized,
        'NavigationCommandMenu.searchError',
        {
          component: 'NavigationCommandMenu',
          action: 'search-error',
          query: searchQuery.trim(),
        }
      );
      setSearchResults([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsSearchingFalse();
        abortControllerRef.current = null;
      }
    }
  }, [open, searchQuery, setIsSearchingTrue, setIsSearchingFalse]);

  // Debounced search execution
  const debouncedPerformSearch = useDebounceCallback(performSearch, 300);

  // Trigger debounced search when query changes
  useEffect(() => {
    debouncedPerformSearch();
  }, [debouncedPerformSearch]);

  // Reset search when menu closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearchingFalse();
      debouncedPerformSearch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [open, setIsSearchingFalse, debouncedPerformSearch]);

  // Keyboard shortcut handler (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    // Strip query parameters added for uniqueness (section/group params)
    const cleanPath = path.split('?')[0];
    if (cleanPath) {
      router.push(cleanPath);
    }
  }, [router, setOpen]);

  // Render search result item - MUST be before any conditional returns (React hooks rule)
  const renderSearchResult = useCallback((result: DisplayableContent, index: number) => {
    const href = `/${result.category}/${result.slug}`;
    // Use slug as unique key (id may not exist on DisplayableContent)
    const uniqueKey = result.slug ? `search-${result.category}-${result.slug}-${index}` : `search-${index}`;
    return (
      <CommandItem
        key={uniqueKey}
        onSelect={() => handleSelect(href)}
        className="group cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {getIcon('FileText')}
          <div className="min-w-0 flex-1 flex flex-col items-start">
            <span className="w-full truncate">{result.title}</span>
            {result.description ? (
              <span className="line-clamp-1 text-muted-foreground text-xs transition-colors group-hover:text-accent">
                {result.description}
              </span>
            ) : null}
            <span className="text-xs capitalize text-muted-foreground">{result.category}</span>
          </div>
        </span>
      </CommandItem>
    );
  }, [handleSelect]);

  // Dynamic icon mapper
  const getIcon = (icon_name: null | string | undefined) => {
    if (!icon_name) return null;
    const IconModule = Icons as Record<string, unknown>;
    const Icon = IconModule[icon_name];

    // Type guard: check if it's a valid React component
    if (typeof Icon === 'function') {
      const IconComponent = Icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
    return null;
  };

  const renderItem = (item: NavigationMenuItem, index: number, groupName: string) => {
    if (!item.path) return null;
    const path = item.path; // Type narrowing: path is now definitely string
    // CRITICAL FIX: Include groupName in key to ensure uniqueness across groups
    // This prevents duplicate keys when the same path appears in multiple groups
    const uniqueKey = `${groupName}-${path}-${item.title}-${index}`;
    return (
      <CommandItem key={uniqueKey} onSelect={() => handleSelect(path)} className="group cursor-pointer">
        <span className="flex items-center gap-2">
          {getIcon(item.icon_name)}
          <div className="flex flex-col items-start">
            <span>{item.title}</span>
            {item.description ? (
              <span
                className="text-muted-foreground text-xs transition-colors group-hover:text-accent"
              >
                {item.description}
              </span>
            ) : null}
          </div>
        </span>
      </CommandItem>
    );
  };

  // CRITICAL FIX: Do NOT return null when closed
  // Radix UI Dialog needs to be in the DOM to manage portal, overlay, and animations
  // Radix UI will handle showing/hiding based on the `open` prop internally
  // This ensures proper CSS application, positioning, and animation state

  // Defensive check: Ensure navigationData is available
  if (!navigationData) {
    logClientWarn(
      '[NavigationCommandMenu] navigationData is not available',
      undefined,
      'NavigationCommandMenu.missingData',
      {
        component: 'NavigationCommandMenu',
        action: 'missing-data-check',
        category: 'navigation',
      }
    );
    return null;
  }

  const hasSearchQuery = searchQuery.trim().length > 0;
  const showNavigation = !hasSearchQuery || searchResults.length === 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          id={inputId}
          name="command-search"
          placeholder="Search navigation and content... (⌘K)"
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="group"
        />
        <CommandList>
          {hasSearchQuery && isSearching && (
            <CommandEmpty className="text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                Searching...
              </span>
            </CommandEmpty>
          )}
          
          {hasSearchQuery && !isSearching && searchResults.length === 0 && (
            <CommandEmpty className="text-muted-foreground">No results found.</CommandEmpty>
          )}

          {/* Search Results - Show first when user is searching */}
          {hasSearchQuery && searchResults.length > 0 && (
            <>
              <CommandGroup heading="Search Results">
                {searchResults.map((result, index) => renderSearchResult(result, index))}
              </CommandGroup>
              {showNavigation && <CommandSeparator />}
            </>
          )}

          {/* Navigation Items - Show when no search or after search results */}
          {showNavigation && navigationData.primary && navigationData.primary.length > 0 && (
            <>
              <CommandGroup heading="Primary Navigation">
                {navigationData.primary.map((item, index) => renderItem(item, index, 'primary')).filter(Boolean)}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {showNavigation && navigationData.secondary && navigationData.secondary.length > 0 && (
            <>
              <CommandGroup heading="More">
                {navigationData.secondary.map((item, index) => renderItem(item, index, 'secondary')).filter(Boolean)}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {showNavigation && navigationData.actions && navigationData.actions.length > 0 && (
            <CommandGroup heading="Actions">
              {navigationData.actions.map((item, index) => renderItem(item, index, 'actions')).filter(Boolean)}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
  );
}
