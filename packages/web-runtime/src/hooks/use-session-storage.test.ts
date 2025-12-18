import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionStorage } from './use-session-storage.ts';

// Mock logger
vi.mock('../logger.ts', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('useSessionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
  });

  it('should initialize with default value when no stored value', () => {
    const { result } = renderHook(() =>
      useSessionStorage('test-key', 'default')
    );

    expect(result.current[0]).toBe('default');
  });

  it('should load value from sessionStorage', () => {
    window.sessionStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      useSessionStorage('test-key', 'default')
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update sessionStorage when value changes', () => {
    const { result } = renderHook(() =>
      useSessionStorage('test-key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(window.sessionStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should remove value from sessionStorage', () => {
    window.sessionStorage.setItem('test-key', JSON.stringify('value'));

    const { result } = renderHook(() =>
      useSessionStorage('test-key', 'default')
    );

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe('default');
    expect(window.sessionStorage.getItem('test-key')).toBeNull();
  });

  it('should handle functional updates', () => {
    const { result } = renderHook(() =>
      useSessionStorage('test-key', 0)
    );

    act(() => {
      result.current[1]((prev) => (prev as number) + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should handle custom serializer/deserializer', () => {
    const serializer = (value: { id: number }) => `${value.id}`;
    const deserializer = (value: string) => ({ id: Number(value) });

    const { result } = renderHook(() =>
      useSessionStorage('test-key', { id: 0 }, { serializer, deserializer })
    );

    act(() => {
      result.current[1]({ id: 42 });
    });

    expect(result.current[0]).toEqual({ id: 42 });
    expect(window.sessionStorage.getItem('test-key')).toBe('42');
  });

  it('should handle sessionStorage errors gracefully', () => {
    const originalSetItem = window.sessionStorage.setItem;
    window.sessionStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() =>
      useSessionStorage('test-key', 'default')
    );

    act(() => {
      result.current[1]('new-value');
    });

    // Should not crash
    expect(result.current[0]).toBe('new-value');

    window.sessionStorage.setItem = originalSetItem;
  });

  it('should handle SSR safely', () => {
    const originalWindow = global.window;
    delete (global as any).window;

    const { result } = renderHook(() =>
      useSessionStorage('test-key', 'default')
    );

    expect(result.current[0]).toBe('default');

    global.window = originalWindow;
  });
});
