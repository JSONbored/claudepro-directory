import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getLayoutData } from './layout';
import { DEFAULT_LAYOUT_DATA } from './layout/constants';
import { getActiveAnnouncement } from './announcements';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Mock announcements
jest.mock('./announcements', () => ({
  getActiveAnnouncement: jest.fn(),
}));

// Mock logger - use simple pattern matching companies.test.ts
jest.mock('../logger.ts', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('layout data functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to default behavior
    jest.mocked(getActiveAnnouncement).mockResolvedValue(null);
  });

  describe('getLayoutData', () => {
    it('should return layout data with announcement when available', async () => {
      const mockAnnouncement = {
        id: 'announcement-1',
        title: 'Test Announcement',
        content: 'Test content',
      };
      jest.mocked(getActiveAnnouncement).mockResolvedValue(mockAnnouncement);

      const result = await getLayoutData();

      expect(result).toEqual({
        announcement: mockAnnouncement,
        navigationData: DEFAULT_LAYOUT_DATA.navigationData,
      });
      expect(getActiveAnnouncement).toHaveBeenCalled();
    });

    it('should return layout data with null announcement when not available', async () => {
      jest.mocked(getActiveAnnouncement).mockResolvedValue(null);

      const result = await getLayoutData();

      expect(result).toEqual({
        announcement: null,
        navigationData: DEFAULT_LAYOUT_DATA.navigationData,
      });
    });

    it('should handle announcement fetch errors gracefully', async () => {
      const fetchError = new Error('Failed to fetch announcement');
      jest.mocked(getActiveAnnouncement).mockRejectedValue(fetchError);

      const result = await getLayoutData();

      expect(result).toEqual({
        announcement: null,
        navigationData: DEFAULT_LAYOUT_DATA.navigationData,
      });
    });

    it('should handle string error reasons', async () => {
      jest.mocked(getActiveAnnouncement).mockRejectedValue('String error');

      const result = await getLayoutData();

      expect(result).toEqual({
        announcement: null,
        navigationData: DEFAULT_LAYOUT_DATA.navigationData,
      });
    });

    it('should return default layout data on catastrophic failure', async () => {
      // Mock Promise.allSettled to throw (simulating catastrophic failure)
      // This will trigger the catch block in getLayoutData
      const originalAllSettled = Promise.allSettled;
      Promise.allSettled = jest.fn(() => {
        throw new Error('Catastrophic failure');
      }) as any;

      const result = await getLayoutData();

      expect(result).toEqual(DEFAULT_LAYOUT_DATA);

      // Restore
      Promise.allSettled = originalAllSettled;
    });
  });
});

