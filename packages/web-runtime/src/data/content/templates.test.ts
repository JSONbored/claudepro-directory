import { describe, expect, it, jest } from '@jest/globals';
import { getContentTemplates } from './templates';
import { serializeForClient } from '@heyclaude/shared-runtime';
import type { content_category } from '@prisma/client';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock serializeForClient - use importActual to include createPinoConfig
jest.mock('@heyclaude/shared-runtime', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@heyclaude/shared-runtime')>();
  return {
    ...actual,
    serializeForClient: vi.fn((data) => data),
  };
});

// Mock cached-data-factory
jest.mock('../cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return vi.fn().mockResolvedValue([]);
  }),
}));

describe('templates data functions', () => {
  describe('getContentTemplates', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getContentTemplates');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('content');
      expect(config?.methodName).toBe('getContentTemplates');
      expect(config?.operation).toBe('getContentTemplates');
      expect(config?.onError).toBeDefined();
      expect(config?.transformResult).toBeDefined();
    });

    it('should transform args correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getContentTemplates');
      const transformArgs = config?.transformArgs;
      
      expect(transformArgs('agents' as content_category)).toEqual({
        p_category: 'agents',
      });
    });

    it('should transform result correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getContentTemplates');
      const transformResult = config?.transformResult;
      
      const mockResult = {
        templates: [
          {
            id: 'template-1',
            template_data: { field1: 'value1', field2: 'value2' },
          },
          {
            id: 'template-2',
            template_data: null,
          },
        ],
      };
      
      const result = transformResult(mockResult);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('templateData');
      expect(result[0]).toHaveProperty('field1', 'value1');
    });

    it('should return empty array on null result', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getContentTemplates');
      const transformResult = config?.transformResult;
      
      expect(transformResult(null)).toEqual([]);
      expect(transformResult(undefined)).toEqual([]);
    });
  });
});

