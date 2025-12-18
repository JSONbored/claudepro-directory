import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecentlyViewed, getCategoryRoute } from './use-recently-viewed.ts';

// Mock dependencies
vi.mock('./use-debounce-callback', () => ({
  useDebounceCallback: vi.fn((fn, delay) => fn),
}));

vi.mock('../config/static-configs.ts', () => ({
  getRecentlyViewedConfig: vi.fn(() => ({
    'recently_viewed.max_items': 10,
    'recently_viewed.ttl_days': 30,
    'recently_viewed.max_description_length': 150,
    'recently_viewed.max_tags': 5,
  })),
  getTimeoutConfig: vi.fn(() => ({
    'timeout.ui.form_debounce_ms': 300,
  })),
}));

vi.mock('../logger.ts', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../errors.ts', () => ({
  normalizeError: vi.fn((err) => (err instanceof Error ? err : new Error(String(err)))),
}));

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty list', () => {
    const { result } = renderHook(() => useRecentlyViewed());

    expect(result.current.recentlyViewed).toEqual([]);
    expect(result.current.isLoaded).toBe(true);
  });

  it('should add item to recently viewed', async () => {
    const { result } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'test-agent',
        title: 'Test Agent',
        description: 'Test description',
      });
    });

    expect(result.current.recentlyViewed).toHaveLength(1);
    expect(result.current.recentlyViewed[0]?.slug).toBe('test-agent');
    expect(result.current.recentlyViewed[0]?.category).toBe('agent');
  });

  it('should move existing item to front (LRU)', async () => {
    const { result } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'agent-1',
        title: 'Agent 1',
        description: 'Description 1',
      });
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'agent-2',
        title: 'Agent 2',
        description: 'Description 2',
      });
    });

    expect(result.current.recentlyViewed[0]?.slug).toBe('agent-2');

    act(() => {
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'agent-1',
        title: 'Agent 1 Updated',
        description: 'Updated description',
      });
    });

    expect(result.current.recentlyViewed[0]?.slug).toBe('agent-1');
    expect(result.current.recentlyViewed).toHaveLength(2);
  });

  it('should remove item', async () => {
    const { result } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'test-agent',
        title: 'Test Agent',
        description: 'Test description',
      });
    });

    expect(result.current.recentlyViewed).toHaveLength(1);

    act(() => {
      result.current.removeItem('agent', 'test-agent');
    });

    expect(result.current.recentlyViewed).toHaveLength(0);
  });

  it('should clear all items', async () => {
    const { result } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'agent-1',
        title: 'Agent 1',
        description: 'Description 1',
      });
      result.current.addRecentlyViewed({
        category: 'mcp',
        slug: 'mcp-1',
        title: 'MCP 1',
        description: 'Description 2',
      });
    });

    expect(result.current.recentlyViewed).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.recentlyViewed).toHaveLength(0);
  });

  it('should enforce MAX_ITEMS limit', async () => {
    const { result } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Add 15 items (more than MAX_ITEMS = 10)
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: `agent-${i}`,
          title: `Agent ${i}`,
          description: `Description ${i}`,
        });
      });
    }

    expect(result.current.recentlyViewed).toHaveLength(10);
  });

  it('should sanitize description length', async () => {
    const { result } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const longDescription = 'a'.repeat(200);
    act(() => {
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'test-agent',
        title: 'Test Agent',
        description: longDescription,
      });
    });

    expect(result.current.recentlyViewed[0]?.description.length).toBeLessThanOrEqual(150);
  });

  it('should sanitize tags count', async () => {
    const { result } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'test-agent',
        title: 'Test Agent',
        description: 'Description',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
      });
    });

    expect(result.current.recentlyViewed[0]?.tags?.length).toBeLessThanOrEqual(5);
  });

  it('should persist to localStorage', async () => {
    const { result, unmount } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.addRecentlyViewed({
        category: 'agent',
        slug: 'test-agent',
        title: 'Test Agent',
        description: 'Test description',
      });
    });

    unmount();

    // Create new hook instance - should load from localStorage
    const { result: result2 } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result2.current.isLoaded).toBe(true);
    });

    expect(result2.current.recentlyViewed).toHaveLength(1);
    expect(result2.current.recentlyViewed[0]?.slug).toBe('test-agent');
  });

  it('should filter expired items on load', async () => {
    // Set up localStorage with expired item
    const expiredItem = {
      category: 'agent',
      slug: 'expired-agent',
      title: 'Expired Agent',
      description: 'Description',
      viewedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), // 31 days ago
    };

    const validItem = {
      category: 'agent',
      slug: 'valid-agent',
      title: 'Valid Agent',
      description: 'Description',
      viewedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      'heyclaude_recently_viewed',
      JSON.stringify([expiredItem, validItem])
    );

    const { result } = renderHook(() => useRecentlyViewed());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Should only have valid item
    expect(result.current.recentlyViewed).toHaveLength(1);
    expect(result.current.recentlyViewed[0]?.slug).toBe('valid-agent');
  });
});

describe('getCategoryRoute', () => {
  it('should map singular categories to plural routes', () => {
    expect(getCategoryRoute('agent')).toBe('agents');
    expect(getCategoryRoute('hook')).toBe('hooks');
    expect(getCategoryRoute('command')).toBe('commands');
    expect(getCategoryRoute('rule')).toBe('rules');
    expect(getCategoryRoute('statusline')).toBe('statuslines');
    expect(getCategoryRoute('skill')).toBe('skills');
  });

  it('should return unchanged for categories without pluralization', () => {
    expect(getCategoryRoute('mcp')).toBe('mcp');
    expect(getCategoryRoute('job')).toBe('jobs');
  });
});
