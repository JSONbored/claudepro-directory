import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './use-document-title';

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set document title', () => {
    renderHook(() => useDocumentTitle('Test Title'));

    expect(document.title).toBe('Test Title');
  });

  it('should update document title when title changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Initial Title' },
    });

    expect(document.title).toBe('Initial Title');

    rerender({ title: 'Updated Title' });

    expect(document.title).toBe('Updated Title');
  });

  it('should handle empty string title', () => {
    renderHook(() => useDocumentTitle(''));

    expect(document.title).toBe('');
  });

  it('should handle long titles', () => {
    const longTitle = 'A'.repeat(1000);
    renderHook(() => useDocumentTitle(longTitle));

    expect(document.title).toBe(longTitle);
  });

  it('should handle SSR (document undefined)', () => {
    const originalDocument = global.document;
    // @ts-expect-error - Intentionally setting document to undefined for SSR test
    global.document = undefined;

    // Should not throw
    renderHook(() => useDocumentTitle('Test Title'));

    // Restore
    global.document = originalDocument;
  });

  it('should handle special characters in title', () => {
    const specialTitle = 'Title with <script>alert("xss")</script> & "quotes"';
    renderHook(() => useDocumentTitle(specialTitle));

    expect(document.title).toBe(specialTitle);
  });
});
