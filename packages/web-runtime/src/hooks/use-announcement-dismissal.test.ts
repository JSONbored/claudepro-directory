import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAnnouncementDismissal,
  clearAllAnnouncementDismissals,
  getAnnouncementDismissalAnalytics,
} from './use-announcement-dismissal';

// Mock useLocalStorage
const mockSetValue = vi.fn();
let mockStoredValue: Record<string, any> = {};

vi.mock('./use-local-storage', () => ({
  useLocalStorage: vi.fn((key: string, options: any) => {
    return {
      value: mockStoredValue,
      setValue: mockSetValue,
      removeValue: vi.fn(),
    };
  }),
}));

vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../errors', () => ({
  normalizeError: vi.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

vi.mock('../data', () => ({
  safeParse: vi.fn((value: string, schema: any, options: any) => {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }),
  ParseStrategy: {
    VALIDATED_JSON: 'VALIDATED_JSON',
  },
}));

describe('useAnnouncementDismissal', () => {
  beforeEach(() => {
    mockStoredValue = {};
    mockSetValue.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with isDismissed=false for new announcement', () => {
    const { result } = renderHook(() => useAnnouncementDismissal('announcement-1'));

    expect(result.current.isDismissed).toBe(false);
    expect(typeof result.current.dismiss).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(typeof result.current.getDismissalTime).toBe('function');
  });

  it('should return isDismissed=true for dismissed announcement', () => {
    mockStoredValue = {
      'announcement-1': {
        dismissed: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
    };

    const { result } = renderHook(() => useAnnouncementDismissal('announcement-1'));

    expect(result.current.isDismissed).toBe(true);
  });

  it('should dismiss announcement', () => {
    const { result } = renderHook(() => useAnnouncementDismissal('announcement-1'));

    expect(result.current.isDismissed).toBe(false);

    act(() => {
      result.current.dismiss();
    });

    expect(mockSetValue).toHaveBeenCalledWith(
      expect.objectContaining({
        'announcement-1': expect.objectContaining({
          dismissed: true,
          timestamp: expect.any(String),
        }),
      })
    );
  });

  it('should include timestamp when dismissing', () => {
    const { result } = renderHook(() => useAnnouncementDismissal('announcement-1'));

    act(() => {
      result.current.dismiss();
    });

    const callArgs = mockSetValue.mock.calls[0]?.[0];
    expect(callArgs?.['announcement-1']?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should reset dismissal', () => {
    mockStoredValue = {
      'announcement-1': {
        dismissed: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
      'announcement-2': {
        dismissed: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
    };

    const { result } = renderHook(() => useAnnouncementDismissal('announcement-1'));

    expect(result.current.isDismissed).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(mockSetValue).toHaveBeenCalledWith({
      'announcement-2': {
        dismissed: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
    });
  });

  it('should get dismissal timestamp', () => {
    mockStoredValue = {
      'announcement-1': {
        dismissed: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
    };

    const { result } = renderHook(() => useAnnouncementDismissal('announcement-1'));

    expect(result.current.getDismissalTime()).toBe('2024-01-01T00:00:00Z');
  });

  it('should return null for dismissal time when not dismissed', () => {
    const { result } = renderHook(() => useAnnouncementDismissal('announcement-1'));

    expect(result.current.getDismissalTime()).toBeNull();
  });

  it('should handle multiple announcements independently', () => {
    const { result: result1 } = renderHook(() => useAnnouncementDismissal('announcement-1'));
    const { result: result2 } = renderHook(() => useAnnouncementDismissal('announcement-2'));

    expect(result1.current.isDismissed).toBe(false);
    expect(result2.current.isDismissed).toBe(false);

    act(() => {
      result1.current.dismiss();
    });

    // Update mock to reflect dismissal
    mockStoredValue = {
      'announcement-1': {
        dismissed: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
    };

    // Re-render to get updated state
    const { result: result1Updated } = renderHook(() => useAnnouncementDismissal('announcement-1'));
    const { result: result2Updated } = renderHook(() => useAnnouncementDismissal('announcement-2'));

    expect(result1Updated.current.isDismissed).toBe(true);
    expect(result2Updated.current.isDismissed).toBe(false);
  });
});

describe('clearAllAnnouncementDismissals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear all dismissals from localStorage', () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    clearAllAnnouncementDismissals();

    expect(removeItemSpy).toHaveBeenCalledWith('announcement-dismissals');
  });

  it('should handle localStorage errors gracefully', async () => {
    const { logger } = await import('../logger');
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    removeItemSpy.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    clearAllAnnouncementDismissals();

    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    // Should not throw
    clearAllAnnouncementDismissals();

    // Restore
    global.window = originalWindow;
  });
});

describe('getAnnouncementDismissalAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dismissal analytics from localStorage', () => {
    const mockData = {
      'announcement-1': {
        dismissed: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
      'announcement-2': {
        dismissed: true,
        timestamp: '2024-01-02T00:00:00Z',
      },
    };

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockData));

    const analytics = getAnnouncementDismissalAnalytics();

    expect(analytics).toEqual(mockData);
  });

  it('should return empty object when no dismissals', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    const analytics = getAnnouncementDismissalAnalytics();

    expect(analytics).toEqual({});
  });

  it('should handle invalid JSON gracefully', async () => {
    const { logger } = await import('../logger');
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');

    const analytics = getAnnouncementDismissalAnalytics();

    expect(analytics).toEqual({});
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const analytics = getAnnouncementDismissalAnalytics();

    expect(analytics).toEqual({});

    // Restore
    global.window = originalWindow;
  });
});
