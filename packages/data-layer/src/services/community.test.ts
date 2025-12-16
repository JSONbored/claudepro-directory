import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { CommunityService } from './community.ts';

// Mock the prisma singleton with Prismock
vi.mock('../prisma/client.ts', () => {
  const { setupPrismockMock } = require('../test-utils/prisma-mock.ts');
  return {
    prisma: setupPrismockMock(),
  };
});

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('CommunityService', () => {
  let service: CommunityService;
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
    service = new CommunityService();
  });

  describe('getUserProfile', () => {
    it('returns user profile on success', async () => {
      const mockData = {
        id: 'user-1',
        username: 'johndoe',
        display_name: 'John Doe',
        bio: 'Software engineer and AI enthusiast',
        avatar_url: 'https://cdn.heyclaude.com/avatars/user-1.png',
        reputation_score: 150,
        contributions_count: 25,
        joined_at: '2023-01-01T00:00:00Z',
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getUserProfile({ username: 'johndoe' });

      expect(result).toEqual(mockData);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_user_profile'),
        'johndoe'
      );
    });

    it('handles user not found', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await service.getUserProfile({ username: 'nonexistent' });

      expect(result).toBeUndefined();
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('User lookup failed');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(service.getUserProfile({ username: 'test' })).rejects.toThrow('User lookup failed');
    });
  });

});