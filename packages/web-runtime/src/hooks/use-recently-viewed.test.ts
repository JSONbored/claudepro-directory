import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecentlyViewed, getCategoryRoute, type RecentlyViewedItem } from './use-recently-viewed';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock logger
vi.mock('../entries/core', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock static configs
vi.mock('../config/static-configs', () => ({
  getRecentlyViewedConfig: () => ({
    'recently_viewed.max_items': 10,
    'recently_viewed.ttl_days': 30,
    'recently_viewed.max_description_length': 150,
    'recently_viewed.max_tags': 5,
  }),
  getTimeoutConfig: () => ({
    'timeout.ui.form_debounce_ms': 300,
  }),
}));

describe('getCategoryRoute', () => {
  it('should map singular categories to plural routes', () => {
    expect(getCategoryRoute('agent')).toBe('agents');
    expect(getCategoryRoute('hook')).toBe('hooks');
    expect(getCategoryRoute('command')).toBe('commands');
    expect(getCategoryRoute('rule')).toBe('rules');
    expect(getCategoryRoute('skill')).toBe('skills');
    expect(getCategoryRoute('job')).toBe('jobs');
    expect(getCategoryRoute('statusline')).toBe('statuslines');
  });

  it('should return mcp unchanged', () => {
    expect(getCategoryRoute('mcp')).toBe('mcp');
  });
});

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with empty items when localStorage is empty', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      expect(result.current.recentlyViewed).toEqual([]);
      expect(result.current.isLoaded).toBe(true);
    });

    it('should load items from localStorage on mount', () => {
      const mockItems: RecentlyViewedItem[] = [
        {
          category: 'agent',
          slug: 'test-agent',
          title: 'Test Agent',
          description: 'A test agent',
          viewedAt: new Date().toISOString(),
        },
      ];
      localStorageMock.setItem('heyclaude_recently_viewed', JSON.stringify(mockItems));

      const { result } = renderHook(() => useRecentlyViewed());

      waitFor(() => {
        expect(result.current.recentlyViewed).toHaveLength(1);
        expect(result.current.recentlyViewed[0]?.slug).toBe('test-agent');
      });
    });

    it('should filter out expired items based on TTL', () => {
      const expiredItem: RecentlyViewedItem = {
        category: 'agent',
        slug: 'expired-agent',
        title: 'Expired Agent',
        description: 'An expired agent',
        viewedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), // 31 days ago
      };
      const validItem: RecentlyViewedItem = {
        category: 'hook',
        slug: 'valid-hook',
        title: 'Valid Hook',
        description: 'A valid hook',
        viewedAt: new Date().toISOString(),
      };
      localStorageMock.setItem(
        'heyclaude_recently_viewed',
        JSON.stringify([expiredItem, validItem])
      );

      const { result } = renderHook(() => useRecentlyViewed());

      waitFor(() => {
        expect(result.current.recentlyViewed).toHaveLength(1);
        expect(result.current.recentlyViewed[0]?.slug).toBe('valid-hook');
      });
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem('heyclaude_recently_viewed', 'invalid json');

      const { result } = renderHook(() => useRecentlyViewed());

      expect(result.current.recentlyViewed).toEqual([]);
      expect(result.current.isLoaded).toBe(true);
    });

    it('should handle non-array localStorage data', () => {
      localStorageMock.setItem('heyclaude_recently_viewed', JSON.stringify({ invalid: 'data' }));

      const { result } = renderHook(() => useRecentlyViewed());

      expect(result.current.recentlyViewed).toEqual([]);
    });
  });

  describe('addRecentlyViewed', () => {
    it('should add a new item to the list', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'new-agent',
          title: 'New Agent',
          description: 'A new agent',
        });
      });

      expect(result.current.recentlyViewed).toHaveLength(1);
      expect(result.current.recentlyViewed[0]?.slug).toBe('new-agent');
      expect(result.current.recentlyViewed[0]?.viewedAt).toBeDefined();
    });

    it('should move existing item to front (LRU)', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
        });
        result.current.addRecentlyViewed({
          category: 'hook',
          slug: 'hook-1',
          title: 'Hook 1',
          description: 'First hook',
        });
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent updated',
        });
      });

      expect(result.current.recentlyViewed).toHaveLength(2);
      expect(result.current.recentlyViewed[0]?.slug).toBe('agent-1');
      expect(result.current.recentlyViewed[1]?.slug).toBe('hook-1');
    });

    it('should truncate description to max length', () => {
      const { result } = renderHook(() => useRecentlyViewed());
      const longDescription = 'A'.repeat(200);

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: longDescription,
        });
      });

      expect(result.current.recentlyViewed[0]?.description).toHaveLength(150);
    });

    it('should limit tags to max count', () => {
      const { result } = renderHook(() => useRecentlyViewed());
      const manyTags = Array.from({ length: 10 }, (_, i) => `tag-${i}`);

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'Test',
          tags: manyTags,
        });
      });

      expect(result.current.recentlyViewed[0]?.tags).toHaveLength(5);
    });

    it('should enforce max items limit', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        // Add 11 items (max is 10)
        for (let i = 0; i < 11; i++) {
          result.current.addRecentlyViewed({
            category: 'agent',
            slug: `agent-${i}`,
            title: `Agent ${i}`,
            description: `Agent ${i} description`,
          });
        }
      });

      expect(result.current.recentlyViewed).toHaveLength(10);
      expect(result.current.recentlyViewed[0]?.slug).toBe('agent-10');
      expect(result.current.recentlyViewed[9]?.slug).toBe('agent-1');
    });

    it('should persist to localStorage', async () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'persist-test',
          title: 'Persist Test',
          description: 'Testing persistence',
        });
      });

      // Wait for debounced save
      await vi.waitFor(
        () => {
          const stored = localStorageMock.getItem('heyclaude_recently_viewed');
          expect(stored).toBeTruthy();
          const parsed = JSON.parse(stored!);
          expect(parsed[0]?.slug).toBe('persist-test');
        },
        { timeout: 500 }
      );
    });
  });

  describe('removeItem', () => {
    it('should remove a specific item by category and slug', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
        });
        result.current.addRecentlyViewed({
          category: 'hook',
          slug: 'hook-1',
          title: 'Hook 1',
          description: 'First hook',
        });
      });

      act(() => {
        result.current.removeItem('agent', 'agent-1');
      });

      expect(result.current.recentlyViewed).toHaveLength(1);
      expect(result.current.recentlyViewed[0]?.slug).toBe('hook-1');
    });

    it('should persist removal to localStorage immediately', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
        });
      });

      act(() => {
        result.current.removeItem('agent', 'agent-1');
      });

      const stored = localStorageMock.getItem('heyclaude_recently_viewed');
      expect(stored).toBe('[]');
    });

    it('should not affect other items when removing', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
        });
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-2',
          title: 'Agent 2',
          description: 'Second agent',
        });
      });

      act(() => {
        result.current.removeItem('agent', 'agent-1');
      });

      expect(result.current.recentlyViewed).toHaveLength(1);
      expect(result.current.recentlyViewed[0]?.slug).toBe('agent-2');
    });
  });

  describe('clearAll', () => {
    it('should remove all items', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
        });
        result.current.addRecentlyViewed({
          category: 'hook',
          slug: 'hook-1',
          title: 'Hook 1',
          description: 'First hook',
        });
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.recentlyViewed).toEqual([]);
    });

    it('should clear localStorage', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
        });
      });

      act(() => {
        result.current.clearAll();
      });

      const stored = localStorageMock.getItem('heyclaude_recently_viewed');
      expect(stored).toBe('[]');
    });
  });

  describe('edge cases', () => {
    it('should handle localStorage quota exceeded', () => {
      const { result } = renderHook(() => useRecentlyViewed());
      
      // Mock quota exceeded error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
        });
      });

      // Should not throw, should handle gracefully
      expect(result.current.recentlyViewed).toHaveLength(1);

      // Restore original
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle missing category field', () => {
      const mockItems = [
        {
          slug: 'test-item',
          title: 'Test Item',
          description: 'Test',
          viewedAt: new Date().toISOString(),
          // missing category
        },
      ];
      localStorageMock.setItem('heyclaude_recently_viewed', JSON.stringify(mockItems));

      const { result } = renderHook(() => useRecentlyViewed());

      waitFor(() => {
        expect(result.current.recentlyViewed).toEqual([]);
      });
    });

    it('should handle items with no tags gracefully', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
          // no tags field
        });
      });

      expect(result.current.recentlyViewed[0]?.tags).toBeUndefined();
    });

    it('should handle empty tags array', () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addRecentlyViewed({
          category: 'agent',
          slug: 'agent-1',
          title: 'Agent 1',
          description: 'First agent',
          tags: [],
        });
      });

      expect(result.current.recentlyViewed[0]?.tags).toBeUndefined();
    });
  });

  describe('SSR compatibility', () => {
    it('should handle window being undefined', () => {
      // This test verifies the code doesn't crash in SSR context
      const { result } = renderHook(() => useRecentlyViewed());
      
      expect(result.current.recentlyViewed).toBeDefined();
      expect(result.current.isLoaded).toBe(true);
    });
  });
});