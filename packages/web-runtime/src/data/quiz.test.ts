import { describe, expect, it, vi } from 'vitest';
import { getQuizConfiguration } from './quiz';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock cached-data-factory
vi.mock('./cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return vi.fn().mockResolvedValue(null);
  }),
}));

describe('quiz data functions', () => {
  describe('getQuizConfiguration', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getQuizConfiguration');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('misc');
      expect(config?.methodName).toBe('getQuizConfiguration');
      expect(config?.operation).toBe('getQuizConfiguration');
    });
  });
});

