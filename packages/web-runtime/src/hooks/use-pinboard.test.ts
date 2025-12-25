/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePinboard, usePinboardStore } from './use-pinboard.ts';

// Mock dependencies
jest.mock('./use-pulse.ts', () => ({
  usePulse: jest.fn(() => ({
    bookmark: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined),
  })),
}));

jest.mock('../logger.ts', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../errors.ts', () => ({
  normalizeError: jest.fn((err) => (err instanceof Error ? err : new Error(String(err)))),
}));

describe('usePinboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage thoroughly
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      // Also clear the specific key used by the hook
      window.localStorage.removeItem('heyclaude_pinboard');
    }
    // Reset Zustand store state
    act(() => {
      usePinboardStore.setState({ pins: [], isLoaded: false });
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with empty pinboard', () => {
    const { result } = renderHook(() => usePinboard());

    expect(result.current.pinnedItems).toEqual([]);
    expect(result.current.isLoaded).toBe(true);
  });

  it('should pin an item', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    const mockBookmark = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(usePulse).mockReturnValue({
      bookmark: mockBookmark,
    } as any);

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'test-agent',
        title: 'Test Agent',
        description: 'Test description',
      });
    });

    expect(result.current.pinnedItems).toHaveLength(1);
    expect(result.current.pinnedItems[0]?.slug).toBe('test-agent');
    expect(result.current.pinnedItems[0]?.category).toBe('agents');
    expect(result.current.isPinned('agents', 'test-agent')).toBe(true);
  });

  it('should unpin an item', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    const mockBookmark = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(usePulse).mockReturnValue({
      bookmark: mockBookmark,
    } as any);

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'test-agent',
        title: 'Test Agent',
      });
    });

    expect(result.current.isPinned('agents', 'test-agent')).toBe(true);

    act(() => {
      result.current.unpinItem('agents', 'test-agent');
    });

    expect(result.current.pinnedItems).toHaveLength(0);
    expect(result.current.isPinned('agents', 'test-agent')).toBe(false);
  });

  it('should toggle pin state', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    const mockBookmark = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(usePulse).mockReturnValue({
      bookmark: mockBookmark,
    } as any);

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.togglePin({
        category: 'agents',
        slug: 'test-agent',
        title: 'Test Agent',
      });
    });

    expect(result.current.isPinned('agents', 'test-agent')).toBe(true);

    act(() => {
      result.current.togglePin({
        category: 'agents',
        slug: 'test-agent',
        title: 'Test Agent',
      });
    });

    expect(result.current.isPinned('agents', 'test-agent')).toBe(false);
  });

  it('should clear all pins', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    const mockBookmark = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(usePulse).mockReturnValue({
      bookmark: mockBookmark,
    } as any);

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'agent-1',
        title: 'Agent 1',
      });
      result.current.pinItem({
        category: 'mcp',
        slug: 'mcp-1',
        title: 'MCP 1',
      });
    });

    expect(result.current.pinnedItems).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.pinnedItems).toHaveLength(0);
  });

  it('should enforce MAX_PINS limit', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    const mockBookmark = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(usePulse).mockReturnValue({
      bookmark: mockBookmark,
    } as any);

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Pin 25 items (more than MAX_PINS = 20)
    for (let i = 0; i < 25; i++) {
      act(() => {
        result.current.pinItem({
          category: 'agents',
          slug: `agent-${i}`,
          title: `Agent ${i}`,
        });
      });
    }

    expect(result.current.pinnedItems).toHaveLength(20);
  });

  it('should move existing item to front (LRU)', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    const mockBookmark = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(usePulse).mockReturnValue({
      bookmark: mockBookmark,
    } as any);

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'agent-1',
        title: 'Agent 1',
      });
      result.current.pinItem({
        category: 'agents',
        slug: 'agent-2',
        title: 'Agent 2',
      });
    });

    const firstPinnedAt = result.current.pinnedItems[0]?.pinnedAt;

    // Wait a bit to ensure timestamps are different
    await new Promise((resolve) => setTimeout(resolve, 10));

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'agent-1',
        title: 'Agent 1 Updated',
      });
    });

    await waitFor(() => {
      expect(result.current.pinnedItems[0]?.slug).toBe('agent-1');
      expect(result.current.pinnedItems[0]?.pinnedAt).not.toBe(firstPinnedAt);
      expect(result.current.pinnedItems).toHaveLength(2);
    });
  });

  it('should sanitize item data', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    const mockBookmark = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(usePulse).mockReturnValue({
      bookmark: mockBookmark,
    } as any);

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'test-agent',
        title:
          '  Very Long Title That Exceeds 140 Characters And Should Be Truncated To Ensure We Dont Store Too Much Data In LocalStorage  ',
        description:
          'Very long description that exceeds 240 characters and should be truncated to ensure we do not store too much data in localStorage which could cause quota exceeded errors',
        typeName: 'Very Long Type Name That Exceeds 80 Characters And Should Be Truncated',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
      });
    });

    const item = result.current.pinnedItems[0];
    expect(item?.title.length).toBeLessThanOrEqual(140);
    expect(item?.title.trim()).toBe(item?.title);
    expect(item?.description?.length).toBeLessThanOrEqual(240);
    expect(item?.typeName?.length).toBeLessThanOrEqual(80);
    expect(item?.tags?.length).toBeLessThanOrEqual(6);
  });

  it('should track bookmark pulse events', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    const mockBookmark = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
    jest.mocked(usePulse).mockReturnValue({
      bookmark: mockBookmark,
    } as any);

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'test-agent',
        title: 'Test Agent',
      });
    });

    await waitFor(() => {
      expect(mockBookmark).toHaveBeenCalledWith({
        category: 'agents',
        slug: 'test-agent',
        action: 'add',
      });
    });

    act(() => {
      result.current.unpinItem('agents', 'test-agent');
    });

    await waitFor(() => {
      expect(mockBookmark).toHaveBeenCalledWith({
        category: 'agents',
        slug: 'test-agent',
        action: 'remove',
      });
    });
  });

  it('should persist pins to localStorage', async () => {
    const { usePulse } = await import('./use-pulse.ts');
    jest.mocked(usePulse).mockReturnValue({
      bookmark: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined),
    } as any);

    const { result, unmount } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'test-agent',
        title: 'Test Agent',
      });
    });

    // Wait for debounced save to complete (250ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 300));

    unmount();

    // Create new hook instance - should load from localStorage
    const { result: result2 } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result2.current.isLoaded).toBe(true);
    });

    expect(result2.current.pinnedItems).toHaveLength(1);
    expect(result2.current.pinnedItems[0]?.slug).toBe('test-agent');
  });

  it('should handle localStorage errors gracefully', async () => {
    // Clear localStorage before this test
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.localStorage.removeItem('heyclaude_pinboard');
    }

    const { usePulse } = await import('./use-pulse.ts');
    jest.mocked(usePulse).mockReturnValue({
      bookmark: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined),
    } as any);

    // Mock localStorage to allow isStorageAvailable() to pass, but make savePinsToStorage() fail
    const originalSetItem = window.localStorage.setItem;
    const originalRemoveItem = window.localStorage.removeItem;

    // Track calls to distinguish between isStorageAvailable() test and actual saves
    window.localStorage.setItem = jest.fn((key, value) => {
      // Allow the test item in isStorageAvailable() to be set
      if (key === '__pinboard_test__') {
        originalSetItem.call(window.localStorage, key, value);
        return;
      }
      // Throw error for actual pinboard saves
      throw new Error('QuotaExceededError');
    });

    window.localStorage.removeItem = jest.fn((key) => {
      if (key === '__pinboard_test__') {
        originalRemoveItem.call(window.localStorage, key);
      }
    });

    const { result } = renderHook(() => usePinboard());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pinItem({
        category: 'agents',
        slug: 'test-agent',
        title: 'Test Agent',
      });
    });

    // Should not crash, item should still be in state (state update happens before save)
    expect(result.current.pinnedItems).toHaveLength(1);

    // Wait for debounced save attempt (which will fail but shouldn't affect state)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // State should still be intact
    expect(result.current.pinnedItems).toHaveLength(1);

    // Restore
    window.localStorage.setItem = originalSetItem;
    window.localStorage.removeItem = originalRemoveItem;
  });
});
