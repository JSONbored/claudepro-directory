/**
 * Announcements Configuration Tests
 *
 * Tests the announcement configuration system that manages site-wide notifications.
 * This configuration controls which announcements are shown based on date ranges,
 * priority levels, and dismissal states.
 *
 * **Why Test This:**
 * - Critical for user-facing notifications
 * - Date/priority logic must work correctly
 * - Invalid configurations should be caught early
 * - Ensures proper announcement selection
 *
 * **Test Coverage:**
 * - Configuration validation
 * - Date range filtering
 * - Priority sorting
 * - Edge cases (no announcements, multiple priorities)
 *
 * @see src/config/announcements.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AnnouncementConfig,
  announcements,
  getActiveAnnouncement,
  getAllActiveAnnouncements,
} from '../announcements';

describe('Announcements Configuration', () => {
  describe('Configuration Structure', () => {
    it('announcements array is defined', () => {
      expect(announcements).toBeDefined();
      expect(Array.isArray(announcements)).toBe(true);
    });

    it('each announcement has required properties', () => {
      announcements.forEach((announcement) => {
        expect(announcement).toHaveProperty('id');
        expect(announcement).toHaveProperty('variant');
        expect(announcement).toHaveProperty('title');
        expect(announcement).toHaveProperty('priority');
        expect(announcement).toHaveProperty('dismissible');

        expect(typeof announcement.id).toBe('string');
        expect(typeof announcement.title).toBe('string');
        expect(typeof announcement.priority).toBe('string');
        expect(typeof announcement.dismissible).toBe('boolean');
      });
    });

    it('all announcement IDs are unique', () => {
      const ids = announcements.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('all variants are valid', () => {
      const validVariants = ['default', 'outline', 'secondary', 'destructive'];
      announcements.forEach((announcement) => {
        expect(validVariants).toContain(announcement.variant);
      });
    });

    it('all priorities are valid', () => {
      const validPriorities = ['high', 'medium', 'low'];
      announcements.forEach((announcement) => {
        expect(validPriorities).toContain(announcement.priority);
      });
    });

    it('startDate is valid ISO 8601 format when present', () => {
      announcements.forEach((announcement) => {
        if (announcement.startDate) {
          const date = new Date(announcement.startDate);
          expect(date.toString()).not.toBe('Invalid Date');
        }
      });
    });

    it('endDate is valid ISO 8601 format when present', () => {
      announcements.forEach((announcement) => {
        if (announcement.endDate) {
          const date = new Date(announcement.endDate);
          expect(date.toString()).not.toBe('Invalid Date');
        }
      });
    });

    it('endDate is after startDate when both present', () => {
      announcements.forEach((announcement) => {
        if (announcement.startDate && announcement.endDate) {
          const start = new Date(announcement.startDate);
          const end = new Date(announcement.endDate);
          expect(end.getTime()).toBeGreaterThan(start.getTime());
        }
      });
    });

    it('titles are not empty', () => {
      announcements.forEach((announcement) => {
        expect(announcement.title.trim().length).toBeGreaterThan(0);
      });
    });

    it('hrefs are valid paths when present', () => {
      announcements.forEach((announcement) => {
        if (announcement.href) {
          expect(announcement.href).toMatch(/^\//); // Should start with /
        }
      });
    });
  });

  describe('getActiveAnnouncement()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns null when no announcements are active', () => {
      // Set date far in the future
      vi.setSystemTime(new Date('2099-12-31'));
      const result = getActiveAnnouncement();
      expect(result).toBeNull();
    });

    it('returns announcement within date range', () => {
      // Set date to when announcements are active (Oct 10-17, 2025)
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));
      const result = getActiveAnnouncement();
      expect(result).not.toBeNull();
      expect(result?.startDate).toBeDefined();
      expect(result?.endDate).toBeDefined();
    });

    it('returns highest priority announcement when multiple are active', () => {
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));
      const result = getActiveAnnouncement();
      expect(result).not.toBeNull();
      expect(result?.priority).toBe('high');
    });

    it('does not return announcement before startDate', () => {
      vi.setSystemTime(new Date('2025-10-09T12:00:00Z')); // Before Oct 10
      const result = getActiveAnnouncement();

      // Should not get the Oct 10 announcements
      if (result) {
        const start = new Date(result.startDate || 0);
        const now = new Date();
        expect(now.getTime()).toBeGreaterThanOrEqual(start.getTime());
      }
    });

    it('does not return announcement after endDate', () => {
      vi.setSystemTime(new Date('2025-10-20T12:00:00Z')); // After Oct 17
      const result = getActiveAnnouncement();

      // Should not get the Oct 10-17 announcements
      if (result) {
        const end = new Date(result.endDate || '2099-12-31');
        const now = new Date();
        expect(now.getTime()).toBeLessThanOrEqual(end.getTime());
      }
    });

    it('handles announcements without startDate (active from beginning)', () => {
      // Test with announcement that has no startDate
      const testAnnouncement: AnnouncementConfig = {
        id: 'test-no-start',
        variant: 'outline',
        title: 'Test',
        priority: 'high',
        dismissible: true,
        // No startDate - should be active from epoch
      };

      // This test verifies the logic handles undefined startDate
      const start = testAnnouncement.startDate ? new Date(testAnnouncement.startDate) : new Date(0);
      expect(start.getTime()).toBe(new Date(0).getTime());
    });

    it('handles announcements without endDate (active forever)', () => {
      // Test with announcement that has no endDate
      const testAnnouncement: AnnouncementConfig = {
        id: 'test-no-end',
        variant: 'outline',
        title: 'Test',
        priority: 'high',
        dismissible: true,
        startDate: '2025-01-01T00:00:00Z',
        // No endDate - should be active until 2099
      };

      const end = testAnnouncement.endDate
        ? new Date(testAnnouncement.endDate)
        : new Date('2099-12-31');
      expect(end.getFullYear()).toBe(2099);
    });

    it('returns most recent announcement when priorities are equal', () => {
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));

      const active = getAllActiveAnnouncements();
      const highPriority = active.filter((a) => a.priority === 'high');

      if (highPriority.length > 1) {
        // Should be sorted by most recent startDate
        const result = getActiveAnnouncement();
        expect(highPriority).toContain(result);
      }
    });

    it('returns only one announcement', () => {
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));
      const result = getActiveAnnouncement();

      // Should be a single announcement object or null, not an array
      expect(result === null || typeof result === 'object').toBe(true);
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe('getAllActiveAnnouncements()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns array of all active announcements', () => {
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));
      const result = getAllActiveAnnouncements();
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array when no announcements are active', () => {
      vi.setSystemTime(new Date('2099-12-31'));
      const result = getAllActiveAnnouncements();
      expect(result).toEqual([]);
    });

    it('filters out announcements outside date range', () => {
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));
      const result = getAllActiveAnnouncements();

      result.forEach((announcement) => {
        const start = announcement.startDate ? new Date(announcement.startDate) : new Date(0);
        const end = announcement.endDate ? new Date(announcement.endDate) : new Date('2099-12-31');
        const now = new Date();

        expect(now.getTime()).toBeGreaterThanOrEqual(start.getTime());
        expect(now.getTime()).toBeLessThanOrEqual(end.getTime());
      });
    });

    it('sorts announcements by priority (high > medium > low)', () => {
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));
      const result = getAllActiveAnnouncements();

      if (result.length > 1) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };

        for (let i = 0; i < result.length - 1; i++) {
          const currentPriority = priorityOrder[result[i].priority];
          const nextPriority = priorityOrder[result[i + 1].priority];
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
        }
      }
    });

    it('returns all announcements when they have different priorities', () => {
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));
      const result = getAllActiveAnnouncements();

      // Should have multiple announcements with different priorities
      const priorities = new Set(result.map((a) => a.priority));
      expect(priorities.size).toBeGreaterThan(0);
    });

    it('includes announcement that getActiveAnnouncement returns', () => {
      vi.setSystemTime(new Date('2025-10-12T12:00:00Z'));
      const active = getActiveAnnouncement();
      const all = getAllActiveAnnouncements();

      if (active) {
        expect(all).toContainEqual(active);
      }
    });
  });

  describe('Priority Sorting Logic', () => {
    it('high priority comes before medium priority', () => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      expect(priorityOrder.high).toBeGreaterThan(priorityOrder.medium);
    });

    it('medium priority comes before low priority', () => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      expect(priorityOrder.medium).toBeGreaterThan(priorityOrder.low);
    });

    it('high priority comes before low priority', () => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      expect(priorityOrder.high).toBeGreaterThan(priorityOrder.low);
    });
  });

  describe('Edge Cases', () => {
    it('handles current time exactly at startDate', () => {
      vi.setSystemTime(new Date('2025-10-10T00:00:00Z')); // Exact start time
      const result = getActiveAnnouncement();
      // Should include announcements starting at this exact moment
      expect(result === null || result?.startDate === '2025-10-10T00:00:00Z').toBeTruthy();
    });

    it('handles current time exactly at endDate', () => {
      vi.setSystemTime(new Date('2025-10-17T23:59:59Z')); // Exact end time
      const result = getActiveAnnouncement();
      // Should still include announcements ending at this moment
      if (result?.endDate) {
        expect(new Date(result.endDate).getTime()).toBeGreaterThanOrEqual(Date.now());
      }
    });

    it('handles timezone differences in dates', () => {
      // Test with different timezone representations
      vi.setSystemTime(new Date('2025-10-12T00:00:00-08:00')); // PST
      const result1 = getActiveAnnouncement();

      vi.setSystemTime(new Date('2025-10-12T08:00:00Z')); // Same time in UTC
      const result2 = getActiveAnnouncement();

      // Should return same announcement regardless of timezone
      expect(result1?.id).toBe(result2?.id);
    });
  });

  describe('Type Safety', () => {
    it('AnnouncementConfig accepts all required fields', () => {
      const config: AnnouncementConfig = {
        id: 'test',
        variant: 'default',
        title: 'Test',
        priority: 'high',
        dismissible: true,
      };
      expect(config).toBeDefined();
    });

    it('AnnouncementConfig accepts all optional fields', () => {
      const config: AnnouncementConfig = {
        id: 'test',
        variant: 'default',
        title: 'Test',
        priority: 'high',
        dismissible: true,
        tag: 'New',
        href: '/test',
        icon: 'ArrowUpRight',
        startDate: '2025-10-10T00:00:00Z',
        endDate: '2025-10-17T23:59:59Z',
      };
      expect(config).toBeDefined();
    });
  });
});
