import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedSearch } from './use-unified-search.ts';

// Mock useLocalStorage
vi.mock('./use-local-storage.ts', () => ({
  useLocalStorage: vi.fn((key: string, options: any) => {
    const [value, setValue] = vi.hoisted(() => {
      const state = { value: options?.defaultValue || 'trending', setValue: vi.fn() };
      state.setValue = vi.fn((newValue) => {
        state.value = typeof newValue === 'function' ? newValue(state.value) : newValue;
      });
      return [state.value, state.setValue];
    })();
    return { value, setValue };
  }),
}));

// Mock useBoolean
vi.mock('./use-boolean.ts', () => ({
  useBoolean: vi.fn(() => {
    const [value, setValue] = vi.hoisted(() => {
      const state = { value: false, setValue: vi.fn() };
      state.setValue = vi.fn((newValue) => {
        state.value = typeof newValue === 'function' ? newValue(state.value) : newValue;
      });
      return [state.value, state.setValue];
    })();
    return { value, setValue };
  }),
}));

describe('useUnifiedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const onSearchChange = vi.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onSearchChange }));

    act(() => {
      result.current.handleSearch('test query');
    });

    expect(result.current.searchQuery).toBe('test query');
    expect(onSearchChange).toHaveBeenCalledWith('test query');
  });

  it('should handle filter changes', () => {
    const onFiltersChange = vi.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onFiltersChange }));

    const newFilters = { sort: 'popular' as any, category: 'agents' as any };
    act(() => {
      result.current.handleFiltersChange(newFilters);
    });

    expect(result.current.filters).toEqual(newFilters);
    expect(onFiltersChange).toHaveBeenCalledWith(newFilters);
  });

  it('should handle individual filter field changes', () => {
    const onFiltersChange = vi.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onFiltersChange }));

    act(() => {
      result.current.handleFilterChange('category', 'agents' as any);
    });

    expect(result.current.filters.category).toBe('agents');
    expect(onFiltersChange).toHaveBeenCalled();
  });

  it('should toggle tags correctly', () => {
    const onFiltersChange = vi.fn();
    const { result } = renderHook(() => useUnifiedSearch({ onFiltersChange }));

    act(() => {
      result.current.toggleTag('ai');
    });

    expect(result.current.filters.tags).toContain('ai');
    expect(onFiltersChange).toHaveBeenCalled();

    act(() => {
      result.current.toggleTag('ai');
    });

    expect(result.current.filters.tags).not.toContain('ai');
  });

  it('should clear filters while keeping sort', () => {
    const onFiltersChange = vi.fn();
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
      result.current.handleFilterChange('dateRange', { from: '2024-01-01', to: '2024-12-31' } as any);
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
    const { useLocalStorage } = await import('./use-local-storage.ts');
    const mockSetSavedSort = vi.fn();
    vi.mocked(useLocalStorage).mockReturnValue({
      value: 'trending' as any,
      setValue: mockSetSavedSort,
      removeValue: vi.fn(),
      error: null,
    });

    const { result } = renderHook(() => useUnifiedSearch());

    act(() => {
      result.current.handleFiltersChange({ sort: 'popular' as any });
    });

    expect(mockSetSavedSort).toHaveBeenCalledWith('popular');
  });
});
