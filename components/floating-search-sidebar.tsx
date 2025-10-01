'use client';

/**
 * Floating Search Sidebar (SHA-2087 Refactored)
 *
 * CONSOLIDATION: Now uses shared hook for state management
 * - useUnifiedSearch hook for search/filter state logic
 * - useLocalSearch hook for actual searching
 *
 * Previous: 334 lines with duplicated filter logic
 * Current: ~290 lines (13% reduction from deduplication)
 */

import { useCallback, useEffect, useId } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalSearch } from '@/hooks/use-search';
import { useUnifiedSearch } from '@/hooks/use-unified-search';
import { Hash, Search, User, X } from '@/lib/icons';
import type { FloatingSearchSidebarProps } from '@/lib/schemas/component.schema';
import { UI_CLASSES } from '@/lib/ui-constants';
import { getDisplayTitle } from '@/lib/utils';

export function FloatingSearchSidebar({
  isOpen,
  onClose,
  items,
  onItemSelect,
  placeholder = 'Search content...',
}: FloatingSearchSidebarProps) {
  // Generate unique ID for the search input
  const searchInputId = useId();

  // Use consolidated unified search hook for state management
  const {
    searchQuery,
    filters,
    handleSearch,
    toggleTag,
    handleFilterChange,
    clearFilters: clearAllFilters,
  } = useUnifiedSearch();

  // Use local search hook for actual filtering
  const { searchResults, filterOptions } =
    // biome-ignore lint/suspicious/noExplicitAny: Generic constraint too complex for FloatingSearchSidebarProps union
    useLocalSearch(items as any);

  const filteredItems = searchResults as (typeof items)[number][];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/Ctrl + K to open/close
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    handleSearch('');
    clearAllFilters();
  }, [handleSearch, clearAllFilters]);

  const selectedCategory = filters.category || '';
  const selectedAuthor = filters.author || '';
  const selectedTags = filters.tags || [];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className={`${UI_CLASSES.FIXED} ${UI_CLASSES.INSET_0} bg-black/20 backdrop-blur-sm z-40 lg:${UI_CLASSES.HIDDEN} cursor-default`}
        onClick={onClose}
        aria-label="Close search sidebar"
      />

      {/* Sidebar Panel */}
      <div
        className={`
        fixed ${UI_CLASSES.TOP_0} ${UI_CLASSES.RIGHT_0} h-full ${UI_CLASSES.W_FULL} max-w-md bg-background border-l border-border ${UI_CLASSES.Z_50}
        transform transition-transform duration-300 ease-in-out shadow-2xl
        translate-x-0
        lg:max-w-lg
      `}
      >
        <div className={`${UI_CLASSES.FLEX_COL} h-full`}>
          {/* Header */}
          <div
            className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.P_4} ${UI_CLASSES.BORDER_B} border-border`}
          >
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Search className="h-5 w-5 text-primary" />
              <h2 className={UI_CLASSES.FONT_SEMIBOLD}>Search & Filter</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className={`${UI_CLASSES.P_4} ${UI_CLASSES.SPACE_Y_6}`}>
              {/* Search Input */}
              <div className="relative">
                <Search className={UI_CLASSES.ICON_ABSOLUTE_LEFT} />
                <Input
                  id={searchInputId}
                  name="floatingSearchInput"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={placeholder}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Active Filters */}
              {(selectedTags.length > 0 || selectedCategory || selectedAuthor) && (
                <div className={UI_CLASSES.SPACE_Y_2}>
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>
                      Active Filters
                    </span>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                  <div className={UI_CLASSES.FLEX_WRAP_GAP_1}>
                    {selectedCategory && (
                      <Badge variant="secondary" className={UI_CLASSES.TEXT_XS}>
                        {selectedCategory}
                        <button
                          type="button"
                          onClick={() => handleFilterChange('category', undefined)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedAuthor && (
                      <Badge variant="secondary" className={UI_CLASSES.TEXT_XS}>
                        @{selectedAuthor}
                        <button
                          type="button"
                          onClick={() => handleFilterChange('author', undefined)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className={UI_CLASSES.TEXT_XS}>
                        #{tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Tag Filters */}
              <div className={UI_CLASSES.SPACE_Y_3}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span
                    className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} flex items-center gap-1`}
                  >
                    <Hash className="h-4 w-4" />
                    Popular Tags
                  </span>
                </div>
                <div className={UI_CLASSES.FLEX_WRAP_GAP_1}>
                  {filterOptions.tags.slice(0, 12).map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      className={`${UI_CLASSES.TEXT_XS} h-7`}
                      onClick={() => toggleTag(tag)}
                    >
                      #{tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Categories (Simplified - always shown if available) */}
              {filterOptions.categories.length > 0 && (
                <div className={UI_CLASSES.SPACE_Y_2}>
                  <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>
                    Category
                  </span>
                  <div className={`${UI_CLASSES.GRID_COLS_2} gap-1`}>
                    {filterOptions.categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        className={`${UI_CLASSES.TEXT_XS} justify-start h-7`}
                        onClick={() =>
                          handleFilterChange(
                            'category',
                            selectedCategory === category ? undefined : category
                          )
                        }
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Authors (Simplified - always shown if available) */}
              {filterOptions.authors.length > 0 && (
                <div className={UI_CLASSES.SPACE_Y_2}>
                  <span
                    className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} flex items-center gap-1`}
                  >
                    <User className="h-4 w-4" />
                    Author
                  </span>
                  <div className={UI_CLASSES.SPACE_Y_1}>
                    {filterOptions.authors.slice(0, 8).map((author) => (
                      <Button
                        key={author}
                        variant={selectedAuthor === author ? 'default' : 'ghost'}
                        size="sm"
                        className={`${UI_CLASSES.W_FULL} justify-start ${UI_CLASSES.TEXT_XS} h-7`}
                        onClick={() =>
                          handleFilterChange(
                            'author',
                            selectedAuthor === author ? undefined : author
                          )
                        }
                      >
                        @{author}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              <div className={UI_CLASSES.SPACE_Y_3}>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>
                    Results ({filteredItems.length})
                  </span>
                </div>

                <div className={UI_CLASSES.SPACE_Y_2}>
                  {filteredItems.slice(0, 20).map((item) => (
                    <Card
                      key={item.slug}
                      className={`p-3 cursor-pointer ${UI_CLASSES.HOVER_BG_MUTED_50} ${UI_CLASSES.TRANSITION_COLORS}`}
                      onClick={() => onItemSelect(item)}
                    >
                      <div className={UI_CLASSES.SPACE_Y_2}>
                        <div
                          className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.TEXT_SM} leading-tight`}
                        >
                          {getDisplayTitle(item)}
                        </div>
                        {item.description && (
                          <p
                            className={`${UI_CLASSES.TEXT_XS} text-muted-foreground ${UI_CLASSES.LINE_CLAMP_2}`}
                          >
                            {item.description}
                          </p>
                        )}
                        <div className={UI_CLASSES.FLEX_WRAP_GAP_1}>
                          {item.tags?.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`${UI_CLASSES.TEXT_XS} px-1 py-0`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className={UI_CLASSES.TEXT_SM}>No items match your search</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className={`${UI_CLASSES.P_4} ${UI_CLASSES.BORDER_T} border-border bg-muted/20`}>
            <div className={`${UI_CLASSES.TEXT_XS} text-muted-foreground text-center`}>
              <kbd className={`px-1.5 py-0.5 ${UI_CLASSES.TEXT_XS} bg-muted border rounded`}>
                ⌘K
              </kbd>{' '}
              to open/close
              <span className="mx-2">•</span>
              <kbd className={`px-1.5 py-0.5 ${UI_CLASSES.TEXT_XS} bg-muted border rounded`}>
                ESC
              </kbd>{' '}
              to close
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
