import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SortDirection, SortOption } from '@/hooks/use-sorting';

interface SortDropdownProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (option: SortOption, direction?: SortDirection) => void;
}

export const SortDropdown = ({ sortBy, sortDirection, onSortChange }: SortDropdownProps) => {
  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'date', label: 'Date Created' },
    { value: 'name', label: 'Name' },
    { value: 'author', label: 'Author' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger className="w-40 bg-background/50 border-border/50">
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
        onClick={() => onSortChange(sortBy)}
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
