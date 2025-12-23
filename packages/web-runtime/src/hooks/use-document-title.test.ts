/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './use-document-title';

describe('useDocumentTitle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.title = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('should handle unicode characters in title', () => {
    const unicodeTitle = 'Title with 🎉 emoji and 中文 characters';
    renderHook(() => useDocumentTitle(unicodeTitle));

    expect(document.title).toBe(unicodeTitle);
  });

  it('should handle title with newlines and tabs', () => {
    const titleWithWhitespace = 'Title\nwith\ttabs';
    renderHook(() => useDocumentTitle(titleWithWhitespace));

    // Browsers may normalize whitespace in document.title
    // The title should be set, but exact whitespace may vary
    expect(document.title).toBeTruthy();
    expect(document.title).toContain('Title');
    expect(document.title).toContain('with');
    expect(document.title).toContain('tabs');
  });

  it('should update title multiple times', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Title 1' },
    });

    expect(document.title).toBe('Title 1');

    rerender({ title: 'Title 2' });
    expect(document.title).toBe('Title 2');

    rerender({ title: 'Title 3' });
    expect(document.title).toBe('Title 3');
  });

  it('should handle same title being set multiple times', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Same Title' },
    });

    expect(document.title).toBe('Same Title');

    rerender({ title: 'Same Title' });
    expect(document.title).toBe('Same Title');
  });
});
