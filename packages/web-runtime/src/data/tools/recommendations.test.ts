import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getConfigRecommendations, type RecommendationInput } from './recommendations';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import {
  clearRequestCache,
  getRequestCache,
} from '../../../../data-layer/src/utils/request-cache.ts';

// Mock server-only
jest.mock('server-only', () => ({}));

// DON'T mock cached-data-factory - use real implementation
// This allows us to test the actual data fetching behavior
// Mock rpc-error-logging if needed
jest.mock('../../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

describe('recommendations data functions', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test for isolation
    clearRequestCache();

    // Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC calls
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('getConfigRecommendations', () => {
    it('should return recommendations for valid input', async () => {
      const mockRecommendations = {
        results: [
          {
            id: 'tool-1',
            name: 'Tool 1',
            category: 'development',
            description: 'A great tool',
          },
        ],
        total: 1,
      };

      // Mock the RPC call
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: mockRecommendations.results,
          total: mockRecommendations.total,
        },
      ]);

      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        focusAreas: ['area1'],
        integrations: ['integration1'],
        limit: 10,
        toolPreferences: ['tool1'],
        useCase: 'development',
        viewerId: 'viewer-id',
      };

      const result = await getConfigRecommendations(input);

      expect(result).toEqual(mockRecommendations);
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM get_recommendations'),
        'beginner', // p_experience_level
        ['area1'], // p_focus_areas
        ['integration1'], // p_integrations
        10, // p_limit
        ['tool1'], // p_tool_preferences
        'development', // p_use_case
        'viewer-id' // p_viewer_id
      );
    });

    it('should handle optional parameters correctly', async () => {
      const mockRecommendations = {
        results: [],
        total: 0,
      };

      // Mock the RPC call
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: mockRecommendations.results,
          total: mockRecommendations.total,
        },
      ]);

      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
      };

      const result = await getConfigRecommendations(input);

      expect(result).toEqual(mockRecommendations);
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM get_recommendations'),
        'beginner', // p_experience_level
        [], // p_focus_areas
        [], // p_integrations
        20, // p_limit (default)
        [], // p_tool_preferences
        'development' // p_use_case
        // p_viewer_id not included when not provided
      );
    });

    it('should return null on error', async () => {
      // Mock the RPC call to throw an error
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('RPC call failed')
      );

      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
      };

      const result = await getConfigRecommendations(input);

      expect(result).toBeNull();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRecommendations = {
        results: [
          {
            id: 'tool-1',
            name: 'Tool 1',
            category: 'development',
            description: 'A great tool',
          },
        ],
        total: 1,
      };

      // Mock the RPC call
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: mockRecommendations.results,
          total: mockRecommendations.total,
        },
      ]);

      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
      };

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getConfigRecommendations(input);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getConfigRecommendations(input);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);
      expect(result1).toEqual(mockRecommendations);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should transform args correctly (transformArgs test)', async () => {
      const mockRecommendations = {
        results: [],
        total: 0,
      };

      // Mock the RPC call
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: mockRecommendations.results,
          total: mockRecommendations.total,
        },
      ]);

      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        focusAreas: ['area1', 'area2'],
        integrations: ['integration1'],
        limit: 15,
        toolPreferences: ['tool1', 'tool2'],
        useCase: 'development',
        viewerId: 'viewer-id',
      };

      await getConfigRecommendations(input);

      // Verify transformArgs was called correctly
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM get_recommendations'),
        'beginner', // p_experience_level
        ['area1', 'area2'], // p_focus_areas
        ['integration1'], // p_integrations
        15, // p_limit
        ['tool1', 'tool2'], // p_tool_preferences
        'development', // p_use_case
        'viewer-id' // p_viewer_id
      );
    });

    it('should handle empty results', async () => {
      const mockRecommendations = {
        results: [],
        total: 0,
      };

      // Mock the RPC call
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: mockRecommendations.results,
          total: mockRecommendations.total,
        },
      ]);

      const input: RecommendationInput = {
        experienceLevel: 'advanced',
        toolPreferences: [],
        useCase: 'testing',
      };

      const result = await getConfigRecommendations(input);

      expect(result).toEqual(mockRecommendations);
      expect(result?.results).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    it('should reject zero limit (validation test)', async () => {
      // Note: The validate function checks limit >= 1, so zero limit will cause a validation error
      // createDataFunction logs validation failures as ERROR level (this is expected behavior)
      // and returns null, so we expect null
      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
        limit: 0,
      };

      const result = await getConfigRecommendations(input);

      // Validation should fail and return null
      expect(result).toBeNull();
      // RPC should not be called when validation fails
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('should reject negative limit (validation test)', async () => {
      // Note: The validate function checks limit >= 1, so negative limit will cause a validation error
      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
        limit: -1,
      };

      const result = await getConfigRecommendations(input);

      // Validation should fail and return null
      expect(result).toBeNull();
      // RPC should not be called when validation fails
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('should reject very large limit (validation test)', async () => {
      // Note: The validate function checks limit <= 100, so very large limit will cause a validation error
      const input: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
        limit: 10000,
      };

      const result = await getConfigRecommendations(input);

      // Validation should fail and return null
      expect(result).toBeNull();
      // RPC should not be called when validation fails
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('should accept limit at bounds (validation test)', async () => {
      const mockRecommendations = {
        results: [],
        total: 0,
      };

      // Mock the RPC call
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        {
          results: mockRecommendations.results,
          total: mockRecommendations.total,
        },
      ]);

      // Test minimum valid limit
      const inputMin: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
        limit: 1,
      };

      const resultMin = await getConfigRecommendations(inputMin);
      expect(resultMin).toEqual(mockRecommendations);

      // Test maximum valid limit
      const inputMax: RecommendationInput = {
        experienceLevel: 'beginner',
        toolPreferences: [],
        useCase: 'development',
        limit: 100,
      };

      const resultMax = await getConfigRecommendations(inputMax);
      expect(resultMax).toEqual(mockRecommendations);
    });
  });
});
