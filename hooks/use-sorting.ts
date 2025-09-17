import { useCallback, useState } from 'react';

interface SortableItem {
  popularity?: number;
  createdAt?: string;
  author: string;
  title?: string;
  name?: string;
}

export type SortOption = 'popularity' | 'date' | 'name' | 'author';
export type SortDirection = 'asc' | 'desc';

export const useSorting = () => {
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const updateSort = (option: SortOption, direction?: SortDirection) => {
    if (option === sortBy && !direction) {
      // Toggle direction if same option
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(option);
      setSortDirection(direction || 'desc');
    }
  };

  const sortItems = useCallback(
    <T extends SortableItem>(items: T[]): T[] => {
      const sorted = [...items].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'popularity':
            aValue = a.popularity ?? 0;
            bValue = b.popularity ?? 0;
            break;
          case 'date':
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            break;
          case 'name':
            aValue = (a.title || a.name || '').toLowerCase();
            bValue = (b.title || b.name || '').toLowerCase();
            break;
          case 'author':
            aValue = a.author.toLowerCase();
            bValue = b.author.toLowerCase();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      return sorted;
    },
    [sortBy, sortDirection]
  );

  return {
    sortBy,
    sortDirection,
    updateSort,
    sortItems,
  };
};
