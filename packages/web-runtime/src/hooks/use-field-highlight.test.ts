import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFieldHighlight } from './use-field-highlight';

describe('useFieldHighlight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with no highlighted fields', () => {
    const { result } = renderHook(() => useFieldHighlight());

    expect(result.current.highlightedFieldsCount).toBe(0);
    expect(result.current.isHighlighted('field1')).toBe(false);
  });

  it('should highlight a single field', () => {
    const { result } = renderHook(() => useFieldHighlight());

    act(() => {
      result.current.highlightField('field1');
    });

    expect(result.current.isHighlighted('field1')).toBe(true);
    expect(result.current.highlightedFieldsCount).toBe(1);
  });

  it('should highlight multiple fields', () => {
    const { result } = renderHook(() => useFieldHighlight());

    act(() => {
      result.current.highlightFields(['field1', 'field2', 'field3']);
    });

    expect(result.current.isHighlighted('field1')).toBe(true);
    expect(result.current.isHighlighted('field2')).toBe(true);
    expect(result.current.isHighlighted('field3')).toBe(true);
    expect(result.current.highlightedFieldsCount).toBe(3);
  });

  it('should auto-remove highlight after duration', () => {
    const { result } = renderHook(() => useFieldHighlight());

    act(() => {
      result.current.highlightField('field1');
    });

    expect(result.current.isHighlighted('field1')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000); // HIGHLIGHT_DURATION
    });

    expect(result.current.isHighlighted('field1')).toBe(false);
    expect(result.current.highlightedFieldsCount).toBe(0);
  });

  it('should clear all highlights immediately', () => {
    const { result } = renderHook(() => useFieldHighlight());

    act(() => {
      result.current.highlightFields(['field1', 'field2', 'field3']);
    });

    expect(result.current.highlightedFieldsCount).toBe(3);

    act(() => {
      result.current.clearHighlights();
    });

    expect(result.current.highlightedFieldsCount).toBe(0);
    expect(result.current.isHighlighted('field1')).toBe(false);
  });

  it('should return highlight classes for highlighted field', () => {
    const { result } = renderHook(() => useFieldHighlight());

    act(() => {
      result.current.highlightField('field1');
    });

    const classes = result.current.getHighlightClasses('field1');
    expect(classes).toContain('animate-pulse');
    expect(classes).toContain('ring-2');
  });

  it('should return empty string for non-highlighted field', () => {
    const { result } = renderHook(() => useFieldHighlight());

    const classes = result.current.getHighlightClasses('field1');
    expect(classes).toBe('');
  });

  it('should return highlight styles for highlighted field', () => {
    const { result } = renderHook(() => useFieldHighlight());

    act(() => {
      result.current.highlightField('field1');
    });

    const styles = result.current.getHighlightStyles('field1');
    expect(styles.boxShadow).toBeDefined();
    expect(styles.transition).toBeDefined();
  });

  it('should return empty object for non-highlighted field', () => {
    const { result } = renderHook(() => useFieldHighlight());

    const styles = result.current.getHighlightStyles('field1');
    expect(styles).toEqual({});
  });

  it('should handle rapid successive highlights', () => {
    const { result } = renderHook(() => useFieldHighlight());

    act(() => {
      result.current.highlightField('field1');
    });

    act(() => {
      vi.advanceTimersByTime(1000); // Halfway through duration
    });

    act(() => {
      result.current.highlightField('field1'); // Highlight again
    });

    act(() => {
      vi.advanceTimersByTime(1000); // First highlight would expire, but second is still active
    });

    // Should still be highlighted (second highlight)
    expect(result.current.isHighlighted('field1')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000); // Complete second highlight duration
    });

    expect(result.current.isHighlighted('field1')).toBe(false);
  });

  it('should handle highlighting same field multiple times', () => {
    const { result } = renderHook(() => useFieldHighlight());

    act(() => {
      result.current.highlightField('field1');
      result.current.highlightField('field1');
      result.current.highlightField('field1');
    });

    // Should only count once
    expect(result.current.highlightedFieldsCount).toBe(1);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useFieldHighlight());

    const firstHighlight = result.current.highlightField;
    const firstClear = result.current.clearHighlights;
    const firstIsHighlighted = result.current.isHighlighted;

    rerender();

    const secondHighlight = result.current.highlightField;
    const secondClear = result.current.clearHighlights;
    const secondIsHighlighted = result.current.isHighlighted;

    expect(firstHighlight).toBe(secondHighlight);
    expect(firstClear).toBe(secondClear);
    expect(firstIsHighlighted).toBe(secondIsHighlighted);
  });
});
