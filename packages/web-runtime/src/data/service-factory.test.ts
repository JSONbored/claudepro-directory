import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getService, services, type ServiceKey } from './service-factory';

// Mock data-layer services - return constructors that create instances
const mockAccountService = {
  getAccountDashboard: vi.fn(),
};

const mockContentService = {
  getContentDetailCore: vi.fn(),
};

vi.mock('@heyclaude/data-layer', () => ({
  AccountService: class {
    getAccountDashboard = mockAccountService.getAccountDashboard;
  },
  ContentService: class {
    getContentDetailCore = mockContentService.getContentDetailCore;
  },
  ChangelogService: class {},
  CompaniesService: class {},
  JobsService: class {},
  MiscService: class {},
  NewsletterService: class {},
  SearchService: class {},
  TrendingService: class {},
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
      const result = await service.getAccountDashboard('user-id');

      expect(mockAccountService.getAccountDashboard).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({ profile: {} });
    });
  });
});
