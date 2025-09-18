import { useCallback, useState } from 'react';

interface FilterableItem {
  category: string;
  tags: string[];
  author: string;
  popularity?: number;
  createdAt?: string;
}

export type FilterOptions = {
  category: string;
  tags: string[];
  author: string;
  popularityRange: [number, number];
  dateRange: 'all' | 'week' | 'month' | 'year';
};

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    tags: [],
    author: 'all',
    popularityRange: [0, 100],
    dateRange: 'all',
  });

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      tags: [],
      author: 'all',
      popularityRange: [0, 100],
      dateRange: 'all',
    });
  };

  const applyFilters = useCallback(
    <T extends FilterableItem>(items: T[]): T[] => {
      return items.filter((item) => {
        // Category filter
        if (filters.category !== 'all' && item.category !== filters.category) {
          return false;
        }

        // Tags filter
        if (filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some((tag) => item.tags.includes(tag));
          if (!hasMatchingTag) return false;
        }

        // Author filter
        if (filters.author !== 'all' && item.author !== filters.author) {
          return false;
        }

        // Popularity range filter (skip if popularity is undefined)
        if (
          item.popularity !== undefined &&
          (item.popularity < filters.popularityRange[0] ||
            item.popularity > filters.popularityRange[1])
        ) {
          return false;
        }

        // Date range filter (skip if createdAt is undefined)
        if (filters.dateRange !== 'all' && item.createdAt) {
          const itemDate = new Date(item.createdAt);
          const now = new Date();
          const diffTime = now.getTime() - itemDate.getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);

          switch (filters.dateRange) {
            case 'week':
              if (diffDays > 7) return false;
              break;
            case 'month':
              if (diffDays > 30) return false;
              break;
            case 'year':
              if (diffDays > 365) return false;
              break;
          }
        }

        return true;
      });
    },
    [filters]
  );

  return {
    filters,
    updateFilter,
    resetFilters,
    applyFilters,
  };
};
