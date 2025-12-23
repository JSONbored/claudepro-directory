/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUnifiedSearch } from './use-unified-search.ts';

// Mock useLocalStorage - create persistent state map
const stateMap = new Map<symbol, { value: any; setValue: ReturnType<typeof jest.fn> }>();
const createMockUseLocalStorage = (key: string, options: any) => {
  const id = Symbol(key);
  if (!stateMap.has(id)) {
    const setValueFn = jest.fn((newValue: any) => {
      const current = stateMap.get(id);
      if (current) {
        current.value = typeof newValue === 'function' ? newValue(current.value) : newValue;
      }
    });
    stateMap.set(id, { value: options?.defaultValue || 'trending', setValue: setValueFn });
  }
  const state = stateMap.get(id)!;
  return { value: state.value, setValue: state.setValue };
};

jest.mock('./use-local-storage.ts', () => ({
  useLocalStorage: jest.fn((key: string, options: any) => createMockUseLocalStorage(key, options)),
}));

// Mock useBoolean - use actual hook for proper state management
jest.mock('./use-boolean.ts', () => {
  const actual = jest.requireActual('./use-boolean.ts');
  return actual;
});

describe('useUnifiedSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset state maps
    stateMap.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUnifiedSearch());

    expect(result.current.searchQuery).toBe('');
    expect(result.current.filters.sort).toBe('trending');
    expect(result.current.isFilterOpen).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('should initialize with custom initialSort', () => {
    const { result } = renderHook(() => useUnifiedSearch({ initialSort: 'popular' as any }));

    expect(result.current.filters.sort).toBe('popular');
  });

  it('should handle search query changes', () => {
    const onSearchChange = jest.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onSearchChange }));

    act(() => {
      result.current.handleSearch('test query');
    });

    expect(result.current.searchQuery).toBe('test query');
    expect(onSearchChange).toHaveBeenCalledWith('test query');
  });

  it('should handle filter changes', () => {
    const onFiltersChange = jest.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onFiltersChange }));

    const newFilters = { sort: 'popular' as any, category: 'agents' as any };
    act(() => {
      result.current.handleFiltersChange(newFilters);
    });

    expect(result.current.filters).toEqual(newFilters);
    expect(onFiltersChange).toHaveBeenCalledWith(newFilters);
  });

  it('should handle individual filter field changes', () => {
    const onFiltersChange = jest.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onFiltersChange }));

    act(() => {
      result.current.handleFilterChange('category', 'agents' as any);
    });

    expect(result.current.filters.category).toBe('agents');
    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('should toggle tags correctly', () => {
    const onFiltersChange = jest.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onFiltersChange }));

    // First toggle - add tag
    act(() => {
      result.current.toggleTag('ai');
    });

    // Check that tag was added
    expect(result.current.filters.tags).toContain('ai');
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['ai'] })
    );

    // Second toggle - remove tag (functional update should see current state)
    act(() => {
      result.current.toggleTag('ai');
    });

    // Check that tag was removed
    // When tags array is empty, the tags property is undefined (not included in spread)
    // The functional update in setFilters should see the updated state from first toggle
    expect(result.current.filters.tags).toBeUndefined();
  });

  it('should clear filters while keeping sort', () => {
    const onFiltersChange = jest.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onFiltersChange }));

    act(() => {
      result.current.handleFilterChange('category', 'agents' as any);
      result.current.handleFilterChange('author', 'test-author');
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.category).toBeUndefined();
    expect(result.current.filters.author).toBeUndefined();
    expect(result.current.filters.sort).toBe('trending');
    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('should calculate active filter count correctly', () => {
    const { result } = renderHook(() => useUnifiedSearch());

    expect(result.current.activeFilterCount).toBe(0);

    act(() => {
      result.current.handleFilterChange('category', 'agents' as any);
    });

    expect(result.current.activeFilterCount).toBe(1);

    act(() => {
      result.current.handleFilterChange('author', 'test-author');
      result.current.toggleTag('ai');
      result.current.toggleTag('coding');
    });

    expect(result.current.activeFilterCount).toBe(4); // category + author + 2 tags
  });

  it('should handle popularity range filter in active count', () => {
    const { result } = renderHook(() => useUnifiedSearch());

    act(() => {
      result.current.handleFilterChange('popularity', [10, 90] as any);
    });

    expect(result.current.activeFilterCount).toBe(1);
  });

  it('should not count default popularity range', () => {
    const { result } = renderHook(() => useUnifiedSearch());

    act(() => {
      result.current.handleFilterChange('popularity', [0, 100] as any);
    });

    expect(result.current.activeFilterCount).toBe(0);
  });

  it('should handle dateRange filter in active count', () => {
    const { result } = renderHook(() => useUnifiedSearch());

    act(() => {
      result.current.handleFilterChange('dateRange', {
        from: '2024-01-01',
        to: '2024-12-31',
      } as any);
    });

    expect(result.current.activeFilterCount).toBe(1);
  });

  it('should control filter panel open state', () => {
    const { result } = renderHook(() => useUnifiedSearch());

    expect(result.current.isFilterOpen).toBe(false);

    act(() => {
      result.current.setIsFilterOpen(true);
    });

    expect(result.current.isFilterOpen).toBe(true);
  });

  it('should persist sort preference when filters change', () => {
    const mockSetSavedSort = jest.fn();
    
    // Get the mock and override for this test
    const { useLocalStorage } = jest.requireMock('./use-local-storage.ts');
    (useLocalStorage as jest.Mock).mockImplementation((key: string, options: any) => {
      if (key === 'user-pref-sort') {
        return {
          value: 'trending' as any,
          setValue: mockSetSavedSort,
          removeValue: jest.fn(),
          error: null,
        };
      }
      return createMockUseLocalStorage(key, options);
    });

    const { result } = renderHook(() => useUnifiedSearch());

    act(() => {
      result.current.handleFiltersChange({ sort: 'popular' as any });
    });

    expect(mockSetSavedSort).toHaveBeenCalledWith('popular');
    
    // Reset mock implementation after test
    (useLocalStorage as jest.Mock).mockImplementation((key: string, options: any) => 
      createMockUseLocalStorage(key, options)
    );
  });
});
