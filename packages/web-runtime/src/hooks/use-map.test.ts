import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMap } from './use-map.ts';

describe('useMap', () => {
  it('should initialize with empty Map by default', () => {
    const [map] = renderHook(() => useMap<string, number>()).result.current;

    expect(map.size).toBe(0);
  });

  it('should initialize with Map instance', () => {
    const initialMap = new Map([['a', 1], ['b', 2]]);
    const [map] = renderHook(() => useMap(initialMap)).result.current;

    expect(map.size).toBe(2);
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
  });

  it('should initialize with entries array', () => {
    const entries: Array<[string, number]> = [['a', 1], ['b', 2]];
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

    const newMap = new Map([['key2', 200], ['key3', 300]]);
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

    const entries: Array<[string, number]> = [['key1', 100], ['key2', 200]];
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
});
