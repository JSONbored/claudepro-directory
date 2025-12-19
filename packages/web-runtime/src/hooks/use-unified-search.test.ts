import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedSearch } from './use-unified-search.ts';

// Mock useLocalStorage - hoist state outside of vi.mock()
const createMockUseLocalStorage = vi.hoisted(() => {
  const stateMap = new Map<symbol, { value: any; setValue: ReturnType<typeof vi.fn> }>();
  return (key: string, options: any) => {
    const id = Symbol(key);
    if (!stateMap.has(id)) {
      const setValueFn = vi.fn((newValue: any) => {
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
});

vi.mock('./use-local-storage.ts', () => ({
  useLocalStorage: createMockUseLocalStorage,
}));

// Mock useBoolean - hoist state outside of vi.mock()
const createMockUseBoolean = vi.hoisted(() => {
  const stateMap = new Map<symbol, { value: boolean; setValue: ReturnType<typeof vi.fn> }>();
  return () => {
    const id = Symbol();
    if (!stateMap.has(id)) {
      const setValueFn = vi.fn((newValue: boolean | ((prev: boolean) => boolean)) => {
        const current = stateMap.get(id);
        if (current) {
          current.value = typeof newValue === 'function' ? newValue(current.value) : newValue;
        }
      });
      stateMap.set(id, { value: false, setValue: setValueFn });
    }
    const state = stateMap.get(id)!;
    return { value: state.value, setValue: state.setValue };
  };
});

vi.mock('./use-boolean.ts', () => ({
  useBoolean: createMockUseBoolean,
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
