import { describe, expect, it, jest } from '@jest/globals';
import { getConfigRecommendations, type RecommendationInput } from './recommendations';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock cached-data-factory
jest.mock('../cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return vi.fn().mockResolvedValue(null);
  }),
}));

describe('recommendations data functions', () => {
  describe('getConfigRecommendations', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getConfigRecommendations');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('misc');
      expect(config?.methodName).toBe('getRecommendations');
      expect(config?.operation).toBe('getConfigRecommendations');
    });

    it('should transform args correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getConfigRecommendations');
      const transformArgs = config?.transformArgs;
      
      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        focusAreas: ['area1'],
        integrations: ['integration1'],
        limit: 10,
        toolPreferences: ['tool1'],
        useCase: 'development',
        viewerId: 'viewer-id',
      };
      
      const result = transformArgs(input);
      expect(result).toEqual({
        p_experience_level: 'beginner',
        p_focus_areas: ['area1'],
        p_integrations: ['integration1'],
        p_limit: 10,
        p_tool_preferences: ['tool1'],
        p_use_case: 'development',
        p_viewer_id: 'viewer-id',
      });
    });

    it('should handle optional parameters', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getConfigRecommendations');
      const transformArgs = config?.transformArgs;
      
      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
      };
      
      const result = transformArgs(input);
      expect(result).toEqual({
        p_experience_level: 'beginner',
        p_focus_areas: [],
        p_integrations: [],
        p_limit: 20,
        p_tool_preferences: [],
        p_use_case: 'development',
      });
      expect(result).not.toHaveProperty('p_viewer_id');
    });
  });
});

