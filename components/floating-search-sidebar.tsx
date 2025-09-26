'use client';

import { ArrowRight, Filter, Hash, Search, User, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDisplayTitle } from '@/lib/utils';
import type { ContentMetadata } from '@/types/content';

interface FloatingSearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: ContentMetadata[];
  onItemSelect: (item: ContentMetadata) => void;
  placeholder?: string;
}

interface FilterOptions {
  categories: string[];
  tags: string[];
  authors: string[];
}

export function FloatingSearchSidebar({
  isOpen,
  onClose,
  items,
  onItemSelect,
  placeholder = 'Search content...',
}: FloatingSearchSidebarProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extract filter options from items
  const filterOptions: FilterOptions = useMemo(() => {
    const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
    const tags = [...new Set(items.flatMap((item) => item.tags || []))];
    const authors = [...new Set(items.map((item) => item.author).filter(Boolean))];

    return {
      categories: categories.sort(),
      tags: tags.sort(),
      authors: authors.sort(),
    };
  }, [items]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    const searchLower = query.toLowerCase();

    return items.filter((item) => {
      // Text search
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.author?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = !selectedCategory || item.category === selectedCategory;

      // Author filter
      const matchesAuthor = !selectedAuthor || item.author === selectedAuthor;

      // Tags filter
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => item.tags?.includes(tag));

      return matchesSearch && matchesCategory && matchesAuthor && matchesTags;
    });
  }, [items, query, selectedCategory, selectedAuthor, selectedTags]);

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
    setQuery('');
    setSelectedTags([]);
    setSelectedCategory('');
    setSelectedAuthor('');
  }, []);

  // Handle tag selection
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  // Reset filters when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setShowAdvancedFilters(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden cursor-default"
        onClick={onClose}
        aria-label="Close search sidebar"
      />

      {/* Sidebar Panel */}
      <div
        className={`
        fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50
        transform transition-transform duration-300 ease-in-out shadow-2xl
        translate-x-0
        lg:max-w-lg
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Search & Filter</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Active Filters */}
              {(selectedTags.length > 0 || selectedCategory || selectedAuthor) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Filters</span>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedCategory && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedCategory}
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('')}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedAuthor && (
                      <Badge variant="secondary" className="text-xs">
                        @{selectedAuthor}
                        <button
                          type="button"
                          onClick={() => setSelectedAuthor('')}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    Popular Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {filterOptions.tags.slice(0, 12).map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => toggleTag(tag)}
                    >
                      #{tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${
                      showAdvancedFilters ? 'rotate-90' : ''
                    }`}
                  />
                </Button>

                {showAdvancedFilters && (
                  <div className="space-y-4 pl-4">
                    {/* Categories */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Category</span>
                      <div className="grid grid-cols-2 gap-1">
                        {filterOptions.categories.map((category) => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs justify-start h-7"
                            onClick={() =>
                              setSelectedCategory(selectedCategory === category ? '' : category)
                            }
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Authors */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Author
                      </span>
                      <div className="space-y-1">
                        {filterOptions.authors.slice(0, 8).map((author) => (
                          <Button
                            key={author}
                            variant={selectedAuthor === author ? 'default' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs h-7"
                            onClick={() =>
                              setSelectedAuthor(selectedAuthor === author ? '' : author)
                            }
                          >
                            @{author}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Results ({filteredItems.length})</span>
                </div>

                <div className="space-y-2">
                  {filteredItems.slice(0, 20).map((item) => (
                    <Card
                      key={item.slug}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onItemSelect(item)}
                    >
                      <div className="space-y-2">
                        <div className="font-medium text-sm leading-tight">
                          {getDisplayTitle(item)}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {item.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
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
                      <p className="text-sm">No items match your search</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground text-center">
              <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded">⌘K</kbd> to open/close
              <span className="mx-2">•</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded">ESC</kbd> to close
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
