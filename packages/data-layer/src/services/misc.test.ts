import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MiscService } from './misc.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '../utils/request-cache.ts';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockerClient
// Jest automatically uses __mocks__ directory (no explicit registration needed)
// Use Prismocker's setData() to seed test data and its actual methods (findMany, findUnique, etc.)

// Mock the RPC error logging utility
jest.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// DON'T mock request cache - use real implementation
// Cache is cleared in beforeEach for test isolation
// This allows us to:
// 1. Test business logic with fresh cache (each test starts with empty cache)
// 2. Test caching behavior by verifying cache stats and duplicate calls

describe('MiscService', () => {
  let miscService: MiscService;
  let prismaMock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismaMock = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismaMock && typeof prismaMock.reset === 'function') {
      prismaMock.reset();
    }

    // Clear all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Clear request cache for test isolation (each test starts with empty cache)
    clearRequestCache();

    // Prismocker provides $queryRawUnsafe as a stub, but we need to mock it for RPC calls
    queryRawUnsafeSpy = jest.fn().mockResolvedValue([]);
    (prismaMock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    miscService = new MiscService();
  });

  describe('getActiveNotifications', () => {
    it('should return active notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          title: 'Test notification',
          message: 'Test message',
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data (proper Prismocker usage)
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('notifications', mockNotifications);
      }

      const result = await miscService.getActiveNotifications({
        p_dismissed_ids: [],
      });

      expect(result).toEqual(mockNotifications);
    });

    it('should filter dismissed notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          title: 'Test 1',
          message: 'Message 1',
          active: true,
          expires_at: null, // Must be null or future date to match OR clause
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'notif-2',
          title: 'Test 2',
          message: 'Message 2',
          active: true,
          expires_at: null, // Must be null or future date to match OR clause
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'notif-3',
          title: 'Test 3',
          message: 'Message 3',
          active: true,
          expires_at: null, // Must be null or future date to match OR clause
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Seed data with all notifications
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('notifications', mockNotifications);
      }

      const result = await miscService.getActiveNotifications({
        p_dismissed_ids: ['notif-1', 'notif-2'],
      });

      // Should only return notif-3 (not in dismissed list)
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('notif-3');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          title: 'Test notification',
          message: 'Test message',
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('notifications', mockNotifications);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getActiveNotifications({
        p_dismissed_ids: [],
      });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await miscService.getActiveNotifications({
        p_dismissed_ids: [],
      });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toEqual(mockNotifications);
    });
  });

  describe('getActiveAnnouncement', () => {
    it('should return active announcement', async () => {
      const mockAnnouncement = {
        id: 'announce-1',
        title: 'Test announcement',
        active: true,
        start_date: null, // Must be null or past date to match OR clause
        end_date: null, // Must be null or future date to match OR clause
        priority: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('announcements', [mockAnnouncement]);
      }

      const result = await miscService.getActiveAnnouncement();

      expect(result).toEqual(mockAnnouncement);
    });

    it('should return null when no active announcement', async () => {
      // No data seeded, so findFirst should return null
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('announcements', []);
      }

      const result = await miscService.getActiveAnnouncement();

      expect(result).toBeNull();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockAnnouncement = {
        id: 'announce-1',
        title: 'Test announcement',
        active: true,
        start_date: null,
        end_date: null,
        priority: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('announcements', [mockAnnouncement]);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getActiveAnnouncement();
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call - should hit cache (no database call)
      const result2 = await miscService.getActiveAnnouncement();
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toEqual(mockAnnouncement);
    });
  });

  describe('getContactCommands', () => {
    it('should return contact commands', async () => {
      const mockCommands = [
        {
          id: 'cmd-1',
          command_text: 'help',
          description: 'Get help',
          category: 'general',
          icon_name: 'help',
          action_type: 'link',
          action_value: '/help',
          confetti_variant: null,
          requires_auth: false,
          aliases: ['h', '?'],
          is_active: true,
          display_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('contact_commands', mockCommands);
      }

      const result = await miscService.getContactCommands();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('text', 'help'); // Transformed from command_text
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockCommands = [
        {
          id: 'cmd-1',
          command_text: 'help',
          description: 'Get help',
          category: 'general',
          icon_name: 'help',
          action_type: 'link',
          action_value: '/help',
          confetti_variant: null,
          requires_auth: false,
          aliases: ['h', '?'],
          is_active: true,
          display_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('contact_commands', mockCommands);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getContactCommands();
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call - should hit cache (no database call)
      const result2 = await miscService.getContactCommands();
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
    });
  });

  describe('getFormFieldConfig', () => {
    it('should return form field config', async () => {
      const mockConfigs = [
        {
          field_name: 'title',
          field_label: 'Title',
          field_type: 'text',
          required: true,
          placeholder: 'Enter title',
          help_text: 'The title of your submission',
          default_value: null,
          grid_column: null,
          icon_name: null,
          icon_position: null,
          config: null,
          field_group: 'basic',
          display_order: 1,
          form_type: 'content_submission',
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('form_field_configs', mockConfigs);
      }

      const result = await miscService.getFormFieldConfig({
        p_form_type: 'content_submission',
      });

      expect(result).toHaveProperty('form_type', 'content_submission');
      expect(result).toHaveProperty('fields');
      expect(Array.isArray(result.fields)).toBe(true);
      if (result.fields && result.fields.length > 0) {
        expect(result.fields[0]).toHaveProperty('name', 'title');
        expect(result.fields[0]).toHaveProperty('label', 'Title');
        expect(result.fields[0]).toHaveProperty('type', 'text');
      }
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockConfigs = [
        {
          field_name: 'title',
          field_label: 'Title',
          field_type: 'text',
          required: true,
          placeholder: 'Enter title',
          help_text: 'The title of your submission',
          default_value: null,
          grid_column: null,
          icon_name: null,
          icon_position: null,
          config: null,
          field_group: 'basic',
          display_order: 1,
          form_type: 'content_submission',
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('form_field_configs', mockConfigs);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getFormFieldConfig({
        p_form_type: 'content_submission',
      });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await miscService.getFormFieldConfig({
        p_form_type: 'content_submission',
      });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toHaveProperty('form_type', 'content_submission');
    });
  });

  describe('getSocialProofStats', () => {
    it('should return social proof stats', async () => {
      // This test uses count, groupBy, and content.count
      // For Prismocker, we need to seed data and let it calculate counts
      const mockSubmissions = Array.from({ length: 50 }, (_, i) => ({
        id: `sub-${i}`,
        status: i < 40 ? 'merged' : 'pending',
        author: `user${i % 5}@example.com`,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const mockContent = Array.from({ length: 1000 }, (_, i) => ({
        id: `content-${i}`,
        slug: `content-${i}`,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Seed data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content_submissions', mockSubmissions);
        (prismaMock as any).setData('content', mockContent);
      }

      const result = await miscService.getSocialProofStats();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('submission_count', 50);
      expect(result[0]).toHaveProperty('total_users', 1000);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockSubmissions = Array.from({ length: 10 }, (_, i) => ({
        id: `sub-${i}`,
        status: i < 8 ? 'merged' : 'pending',
        author: `user${i % 3}@example.com`,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const mockContent = Array.from({ length: 100 }, (_, i) => ({
        id: `content-${i}`,
        slug: `content-${i}`,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Seed data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('content_submissions', mockSubmissions);
        (prismaMock as any).setData('content', mockContent);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getSocialProofStats();
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call - should hit cache (no database call)
      const result2 = await miscService.getSocialProofStats();
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
    });
  });

  describe('getApiHealth', () => {
    it('should return API health status', async () => {
      const mockData = {
        status: 'healthy',
        database: 'connected',
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await miscService.getApiHealth();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(expect.stringContaining('get_api_health'));
      expect(result).toEqual(mockData);
    });
  });

  describe('getApiHealthFormatted', () => {
    it('should return formatted API health', async () => {
      const mockData = {
        status: 'healthy',
        database: 'connected',
        timestamp: '2025-12-07T00:00:00Z',
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await miscService.getApiHealthFormatted();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_api_health_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSiteUrls', () => {
    it('should return site URLs', async () => {
      const mockData = {
        urls: ['https://example.com/page1', 'https://example.com/page2'],
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await miscService.getSiteUrls();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(expect.stringContaining('get_site_urls'));
      expect(result).toEqual(mockData);
    });
  });

  describe('getSiteUrlsFormatted', () => {
    it('should return formatted site URLs', async () => {
      const mockData = {
        urls: [],
        meta: {},
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await miscService.getSiteUrlsFormatted({
        p_format: 'json',
      });

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_site_urls_formatted'),
        'json'
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('generateSitemapXml', () => {
    it('should generate sitemap XML', async () => {
      const mockData = {
        xml: '<?xml version="1.0"?><urlset>...</urlset>',
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await miscService.generateSitemapXml();

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('generate_sitemap_xml')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSponsoredContentById', () => {
    it('should return sponsored content', async () => {
      const mockData = {
        id: 'sponsored-1',
        content_type: 'agents' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('sponsored_content', [mockData]);
      }

      const result = await miscService.getSponsoredContentById('sponsored-1');

      // getSponsoredContentById returns only content_type (select: { content_type: true })
      expect(result).toEqual({ content_type: 'agents' });
      expect(result).not.toHaveProperty('id'); // Only content_type is selected
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        id: 'sponsored-1',
        content_type: 'agents' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('sponsored_content', [mockData]);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getSponsoredContentById('sponsored-1');
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await miscService.getSponsoredContentById('sponsored-1');
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toEqual({ content_type: 'agents' });
    });
  });

  describe('getAppSetting', () => {
    it('should return app setting', async () => {
      const mockData = {
        setting_key: 'test_key',
        setting_value: { test: 'value' },
        updated_at: new Date('2024-01-01T00:00:00Z'),
        created_at: new Date('2024-01-01T00:00:00Z'),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('app_settings', [mockData]);
      }

      const result = await miscService.getAppSetting('test_key');

      expect(result).toEqual({
        setting_value: { test: 'value' },
        updated_at: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        setting_key: 'test_key',
        setting_value: { test: 'value' },
        updated_at: new Date('2024-01-01T00:00:00Z'),
        created_at: new Date('2024-01-01T00:00:00Z'),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('app_settings', [mockData]);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getAppSetting('test_key');
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await miscService.getAppSetting('test_key');
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toEqual({
        setting_value: { test: 'value' },
        updated_at: new Date('2024-01-01T00:00:00Z'),
      });
    });
  });

  describe('upsertAppSetting', () => {
    it('should upsert app setting (mutation)', async () => {
      const mockSetting = {
        setting_key: 'test_key',
        setting_value: { test: 'new_value' },
      };

      // Use Prismocker's create/upsert methods directly
      // Prismocker supports upsert natively
      // Note: upsertAppSetting is a mutation, so withSmartCache will skip caching
      await miscService.upsertAppSetting(mockSetting);

      // Verify data was upserted by checking if it exists
      const result = await prismaMock.app_settings.findUnique({
        where: { setting_key: 'test_key' },
      });

      expect(result).toBeDefined();
      expect(result?.setting_value).toEqual({ test: 'new_value' });
    });
  });

  describe('getEmailEngagementSummary', () => {
    it('should return email engagement summary', async () => {
      const mockData = {
        email: 'test@example.com',
        emails_sent: 10,
        emails_delivered: 9,
        emails_opened: 8,
        emails_clicked: 5,
        last_sent_at: new Date('2024-01-01T00:00:00Z'),
        last_delivered_at: new Date('2024-01-01T00:00:00Z'),
        last_opened_at: new Date('2024-01-01T00:00:00Z'),
        last_clicked_at: new Date('2024-01-01T00:00:00Z'),
        health_status: 'active', // This field is selected
        // Note: last_bounced_at is NOT in the select, so it won't be returned
        // Note: created_at and updated_at are not in the select, so they won't be returned
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('email_engagement_summary', [mockData]);
      }

      const result = await miscService.getEmailEngagementSummary('test@example.com');

      // Only selected fields are returned (last_bounced_at, created_at, updated_at are not selected)
      expect(result).toMatchObject({
        email: 'test@example.com',
        emails_sent: 10,
        emails_delivered: 9,
        emails_opened: 8,
        emails_clicked: 5,
        last_sent_at: new Date('2024-01-01T00:00:00Z'),
        last_delivered_at: new Date('2024-01-01T00:00:00Z'),
        last_opened_at: new Date('2024-01-01T00:00:00Z'),
        last_clicked_at: new Date('2024-01-01T00:00:00Z'),
        health_status: 'active',
      });
      // Verify fields NOT in select are NOT in result
      expect(result).not.toHaveProperty('last_bounced_at');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        email: 'test@example.com',
        emails_sent: 10,
        emails_delivered: 9,
        emails_opened: 8,
        emails_clicked: 5,
        last_sent_at: new Date('2024-01-01T00:00:00Z'),
        last_delivered_at: new Date('2024-01-01T00:00:00Z'),
        last_opened_at: new Date('2024-01-01T00:00:00Z'),
        last_clicked_at: new Date('2024-01-01T00:00:00Z'),
        health_status: 'active',
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('email_engagement_summary', [mockData]);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getEmailEngagementSummary('test@example.com');
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await miscService.getEmailEngagementSummary('test@example.com');
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
    });
  });

  describe('upsertEmailEngagementSummary', () => {
    it('should upsert email engagement summary (mutation)', async () => {
      const mockEngagement = {
        email: 'test@example.com',
        emails_sent: 10,
        emails_delivered: 9,
        emails_opened: 8,
        emails_clicked: 5,
      };

      // Note: upsertEmailEngagementSummary is a mutation, so withSmartCache will skip caching
      await miscService.upsertEmailEngagementSummary(mockEngagement);

      // Verify data was upserted
      const result = await prismaMock.email_engagement_summary.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(result).toBeDefined();
      expect(result?.emails_sent).toBe(10);
    });
  });

  describe('upsertEmailBlocklist', () => {
    it('should upsert email blocklist entry (mutation)', async () => {
      const mockBlocklistEntry = {
        email: 'blocked@example.com',
        reason: 'bounce' as const,
      };

      // Note: upsertEmailBlocklist is a mutation, so withSmartCache will skip caching
      await miscService.upsertEmailBlocklist(mockBlocklistEntry);

      // Verify data was upserted
      const result = await prismaMock.email_blocklist.findUnique({
        where: { email: 'blocked@example.com' },
      });

      expect(result).toBeDefined();
      expect(result?.reason).toBe('bounce');
    });
  });

  describe('updateWebhookEventStatus', () => {
    it('should update webhook event status (mutation)', async () => {
      const mockWebhookEvent = {
        id: 'webhook-123',
        svix_id: 'svix-123',
        source: 'polar' as const,
        payload: {},
        processed: false,
        processed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Seed data first
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('webhook_events', [mockWebhookEvent]);
      }

      await miscService.updateWebhookEventStatus('webhook-123');

      // Verify data was updated
      const result = await prismaMock.webhook_events.findUnique({
        where: { id: 'webhook-123' },
      });

      expect(result).toBeDefined();
      expect(result?.processed).toBe(true);
      expect(result?.processed_at).toBeInstanceOf(Date);
    });
  });

  describe('upsertNotification', () => {
    it('should upsert notification (mutation)', async () => {
      const mockData = {
        id: 'notif-1',
        title: 'Test',
        message: 'Test message',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Note: upsertNotification is a mutation, so withSmartCache will skip caching
      await miscService.upsertNotification({
        id: 'notif-1',
        title: 'Test',
        message: 'Test message',
      });

      // Verify data was upserted
      const result = await prismaMock.notifications.findUnique({
        where: { id: 'notif-1' },
      });

      expect(result).toBeDefined();
      expect(result?.title).toBe('Test');
    });
  });

  describe('insertNotification', () => {
    it('should insert notification (mutation)', async () => {
      // Note: insertNotification is a mutation, so withSmartCache will skip caching
      await miscService.insertNotification({
        title: 'Test',
        message: 'Test message',
      });

      // Verify data was created (findMany to get all, then check if our notification exists)
      const result = await prismaMock.notifications.findMany({
        where: { title: 'Test' },
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe('Test');
    });
  });

  describe('getWebhookEventBySvixId', () => {
    it('should return webhook event by Svix ID', async () => {
      const mockData = {
        id: 'webhook-1',
        svix_id: 'svix-123',
        source: 'polar' as const,
        payload: {},
        processed: false,
        processed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('webhook_events', [mockData]);
      }

      const result = await miscService.getWebhookEventBySvixId({
        p_svix_id: 'svix-123',
        p_source: 'polar',
      });

      expect(result).toEqual({ id: 'webhook-1' }); // Only id is selected
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        id: 'webhook-1',
        svix_id: 'svix-123',
        source: 'polar' as const,
        payload: {},
        processed: false,
        processed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Use Prismocker's setData to seed test data
      if ('setData' in prismaMock && typeof (prismaMock as any).setData === 'function') {
        (prismaMock as any).setData('webhook_events', [mockData]);
      }

      // Test caching behavior with real implementation
      const { getRequestCache } = await import('../utils/request-cache.ts');
      const cache = getRequestCache();

      // First call - should hit database and populate cache
      const result1 = await miscService.getWebhookEventBySvixId({
        p_svix_id: 'svix-123',
        p_source: 'polar',
      });
      const cacheSizeAfterFirst = cache.getStats().size;
      expect(cacheSizeAfterFirst).toBeGreaterThan(0); // Cache should have entry

      // Second call with same args - should hit cache (no database call)
      const result2 = await miscService.getWebhookEventBySvixId({
        p_svix_id: 'svix-123',
        p_source: 'polar',
      });
      const cacheSizeAfterSecond = cache.getStats().size;
      expect(cacheSizeAfterSecond).toBe(cacheSizeAfterFirst); // Cache size unchanged (hit cache)

      expect(result1).toEqual(result2);
      expect(result1).toEqual({ id: 'webhook-1' });
    });
  });

  describe('insertWebhookEvent', () => {
    it('should insert webhook event (mutation)', async () => {
      const mockData = {
        id: 'webhook-1',
        svix_id: 'svix-123',
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      await miscService.insertWebhookEvent({
        p_svix_id: 'svix-123',
        p_source: 'polar',
        p_payload: {},
      });

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('insert_webhook_event'),
        'svix-123',
        'polar',
        {}
      );
    });
  });

  describe('handlePolarWebhookRpc', () => {
    it('should handle Polar webhook RPC (mutation)', async () => {
      queryRawUnsafeSpy.mockResolvedValue(undefined as any);

      await miscService.handlePolarWebhookRpc('handle_polar_webhook', {
        webhook_id: 'webhook-123',
        webhook_data: {},
      });

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('handle_polar_webhook'),
        'webhook-123',
        {}
      );
    });
  });
});
