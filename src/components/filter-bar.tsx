import { Filter, RotateCcw, X } from 'lucide-react';
import { useId } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import type { FilterOptions } from '@/hooks/use-filters';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (key: keyof FilterOptions, value: any) => void;
  onResetFilters: () => void;
  availableCategories: string[];
  availableTags: string[];
  availableAuthors: string[];
}

export const FilterBar = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableCategories,
  availableTags,
  availableAuthors,
}: FilterBarProps) => {
  const categoryId = useId();
  const authorId = useId();
  const dateRangeId = useId();
  const popularityId = useId();
  const tagsId = useId();
  
  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.tags.length > 0 ||
    filters.author !== 'all' ||
    filters.popularityRange[0] > 0 ||
    filters.popularityRange[1] < 100 ||
    filters.dateRange !== 'all';

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFilterChange('tags', newTags);
  };

  const removeTag = (tag: string) => {
    onFilterChange(
      'tags',
      filters.tags.filter((t) => t !== tag)
    );
  };

  return (
    <div className="bg-card/30 border border-border/50 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Category Filter */}
        <div className="space-y-2">
          <label htmlFor={categoryId} className="text-sm font-medium text-foreground">Category</label>
          <Select
            value={filters.category}
            onValueChange={(value) => onFilterChange('category', value)}
          >
            <SelectTrigger id={categoryId} className="bg-background/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Author Filter */}
        <div className="space-y-2">
          <label htmlFor={authorId} className="text-sm font-medium text-foreground">Author</label>
          <Select value={filters.author} onValueChange={(value) => onFilterChange('author', value)}>
            <SelectTrigger id={authorId} className="bg-background/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {availableAuthors.map((author) => (
                <SelectItem key={author} value={author}>
                  {author.charAt(0).toUpperCase() + author.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label htmlFor={dateRangeId} className="text-sm font-medium text-foreground">Date Range</label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) => onFilterChange('dateRange', value)}
          >
            <SelectTrigger id={dateRangeId} className="bg-background/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Popularity Range */}
        <div className="space-y-2">
          <label htmlFor={popularityId} className="text-sm font-medium text-foreground">
            Popularity ({filters.popularityRange[0]} - {filters.popularityRange[1]})
          </label>
          <div className="px-2 py-4">
            <Slider
              id={popularityId}
              value={filters.popularityRange}
              onValueChange={(value) => onFilterChange('popularityRange', value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Tags Section */}
      <div className="space-y-3">
        <Separator />
        <div>
          <label htmlFor={tagsId} className="text-sm font-medium text-foreground mb-3 block">Tags</label>
          <div id={tagsId} className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all duration-200 ${
                  filters.tags.includes(tag)
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'hover:bg-primary/10 hover:border-primary/30'
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Active Tags */}
        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Active:</span>
            {filters.tags.map((tag) => (
              <Badge
                key={`active-${tag}`}
                variant="default"
                className="bg-primary text-primary-foreground"
              >
                {tag}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-primary-foreground/80"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
