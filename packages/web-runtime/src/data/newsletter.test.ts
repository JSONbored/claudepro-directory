import { describe, expect, it, vi } from 'vitest';
import { getNewsletterSubscriberCount } from './newsletter';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock cached-data-factory
vi.mock('./cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return vi.fn().mockResolvedValue(0);
  }),
}));

describe('newsletter data functions', () => {
  describe('getNewsletterSubscriberCount', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getNewsletterSubscriberCount');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('newsletter');
      expect(config?.methodName).toBe('getNewsletterSubscriberCount');
      expect(config?.operation).toBe('getNewsletterSubscriberCount');
      expect(config?.transformResult).toBeDefined();
    });

    it('should transform null result to 0', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getNewsletterSubscriberCount');
      const transformResult = config?.transformResult;
      
      expect(transformResult(null)).toBe(0);
      expect(transformResult(undefined)).toBe(0);
      expect(transformResult(100)).toBe(100);
    });
  });
});

