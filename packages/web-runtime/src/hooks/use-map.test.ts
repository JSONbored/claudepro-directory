/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useMap } from './use-map.ts';

describe('useMap', () => {
  it('should initialize with empty Map by default', () => {
    const [map] = renderHook(() => useMap<string, number>()).result.current;

    expect(map.size).toBe(0);
  });

  it('should initialize with Map instance', () => {
    const initialMap = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const [map] = renderHook(() => useMap(initialMap)).result.current;

    expect(map.size).toBe(2);
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
  });

  it('should initialize with entries array', () => {
    const entries: Array<[string, number]> = [
      ['a', 1],
      ['b', 2],
    ];
    const [map] = renderHook(() => useMap(entries)).result.current;

    expect(map.size).toBe(2);
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
  });

  it('should set key-value pairs', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
    });

    expect(result.current[0].get('key1')).toBe(100);
    expect(result.current[0].size).toBe(1);
  });

  it('should update existing keys', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
      actions.set('key1', 200);
    });

    expect(result.current[0].get('key1')).toBe(200);
    expect(result.current[0].size).toBe(1);
  });

  it('should remove keys', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
      actions.set('key2', 200);
    });

    expect(result.current[0].size).toBe(2);

    act(() => {
      actions.remove('key1');
    });

    expect(result.current[0].has('key1')).toBe(false);
    expect(result.current[0].get('key2')).toBe(200);
    expect(result.current[0].size).toBe(1);
  });

  it('should set all entries from Map', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
    });

    const newMap = new Map([
      ['key2', 200],
      ['key3', 300],
    ]);
    act(() => {
      actions.setAll(newMap);
    });

    expect(result.current[0].size).toBe(2);
    expect(result.current[0].has('key1')).toBe(false);
    expect(result.current[0].get('key2')).toBe(200);
    expect(result.current[0].get('key3')).toBe(300);
  });

  it('should set all entries from array', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    const entries: Array<[string, number]> = [
      ['key1', 100],
      ['key2', 200],
    ];
    act(() => {
      actions.setAll(entries);
    });

    expect(result.current[0].size).toBe(2);
    expect(result.current[0].get('key1')).toBe(100);
    expect(result.current[0].get('key2')).toBe(200);
  });

  it('should reset to empty Map', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
      actions.set('key2', 200);
    });

    expect(result.current[0].size).toBe(2);

    act(() => {
      actions.reset();
    });

    expect(result.current[0].size).toBe(0);
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useMap<string, number>());
    const [, firstActions] = result.current;

    rerender();

    expect(result.current[1].set).toBe(firstActions.set);
    expect(result.current[1].remove).toBe(firstActions.remove);
    expect(result.current[1].reset).toBe(firstActions.reset);
    expect(result.current[1].setAll).toBe(firstActions.setAll);
  });

  it('should work with complex key types', () => {
    const { result } = renderHook(() => useMap<{ id: string }, number>());
    const [, actions] = result.current;

    const key = { id: 'user-1' };
    act(() => {
      actions.set(key, 100);
    });

    expect(result.current[0].get(key)).toBe(100);
  });

  it('should handle remove with non-existent keys gracefully', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.remove('non-existent');
    });

    expect(result.current[0].size).toBe(0);
  });

  it('should handle remove after set', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
      actions.set('key2', 200);
      actions.remove('key1');
      actions.remove('key2');
    });

    expect(result.current[0].size).toBe(0);
    expect(result.current[0].has('key1')).toBe(false);
    expect(result.current[0].has('key2')).toBe(false);
  });

  it('should work with number keys', () => {
    const { result } = renderHook(() => useMap<number, string>());
    const [, actions] = result.current;

    act(() => {
      actions.set(1, 'one');
      actions.set(2, 'two');
      actions.set(3, 'three');
    });

    expect(result.current[0].get(1)).toBe('one');
    expect(result.current[0].get(2)).toBe('two');
    expect(result.current[0].get(3)).toBe('three');
    expect(result.current[0].size).toBe(3);
  });

  it('should work with string values', () => {
    const { result } = renderHook(() => useMap<string, string>());
    const [, actions] = result.current;

    act(() => {
      actions.set('name', 'John');
      actions.set('email', 'john@example.com');
    });

    expect(result.current[0].get('name')).toBe('John');
    expect(result.current[0].get('email')).toBe('john@example.com');
  });

  it('should work with object values', () => {
    const { result } = renderHook(() => useMap<string, { id: string; name: string }>());
    const [, actions] = result.current;

    act(() => {
      actions.set('user1', { id: '1', name: 'Alice' });
      actions.set('user2', { id: '2', name: 'Bob' });
    });

    expect(result.current[0].get('user1')).toEqual({ id: '1', name: 'Alice' });
    expect(result.current[0].get('user2')).toEqual({ id: '2', name: 'Bob' });
  });

  it('should work with array values', () => {
    const { result } = renderHook(() => useMap<string, number[]>());
    const [, actions] = result.current;

    act(() => {
      actions.set('scores', [10, 20, 30]);
      actions.set('ids', [1, 2, 3]);
    });

    expect(result.current[0].get('scores')).toEqual([10, 20, 30]);
    expect(result.current[0].get('ids')).toEqual([1, 2, 3]);
  });

  it('should work with null and undefined values', () => {
    const { result } = renderHook(() => useMap<string, string | null | undefined>());
    const [, actions] = result.current;

    act(() => {
      actions.set('nullValue', null);
      actions.set('undefinedValue', undefined);
    });

    expect(result.current[0].get('nullValue')).toBe(null);
    expect(result.current[0].get('undefinedValue')).toBe(undefined);
    expect(result.current[0].has('nullValue')).toBe(true);
    expect(result.current[0].has('undefinedValue')).toBe(true);
  });

  it('should handle setAll with empty Map', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
      actions.set('key2', 200);
    });

    expect(result.current[0].size).toBe(2);

    act(() => {
      actions.setAll(new Map());
    });

    expect(result.current[0].size).toBe(0);
  });

  it('should handle setAll with empty array', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
    });

    expect(result.current[0].size).toBe(1);

    act(() => {
      actions.setAll([]);
    });

    expect(result.current[0].size).toBe(0);
  });

  it('should handle reset after setAll', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.setAll([
        ['key1', 100],
        ['key2', 200],
      ]);
    });

    expect(result.current[0].size).toBe(2);

    act(() => {
      actions.reset();
    });

    expect(result.current[0].size).toBe(0);
  });

  it('should handle multiple operations in sequence', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('a', 1);
      actions.set('b', 2);
      actions.set('c', 3);
      actions.remove('b');
      actions.set('d', 4);
      actions.set('a', 10); // Update existing
    });

    expect(result.current[0].size).toBe(3);
    expect(result.current[0].get('a')).toBe(10);
    expect(result.current[0].get('c')).toBe(3);
    expect(result.current[0].get('d')).toBe(4);
    expect(result.current[0].has('b')).toBe(false);
  });

  it('should maintain insertion order', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('first', 1);
      actions.set('second', 2);
      actions.set('third', 3);
    });

    const entries = Array.from(result.current[0].entries());
    expect(entries[0][0]).toBe('first');
    expect(entries[1][0]).toBe('second');
    expect(entries[2][0]).toBe('third');
  });

  it('should return new Map instances on updates (immutable pattern)', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [map1, actions] = result.current;

    act(() => {
      actions.set('key1', 100);
    });

    const map2 = result.current[0];

    // Each update creates a new Map instance (immutable pattern)
    // The maps are different references
    expect(map1).not.toBe(map2);
    expect(map2.size).toBe(1);
    expect(map2.get('key1')).toBe(100);

    act(() => {
      actions.set('key2', 200);
    });

    const map3 = result.current[0];
    expect(map2).not.toBe(map3);
    expect(map3.size).toBe(2);
  });

  it('should work with multiple hook instances independently', () => {
    const { result: result1 } = renderHook(() => useMap<string, number>());
    const { result: result2 } = renderHook(() => useMap<string, number>());

    act(() => {
      result1.current[1].set('key1', 100);
      result2.current[1].set('key2', 200);
    });

    expect(result1.current[0].size).toBe(1);
    expect(result1.current[0].get('key1')).toBe(100);
    expect(result1.current[0].has('key2')).toBe(false);

    expect(result2.current[0].size).toBe(1);
    expect(result2.current[0].get('key2')).toBe(200);
    expect(result2.current[0].has('key1')).toBe(false);
  });

  it('should handle large number of entries', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      for (let i = 0; i < 100; i++) {
        actions.set(`key${i}`, i);
      }
    });

    expect(result.current[0].size).toBe(100);
    expect(result.current[0].get('key0')).toBe(0);
    expect(result.current[0].get('key99')).toBe(99);
  });

  it('should handle setAll replacing all existing entries', () => {
    const { result } = renderHook(() => useMap<string, number>());
    const [, actions] = result.current;

    act(() => {
      actions.set('old1', 1);
      actions.set('old2', 2);
      actions.set('old3', 3);
    });

    expect(result.current[0].size).toBe(3);

    act(() => {
      actions.setAll([
        ['new1', 10],
        ['new2', 20],
      ]);
    });

    expect(result.current[0].size).toBe(2);
    expect(result.current[0].has('old1')).toBe(false);
    expect(result.current[0].has('old2')).toBe(false);
    expect(result.current[0].has('old3')).toBe(false);
    expect(result.current[0].get('new1')).toBe(10);
    expect(result.current[0].get('new2')).toBe(20);
  });
});
