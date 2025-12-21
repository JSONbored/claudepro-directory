import { describe, expect, it, vi } from 'vitest';
import { getActiveAnnouncement } from './announcements';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock cached-data-factory
vi.mock('./cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    // Store config for testing
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    // Return a mock function that returns null by default
    return vi.fn().mockResolvedValue(null);
  }),
}));

describe('announcements data functions', () => {
  describe('getActiveAnnouncement', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getActiveAnnouncement');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('misc');
      expect(config?.methodName).toBe('getActiveAnnouncement');
      expect(config?.operation).toBe('getActiveAnnouncement');
    });

    it('should return null when no announcement exists', async () => {
      const result = await getActiveAnnouncement();
      expect(result).toBeNull();
    });
  });
});

