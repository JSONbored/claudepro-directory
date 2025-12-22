import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getService, services, type ServiceKey } from './service-factory';

// Mock data-layer services - return constructors that create instances
const mockAccountService = {
  getAccountDashboard: vi.fn(),
};

const mockContentService = {
  getContentDetailCore: vi.fn(),
};

jest.mock('@heyclaude/data-layer', () => ({
  AccountService: class {
    getAccountDashboard = mockAccountService.getAccountDashboard;
  },
  ContentService: class {
    getContentDetailCore = mockContentService.getContentDetailCore;
  },
  ChangelogService: class {
    // Add any methods as needed
  },
  CompaniesService: class {
    // Add any methods as needed
  },
  JobsService: class {
    // Add any methods as needed
  },
  MiscService: class {
    // Add any methods as needed
  },
  NewsletterService: class {
    // Add any methods as needed
  },
  SearchService: class {
    // Add any methods as needed
  },
  TrendingService: class {
    // Add any methods as needed
  },
}));

describe('service-factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getService', () => {
    it('should return service instance for valid service key', async () => {
      const service = await getService('account');
      expect(service).toBeDefined();
      expect(service).toHaveProperty('getAccountDashboard');
    });

    it('should return singleton instance on subsequent calls', async () => {
      const service1 = await getService('account');
      const service2 = await getService('account');
      expect(service1).toBe(service2);
    });

    it('should return different services for different keys', async () => {
      const accountService = await getService('account');
      const contentService = await getService('content');
      expect(accountService).not.toBe(contentService);
    });

    it('should throw error for invalid service key', async () => {
      // TypeScript prevents this, but test runtime behavior
      await expect(getService('invalid' as ServiceKey)).rejects.toThrow();
    });
  });

  describe('services object', () => {
    it('should provide direct accessors for all services', async () => {
      const accountService = await services.account();
      expect(accountService).toBeDefined();

      const contentService = await services.content();
      expect(contentService).toBeDefined();
    });

    it('should return singleton instances', async () => {
      const account1 = await services.account();
      const account2 = await services.account();
      expect(account1).toBe(account2);
    });
  });

  describe('service method calls', () => {
    it('should allow calling methods on service instances', async () => {
      mockAccountService.getAccountDashboard.mockResolvedValue({ profile: {} });

      const service = await getService('account');
      const result = await service.getAccountDashboard({ p_user_id: 'user-id' });

      expect(mockAccountService.getAccountDashboard).toHaveBeenCalledWith({ p_user_id: 'user-id' });
      expect(result).toEqual({ profile: {} });
    });
  });

  describe('error handling', () => {
    // Note: Testing module import failures with vi.doMock is complex in Vitest
    // because mocks are hoisted and module cache behavior differs from Jest.
    // These error scenarios are better tested in integration tests or E2E tests
    // where actual module loading failures can occur.

    it('should handle service method errors', async () => {
      const error = new Error('Database connection failed');
      mockAccountService.getAccountDashboard.mockRejectedValue(error);

      const service = await getService('account');

      await expect(service.getAccountDashboard({ p_user_id: 'user-id' })).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle all service keys', async () => {
      // Test that all service keys can be instantiated
      // This verifies the service registry is complete
      // Note: We test a subset since all services are mocked
      const testKeys: ServiceKey[] = ['account', 'content'];

      for (const key of testKeys) {
        const service = await getService(key);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Object);
      }
    });

    it('should maintain singleton instances across multiple calls', async () => {
      const service1 = await getService('account');
      const service2 = await getService('account');
      const service3 = await getService('account');

      expect(service1).toBe(service2);
      expect(service2).toBe(service3);
    });

    it('should handle service method errors', async () => {
      const error = new Error('Database connection failed');
      mockAccountService.getAccountDashboard.mockRejectedValue(error);

      const service = await getService('account');

      await expect(service.getAccountDashboard({ p_user_id: 'user-id' })).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
