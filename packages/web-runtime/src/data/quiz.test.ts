import { describe, expect, it, jest } from '@jest/globals';
import { getQuizConfiguration } from './quiz';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock cached-data-factory
jest.mock('./cached-data-factory', () => ({
  createDataFunction: jest.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return jest.fn().mockResolvedValue(null);
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
