'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { useCallback, useId, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SortDropdownProps, SortOption } from '@/lib/schemas';

export const SortDropdown = ({ sortBy, sortDirection, onSortChange }: SortDropdownProps) => {
  const sortDropdownId = useId();

  const sortOptions = useMemo(
    () => [
      { value: 'popularity', label: 'Popularity' },
      { value: 'date', label: 'Date Created' },
      { value: 'name', label: 'Name' },
      { value: 'author', label: 'Author' },
    ],
    []
  );

  const handleSortValueChange = useCallback(
    (value: string) => {
      onSortChange(value as SortOption);
    },
    [onSortChange]
  );

  const handleDirectionToggle = useCallback(() => {
    onSortChange(sortBy);
  }, [onSortChange, sortBy]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select value={sortBy} onValueChange={handleSortValueChange}>
        <SelectTrigger
          id={sortDropdownId}
          name="sortBy"
          className="w-40 bg-background/50 border-border/50"
          aria-label="Sort configurations"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDirectionToggle}
        className="p-2 hover:bg-accent/10"
      >
        {sortDirection === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
