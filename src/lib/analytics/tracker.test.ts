import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { normalizeEventName, normalizePayloadKeys, trackEvent } from './tracker';

vi.mock('@/src/lib/env-client', () => ({
  isProduction: false,
  isDevelopment: true,
  isVercel: false,
}));

vi.mock('./events.constants', () => ({
  EVENTS: { TEST_EVENT: 'TEST_EVENT' },
  getEventConfig: () => ({
    TEST_EVENT: {
      description: 'Test event',
      category: 'INTERACTION',
      enabled: true,
    },
  }),
}));

vi.mock('./umami', () => ({
  isUmamiAvailable: () => true,
}));

describe('analytics tracker helpers', () => {
  describe('normalizeEventName', () => {
    it('converts camelCase to kebab-case', () => {
      expect(normalizeEventName('contentView')).toBe('content-view');
    });

    it('handles snake_case and uppercase', () => {
      expect(normalizeEventName('CONTENT_VIEW_AGENT')).toBe('content-view-agent');
    });

    it('falls back when name is empty', () => {
      expect(normalizeEventName('')).toBe('unknown-event');
    });
  });

  describe('normalizePayloadKeys', () => {
    it('converts keys to camelCase and trims strings', () => {
      const result = normalizePayloadKeys({
        results_count: 4,
        'time to results': '  120ms  ',
        EMPTY: '',
      });

      expect(result).toEqual({
        resultsCount: 4,
        timeToResults: '120ms',
      });
    });
  });
});

describe('trackEvent', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Object.assign(globalThis, {
      window: {
        umami: {
          track: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('normalizes event name and payload before tracking', () => {
    trackEvent('TEST_EVENT', {
      results_count: 5,
      query: '  budget savers  ',
    });

    expect(window.umami?.track).toHaveBeenCalledWith('test-event', {
      resultsCount: 5,
      query: 'budget savers',
    });
  });

  it('skips tracking when event is disabled by env override', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_DISABLED_EVENTS = 'test-event';

    trackEvent('TEST_EVENT', { foo: 'bar' });

    expect(window.umami?.track).not.toHaveBeenCalled();
  });
});
