'use client';

/**
 * CommandPalette Component - Cmd+K Global Search
 *
 * Based on shadcn/ui Command component.
 * Provides global search accessible via Cmd+K.
 *
 * Features:
 * - Cmd+K keyboard shortcut
 * - Recent searches
 * - Suggestions
 * - Quick actions
 * - Keyboard navigation
 * - Motion.dev animations
 *
 * @module web-runtime/search/components/command-palette
 */

import { Search, Clock, TrendingUp } from '@heyclaude/web-runtime/icons';
import type { DisplayableContent, SavedSearchPreset } from '@heyclaude/web-runtime/types/component.types';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useMemo } from 'react';
import { useBoolean } from '../../hooks/use-boolean.ts';

import { useSearchContext } from '../context/search-provider';

export interface QuickAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export interface CommandPaletteProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Recent searches */
  recentSearches?: SavedSearchPreset[];
  /** Search suggestions */
  suggestions?: DisplayableContent[];
  /** Quick actions */
  quickActions?: QuickAction[];
}

/**
 * CommandPalette - Cmd+K global search component
 *
 * @example
 * ```tsx
 * <SearchProvider>
 *   <CommandPalette
 *     open={isOpen}
 *     onOpenChange={setIsOpen}
 *     recentSearches={recentSearches}
 *     suggestions={suggestions}
 *   />
 * </CommandPalette>
 * ```
 */
export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
  recentSearches = [],
  suggestions = [],
  quickActions = [],
}: CommandPaletteProps) {
  const { query, setQuery, results } = useSearchContext();
  const { value: internalOpen, toggle: toggleInternalOpen, setValue: setInternalOpen } = useBoolean();

  // Generate unique ID for the input (for autofill support)
  const inputId = useMemo(() => `command-palette-input-${Math.random().toString(36).substring(2, 9)}`, []);

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  // Toggle function that works with both controlled and uncontrolled
  const toggleOpen = useCallback(() => {
    if (onOpenChange) {
      onOpenChange(!isOpen);
    } else {
      toggleInternalOpen();
    }
  }, [onOpenChange, isOpen]);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleOpen();
      }
      if (e.key === 'Escape' && isOpen) {
        if (onOpenChange) {
          onOpenChange(false);
        } else {
          setInternalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleOpen, onOpenChange]);

  // Handle close
  const handleClose = useCallback(
    (open: boolean) => {
      if (onOpenChange) {
        onOpenChange(open);
      } else {
        setInternalOpen(open);
      }
    },
    [onOpenChange]
  );

  // Handle recent search select
  const handleRecentSearch = useCallback(
    (preset: SavedSearchPreset) => {
      setQuery(preset.query);
      // Filters will be applied via context when query changes
      handleClose(false);
    },
    [setQuery, handleClose]
  );

  // Handle suggestion select
  const handleSuggestion = useCallback(
    (item: DisplayableContent) => {
      // Navigate to item detail page
      if (item.slug && item.category) {
        window.location.href = `/${item.category}/${item.slug}`;
      }
      handleClose(false);
    },
    [handleClose]
  );

  // Handle quick action
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      action.action();
      handleClose(false);
    },
    [handleClose]
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={handleClose}>
      <CommandInput
        id={inputId}
        name="command-palette-search"
        placeholder="Search agents, MCP servers, rules, commands..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <CommandGroup heading="Quick Actions">
                {quickActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleQuickAction(action)}
                    className="flex items-center gap-2"
                  >
                    {action.icon && <action.icon className="h-4 w-4" />}
                    <span>{action.label}</span>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((preset) => (
                  <CommandItem
                    key={preset.id}
                    onSelect={() => handleRecentSearch(preset)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span>{preset.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <CommandGroup heading="Suggestions">
                {suggestions.slice(0, 5).map((item) => (
                  <CommandItem
                    key={item.slug || item.title}
                    onSelect={() => handleSuggestion(item)}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="text-muted-foreground h-4 w-4" />
                    <span>{item.title || item.slug}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <CommandGroup heading="Results">
                {results.slice(0, 10).map((item) => (
                  <CommandItem
                    key={item.slug || item.title}
                    onSelect={() => handleSuggestion(item)}
                    className="flex items-center gap-2"
                  >
                    <Search className="text-muted-foreground h-4 w-4" />
                    <span>{item.title || item.slug}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
      </CommandList>
    </CommandDialog>
  );
}
