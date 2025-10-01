'use client';

import { useCallback, useId, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDown, ArrowUp } from '@/lib/icons';
import type { SortDropdownProps } from '@/lib/schemas/component.schema';
import type { SortOption } from '@/lib/schemas/content-filter.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

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
    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
      <span className={UI_CLASSES.TEXT_SM_MUTED}>Sort by:</span>
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
        className={`p-2 ${UI_CLASSES.HOVER_BG_ACCENT_10}`}
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
