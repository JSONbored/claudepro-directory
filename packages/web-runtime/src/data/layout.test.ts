import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getLayoutData } from './layout';
import { DEFAULT_LAYOUT_DATA } from './layout/constants';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock announcements
const mockGetActiveAnnouncement = vi.fn();
vi.mock('./announcements', () => ({
  getActiveAnnouncement: () => mockGetActiveAnnouncement(),
}));

// Mock logger - use globalThis to avoid hoisting issues
vi.mock('../logger', () => {
  if (!(globalThis as any).__layoutLoggerMocks) {
    (globalThis as any).__layoutLoggerMocks = {
      info: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => ({
        info: (globalThis as any).__layoutLoggerMocks.info,
        error: (globalThis as any).__layoutLoggerMocks.error,
      })),
    };
  }
  return {
    logger: {
      child: (globalThis as any).__layoutLoggerMocks.child,
    },
  };
});

describe('layout data functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if ((globalThis as any).__layoutLoggerMocks) {
      (globalThis as any).__layoutLoggerMocks.info.mockClear();
      (globalThis as any).__layoutLoggerMocks.error.mockClear();
      (globalThis as any).__layoutLoggerMocks.child.mockClear();
    }
  });

  describe('getLayoutData', () => {
    it('should return layout data with announcement when available', async () => {
      const mockAnnouncement = {
        id: 'announcement-1',
        title: 'Test Announcement',
        content: 'Test content',
      };
      mockGetActiveAnnouncement.mockResolvedValue(mockAnnouncement);

      const result = await getLayoutData();

      expect(result).toEqual({
        announcement: mockAnnouncement,
        navigationData: DEFAULT_LAYOUT_DATA.navigationData,
      });
      expect(mockGetActiveAnnouncement).toHaveBeenCalled();
      expect((globalThis as any).__layoutLoggerMocks.info).toHaveBeenCalledWith(
        { hasAnnouncement: true },
        'getLayoutData: fetched successfully'
      );
    });

    it('should return layout data with null announcement when not available', async () => {
      mockGetActiveAnnouncement.mockResolvedValue(null);

      const result = await getLayoutData();

      expect(result).toEqual({
        announcement: null,
        navigationData: DEFAULT_LAYOUT_DATA.navigationData,
      });
      expect((globalThis as any).__layoutLoggerMocks.info).toHaveBeenCalledWith(
        { hasAnnouncement: false },
        'getLayoutData: fetched successfully'
      );
    });

    it('should handle announcement fetch errors gracefully', async () => {
      const fetchError = new Error('Failed to fetch announcement');
      mockGetActiveAnnouncement.mockRejectedValue(fetchError);

      const result = await getLayoutData();

      expect(result).toEqual({
        announcement: null,
        navigationData: DEFAULT_LAYOUT_DATA.navigationData,
      });
      expect((globalThis as any).__layoutLoggerMocks.error).toHaveBeenCalledWith(
        expect.objectContaining({
          component: 'announcement',
          err: fetchError,
          source: 'layout-data',
        }),
        'getLayoutData: announcement fetch failed'
      );
    });

    it('should handle string error reasons', async () => {
      mockGetActiveAnnouncement.mockRejectedValue('String error');

      const result = await getLayoutData();

      expect(result).toEqual({
        announcement: null,
        navigationData: DEFAULT_LAYOUT_DATA.navigationData,
      });
      expect((globalThis as any).__layoutLoggerMocks.error).toHaveBeenCalled();
    });

    it('should return default layout data on catastrophic failure', async () => {
      // Mock Promise.allSettled to throw (simulating catastrophic failure)
      const originalAllSettled = Promise.allSettled;
      Promise.allSettled = vi.fn(() => {
        throw new Error('Catastrophic failure');
      }) as any;

      const result = await getLayoutData();

      expect(result).toEqual(DEFAULT_LAYOUT_DATA);
      expect((globalThis as any).__layoutLoggerMocks.error).toHaveBeenCalled();

      // Restore
      Promise.allSettled = originalAllSettled;
    });
  });
});

