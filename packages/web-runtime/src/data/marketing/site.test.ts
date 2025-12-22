import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getContentDescriptionCopy, getPartnerHeroStats } from './site';
import { getContentCount } from '../content/index';
import { logger } from '../../logger';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock logger
jest.mock('../../logger', () => ({
  logger: {
    child: vi.fn(() => ({
      error: vi.fn(),
    })),
  },
}));

// Mock content/index
const mock = jest.fn();
jest.mock('../content/index', () => ({
  getContentCount: (...args: any[]) => mockGetContentCount(...args),
}));

describe('marketing site data functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContentDescriptionCopy', () => {
    it('should return description with content count', async () => {
      mockGetContentCount.mockResolvedValue(100);

      const result = await getContentDescriptionCopy();

      expect(result).toContain('100+');
      expect(result).toContain('Open-source directory');
      expect(mockGetContentCount).toHaveBeenCalledWith(undefined);
    });

    it('should return fallback on error', async () => {
      mockGetContentCount.mockRejectedValue(new Error('Failed'));

      const result = await getContentDescriptionCopy();

      expect(result).toBe(
        'Open-source directory of Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.'
      );
    });
  });

  describe('getPartnerHeroStats', () => {
    it('should return hero stats with configuration count', async () => {
      mockGetContentCount.mockResolvedValue(150);

      const result = getPartnerHeroStats();

      // This is async, so we need to await
      return result.then((stats) => {
        expect(stats).toHaveProperty('configurationCount', 150);
        expect(stats).toHaveProperty('monthlyPageViews', 16000);
        expect(stats).toHaveProperty('monthlyVisitors', 3000);
      });
    });

    it('should return fallback stats on error', async () => {
      mockGetContentCount.mockRejectedValue(new Error('Failed'));

      const result = await getPartnerHeroStats();

      expect(result).toEqual({
        configurationCount: 0,
        monthlyPageViews: 16000,
        monthlyVisitors: 3000,
      });
    });
  });
});

