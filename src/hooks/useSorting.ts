import { useState, useMemo } from 'react';
import { Rule } from '@/data/rules';
import { MCPServer } from '@/data/mcp';

export type SortOption = 'popularity' | 'date' | 'name' | 'author';
export type SortDirection = 'asc' | 'desc';

export const useSorting = () => {
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const updateSort = (option: SortOption, direction?: SortDirection) => {
    if (option === sortBy && !direction) {
      // Toggle direction if same option
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection(direction || 'desc');
    }
  };

  const sortItems = (items: (Rule | MCPServer)[]) => {
    return useMemo(() => {
      const sorted = [...items].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'popularity':
            aValue = a.popularity;
            bValue = b.popularity;
            break;
          case 'date':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
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
    }, [items, sortBy, sortDirection]);
  };

  return {
    sortBy,
    sortDirection,
    updateSort,
    sortItems
  };
};