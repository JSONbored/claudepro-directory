import { describe, expect, it } from '@jest/globals';
import {
  getCategoryConfigs,
  getCategoryConfig,
  getCategoryStatsConfig,
  getTotalResourceCount,
} from './index';

describe('category config', () => {
  describe('getCategoryConfigs', () => {
    it('should return all category configs', () => {
      const configs = getCategoryConfigs();
      expect(typeof configs).toBe('object');
      expect(Object.keys(configs).length).toBeGreaterThan(0);
    });

    it('should return configs for valid categories', () => {
      const configs = getCategoryConfigs();
      expect(configs).toHaveProperty('agents');
      expect(configs).toHaveProperty('mcp');
      expect(configs).toHaveProperty('rules');
    });
  });

  describe('getCategoryConfig', () => {
    it('should return config for valid category', () => {
      const config = getCategoryConfig('agents');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('title');
      expect(config).toHaveProperty('pluralTitle');
    });

    it('should return undefined for invalid category', () => {
      const config = getCategoryConfig('invalid-category' as any);
      // getCategoryConfig returns undefined (not null) when category doesn't exist in CATEGORY_CONFIGS
      expect(config).toBeUndefined();
    });

    it('should include tabs when available', () => {
      const config = getCategoryConfig('agents');
      if (config) {
        expect(config).toHaveProperty('detailPage');
      }
    });
  });

  describe('getCategoryStatsConfig', () => {
    it('should return array of stats configs', () => {
      const configs = getCategoryStatsConfig();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    });

    it('should include required properties', () => {
      const configs = getCategoryStatsConfig();
      if (configs.length > 0) {
        const first = configs[0];
        expect(first).toHaveProperty('categoryId');
        expect(first).toHaveProperty('displayText');
        expect(first).toHaveProperty('icon');
        expect(first).toHaveProperty('delay');
        expect(typeof first.delay).toBe('number');
      }
    });

    it('should have incremental delays', () => {
      const configs = getCategoryStatsConfig();
      if (configs.length > 1) {
        expect(configs[0].delay).toBe(0);
        expect(configs[1].delay).toBe(100);
        expect(configs[2]?.delay).toBe(200);
      }
    });
  });

  describe('getTotalResourceCount', () => {
    it('should sum all counts', () => {
      const stats = {
        agents: 10,
        mcp: 5,
        rules: 3,
      };
      expect(getTotalResourceCount(stats)).toBe(18);
    });

    it('should return 0 for empty stats', () => {
      expect(getTotalResourceCount({})).toBe(0);
    });

    it('should handle zero values', () => {
      const stats = {
        agents: 0,
        mcp: 0,
      };
      expect(getTotalResourceCount(stats)).toBe(0);
    });

    it('should handle negative values', () => {
      const stats = {
        agents: 10,
        mcp: -5,
      };
      expect(getTotalResourceCount(stats)).toBe(5);
    });
  });
});
