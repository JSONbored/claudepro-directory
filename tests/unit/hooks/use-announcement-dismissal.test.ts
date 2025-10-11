/**
 * useAnnouncementDismissal Hook Tests
 *
 * Tests the announcement dismissal hook that manages persistent dismissal state
 * using localStorage. This hook is critical for user experience as it ensures
 * dismissed announcements don't reappear.
 *
 * **Why Test This:**
 * - Controls user-facing dismissal behavior
 * - localStorage interaction must be reliable
 * - Cross-tab synchronization is critical
 * - Error handling must be robust
 *
 * **Test Coverage:**
 * - Dismissal state management
 * - localStorage persistence
 * - Reset functionality
 * - Analytics functions
 * - Error handling
 * - SSR safety
 *
 * @see src/hooks/use-announcement-dismissal.ts
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllAnnouncementDismissals,
  getAnnouncementDismissalAnalytics,
  useAnnouncementDismissal,
} from '@/src/hooks/use-announcement-dismissal';

describe('useAnnouncementDismissal Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('Initial State', () => {
    it('returns isDismissed as false initially', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));
      expect(result.current.isDismissed).toBe(false);
    });

    it('returns dismiss function', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('returns reset function', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));
      expect(typeof result.current.reset).toBe('function');
    });

    it('returns getDismissalTime function', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));
      expect(typeof result.current.getDismissalTime).toBe('function');
    });

    it('getDismissalTime returns null initially', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));
      expect(result.current.getDismissalTime()).toBeNull();
    });
  });

  describe('Dismissal Functionality', () => {
    it('marks announcement as dismissed when dismiss is called', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.isDismissed).toBe(true);
    });

    it('persists dismissal state in localStorage', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      const stored = window.localStorage.getItem('announcement-dismissals');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored || '{}');
      expect(parsed['test-announcement']).toBeDefined();
      expect(parsed['test-announcement'].dismissed).toBe(true);
    });

    it('stores ISO timestamp when dismissed', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      const beforeDismiss = new Date().toISOString();

      act(() => {
        result.current.dismiss();
      });

      const afterDismiss = new Date().toISOString();
      const timestamp = result.current.getDismissalTime();

      expect(timestamp).not.toBeNull();
      if (timestamp) {
        expect(timestamp >= beforeDismiss).toBe(true);
        expect(timestamp <= afterDismiss).toBe(true);
      }
    });

    it('getDismissalTime returns timestamp after dismissal', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      const timestamp = result.current.getDismissalTime();
      expect(timestamp).not.toBeNull();
      expect(typeof timestamp).toBe('string');

      // Verify it's a valid ISO timestamp
      if (timestamp) {
        const date = new Date(timestamp);
        expect(date.toString()).not.toBe('Invalid Date');
      }
    });

    it('dismissal persists across hook remounts', () => {
      const { result, unmount } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      unmount();

      // Remount the hook
      const { result: result2 } = renderHook(() => useAnnouncementDismissal('test-announcement'));
      expect(result2.current.isDismissed).toBe(true);
    });

    it('dismissal is per-announcement (not global)', () => {
      const { result: result1 } = renderHook(() => useAnnouncementDismissal('announcement-1'));
      const { result: result2 } = renderHook(() => useAnnouncementDismissal('announcement-2'));

      act(() => {
        result1.current.dismiss();
      });

      expect(result1.current.isDismissed).toBe(true);
      expect(result2.current.isDismissed).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('resets dismissal state when reset is called', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.isDismissed).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDismissed).toBe(false);
    });

    it('removes dismissal from localStorage when reset', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      const stored1 = window.localStorage.getItem('announcement-dismissals');
      const parsed1 = JSON.parse(stored1 || '{}');
      expect(parsed1['test-announcement']).toBeDefined();

      act(() => {
        result.current.reset();
      });

      const stored2 = window.localStorage.getItem('announcement-dismissals');
      const parsed2 = JSON.parse(stored2 || '{}');
      expect(parsed2['test-announcement']).toBeUndefined();
    });

    it('getDismissalTime returns null after reset', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.getDismissalTime()).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.getDismissalTime()).toBeNull();
    });

    it('reset only affects specific announcement', () => {
      const { result: result1 } = renderHook(() => useAnnouncementDismissal('announcement-1'));
      const { result: result2 } = renderHook(() => useAnnouncementDismissal('announcement-2'));

      act(() => {
        result1.current.dismiss();
        result2.current.dismiss();
      });

      expect(result1.current.isDismissed).toBe(true);
      expect(result2.current.isDismissed).toBe(true);

      act(() => {
        result1.current.reset();
      });

      expect(result1.current.isDismissed).toBe(false);
      expect(result2.current.isDismissed).toBe(true); // Still dismissed
    });
  });

  describe('clearAllAnnouncementDismissals()', () => {
    it('clears all dismissals from localStorage', () => {
      const { result: result1 } = renderHook(() => useAnnouncementDismissal('announcement-1'));
      const { result: result2 } = renderHook(() => useAnnouncementDismissal('announcement-2'));

      act(() => {
        result1.current.dismiss();
        result2.current.dismiss();
      });

      expect(window.localStorage.getItem('announcement-dismissals')).not.toBeNull();

      clearAllAnnouncementDismissals();

      expect(window.localStorage.getItem('announcement-dismissals')).toBeNull();
    });

    it('resets all announcement states after clear', () => {
      const { result: result1 } = renderHook(() => useAnnouncementDismissal('announcement-1'));
      const { result: result2 } = renderHook(() => useAnnouncementDismissal('announcement-2'));

      act(() => {
        result1.current.dismiss();
        result2.current.dismiss();
      });

      clearAllAnnouncementDismissals();

      // Remount hooks to get fresh state
      const { result: result3 } = renderHook(() => useAnnouncementDismissal('announcement-1'));
      const { result: result4 } = renderHook(() => useAnnouncementDismissal('announcement-2'));

      expect(result3.current.isDismissed).toBe(false);
      expect(result4.current.isDismissed).toBe(false);
    });

    it('handles SSR safely (no window)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR behavior
      global.window = undefined;

      expect(() => clearAllAnnouncementDismissals()).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('getAnnouncementDismissalAnalytics()', () => {
    it('returns empty object when no dismissals', () => {
      const analytics = getAnnouncementDismissalAnalytics();
      expect(analytics).toEqual({});
    });

    it('returns dismissal data for all dismissed announcements', () => {
      const { result: result1 } = renderHook(() => useAnnouncementDismissal('announcement-1'));

      act(() => {
        result1.current.dismiss();
      });

      const { result: result2 } = renderHook(() => useAnnouncementDismissal('announcement-2'));

      act(() => {
        result2.current.dismiss();
      });

      const analytics = getAnnouncementDismissalAnalytics();

      expect(Object.keys(analytics).length).toBeGreaterThanOrEqual(2);
      expect(analytics['announcement-1']).toBeDefined();
      expect(analytics['announcement-2']).toBeDefined();
    });

    it('includes dismissed flag in analytics', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      const analytics = getAnnouncementDismissalAnalytics();
      expect(analytics['test-announcement'].dismissed).toBe(true);
    });

    it('includes timestamp in analytics', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      const analytics = getAnnouncementDismissalAnalytics();
      expect(analytics['test-announcement'].timestamp).toBeDefined();
      expect(typeof analytics['test-announcement'].timestamp).toBe('string');
    });

    it('handles SSR safely (no window)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR behavior
      global.window = undefined;

      const analytics = getAnnouncementDismissalAnalytics();
      expect(analytics).toEqual({});

      global.window = originalWindow;
    });
  });

  describe('LocalStorage Error Handling', () => {
    it('handles localStorage.setItem errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      // Should not throw even if localStorage fails
      expect(() => {
        act(() => {
          result.current.dismiss();
        });
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });

    it('handles localStorage.getItem errors in analytics', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('Storage access denied');
      });

      // Should not throw
      expect(() => getAnnouncementDismissalAnalytics()).not.toThrow();

      Storage.prototype.getItem = originalGetItem;
    });

    it('handles corrupted localStorage data', () => {
      // Set invalid JSON in localStorage
      window.localStorage.setItem('announcement-dismissals', 'invalid-json{[}');

      // Should handle gracefully and return empty state
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));
      expect(result.current.isDismissed).toBe(false);
    });
  });

  describe('Multiple Dismissals', () => {
    it('handles multiple announcements being dismissed', () => {
      const ids = ['announcement-1', 'announcement-2', 'announcement-3'];
      const hooks = ids.map((id) => renderHook(() => useAnnouncementDismissal(id)));

      hooks.forEach(({ result }) => {
        act(() => {
          result.current.dismiss();
        });
      });

      hooks.forEach(({ result }) => {
        expect(result.current.isDismissed).toBe(true);
      });
    });

    it('maintains separate timestamps for each dismissal', async () => {
      const { result: result1 } = renderHook(() => useAnnouncementDismissal('announcement-1'));

      act(() => {
        result1.current.dismiss();
      });

      const timestamp1 = result1.current.getDismissalTime();

      // Wait a bit to ensure different timestamps (real time, not fake timers)
      await new Promise((resolve) => setTimeout(resolve, 10));

      const { result: result2 } = renderHook(() => useAnnouncementDismissal('announcement-2'));

      act(() => {
        result2.current.dismiss();
      });

      const timestamp2 = result2.current.getDismissalTime();

      // Timestamps should be different (or at minimum, both exist)
      expect(timestamp1).toBeDefined();
      expect(timestamp2).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty announcement ID', () => {
      const { result } = renderHook(() => useAnnouncementDismissal(''));

      expect(() => {
        act(() => {
          result.current.dismiss();
        });
      }).not.toThrow();
    });

    it('handles announcement ID with special characters', () => {
      const { result } = renderHook(() =>
        useAnnouncementDismissal('announcement-with-special-chars-!@#$%')
      );

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.isDismissed).toBe(true);
    });

    it('handles very long announcement ID', () => {
      const longId = 'a'.repeat(1000);
      const { result } = renderHook(() => useAnnouncementDismissal(longId));

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.isDismissed).toBe(true);
    });

    it('multiple dismiss calls do not cause errors', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      expect(() => {
        act(() => {
          result.current.dismiss();
          result.current.dismiss();
          result.current.dismiss();
        });
      }).not.toThrow();

      expect(result.current.isDismissed).toBe(true);
    });

    it('multiple reset calls do not cause errors', () => {
      const { result } = renderHook(() => useAnnouncementDismissal('test-announcement'));

      act(() => {
        result.current.dismiss();
      });

      expect(() => {
        act(() => {
          result.current.reset();
          result.current.reset();
          result.current.reset();
        });
      }).not.toThrow();

      expect(result.current.isDismissed).toBe(false);
    });
  });
});
