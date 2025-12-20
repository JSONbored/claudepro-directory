import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MiscService } from './misc.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockClient

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('MiscService', () => {
  let miscService: MiscService;
  let prismock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

  /**
   * Helper to safely mock Prismock model methods
   */
  function mockPrismockMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    prismock = prisma;

    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismock models are initialized
    void prismock.notifications;
    void prismock.announcements;
    void prismock.contact_commands;
    void prismock.form_field_configs;
    void prismock.content_submissions;
    void prismock.content;
    void prismock.sponsored_content;
    void prismock.app_settings;
    void prismock.email_engagement_summary;
    void prismock.email_blocklist;
    void prismock.webhook_events;

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
        },
      ];

      mockPrismockMethod(prismock.notifications, 'findMany', mockNotifications);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getActiveNotifications({
        p_dismissed_ids: [],
      });

      expect(prismock.notifications.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });

    it('should filter dismissed notifications', async () => {
      mockPrismockMethod(prismock.notifications, 'findMany', []);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      await miscService.getActiveNotifications({
        p_dismissed_ids: ['notif-1', 'notif-2'],
      });

      expect(prismock.notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { notIn: ['notif-1', 'notif-2'] },
          }),
        })
      );
    });
  });

  describe('getActiveAnnouncement', () => {
    it('should return active announcement', async () => {
      const mockAnnouncement = {
        id: 'announce-1',
        title: 'Test announcement',
        active: true,
      };

      mockPrismockMethod(prismock.announcements, 'findFirst', mockAnnouncement);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getActiveAnnouncement();

      expect(prismock.announcements.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockAnnouncement);
    });

    it('should return null when no active announcement', async () => {
      mockPrismockMethod(prismock.announcements, 'findFirst', null);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getActiveAnnouncement();

      expect(result).toBeNull();
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
        },
      ];

      mockPrismockMethod(prismock.contact_commands, 'findMany', mockCommands);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getContactCommands();

      expect(prismock.contact_commands.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('text', 'help'); // Transformed from command_text
    });
  });

  describe('getFormFieldConfig', () => {
    it('should return form field config', async () => {
      // getFormFieldConfig uses prisma.form_field_configs.findMany with select
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
        },
      ];

      mockPrismockMethod(prismock.form_field_configs, 'findMany', mockConfigs);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getFormFieldConfig({
        p_form_type: 'content_submission',
      });

      expect(prismock.form_field_configs.findMany).toHaveBeenCalledWith({
        where: {
          form_type: 'content_submission',
          enabled: true,
        },
        select: expect.objectContaining({
          field_name: true,
          field_label: true,
          field_type: true,
        }),
        orderBy: [{ field_group: 'asc' }, { display_order: 'asc' }],
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
  });

  describe('getSocialProofStats', () => {
    it('should return social proof stats', async () => {
      // getSocialProofStats uses Prisma queries: count, groupBy, and content.count
      const mockRecentCount = 50;
      const mockMonthSubmissions = [
        { status: 'merged' as const, _count: { id: 40 } },
        { status: 'pending' as const, _count: { id: 10 } },
      ];
      const mockTopContributors = [
        { author: 'user1@example.com', _count: { id: 5 } },
        { author: 'user2@example.com', _count: { id: 3 } },
      ];
      const mockTotalContent = 1000;

      mockPrismockMethod(prismock.content_submissions, 'count', mockRecentCount);
      const groupByMock = vi.fn()
        .mockResolvedValueOnce(mockMonthSubmissions)
        .mockResolvedValueOnce(mockTopContributors);
      prismock.content_submissions.groupBy = groupByMock;
      mockPrismockMethod(prismock.content, 'count', mockTotalContent);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getSocialProofStats();

      expect(prismock.content_submissions.count).toHaveBeenCalled();
      expect(prismock.content_submissions.groupBy).toHaveBeenCalledTimes(2);
      expect(prismock.content.count).toHaveBeenCalled();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('submission_count', 50);
      expect(result[0]).toHaveProperty('contributor_count', 2);
      expect(result[0]).toHaveProperty('total_users', 1000);
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

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_api_health')
      );
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

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
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

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_site_urls')
      );
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

      // callRpc formats the SQL as: SELECT * FROM get_site_urls_formatted(p_format => $1)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
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

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_sitemap_xml')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSponsoredContentById', () => {
    it('should return sponsored content', async () => {
      // getSponsoredContentById only selects content_type, so mock should only return that
      const mockData = {
        content_type: 'agents' as const,
      };

      mockPrismockMethod(prismock.sponsored_content, 'findUnique', mockData);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getSponsoredContentById('sponsored-1');

      expect(prismock.sponsored_content.findUnique).toHaveBeenCalledWith({
        where: { id: 'sponsored-1' },
        select: { content_type: true },
      });
      // getSponsoredContentById returns only content_type (select: { content_type: true })
      expect(result).toEqual({ content_type: 'agents' });
      expect(result).not.toHaveProperty('id'); // Only content_type is selected
    });
  });

  describe('getAppSetting', () => {
    it('should return app setting', async () => {
      // getAppSetting uses prisma.app_settings.findUnique with select
      const mockData = {
        setting_value: { test: 'value' },
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };

      mockPrismockMethod(prismock.app_settings, 'findUnique', mockData);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getAppSetting('test_key');

      expect(prismock.app_settings.findUnique).toHaveBeenCalledWith({
        where: { setting_key: 'test_key' },
        select: {
          setting_value: true,
          updated_at: true,
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('upsertAppSetting', () => {
    it('should upsert app setting (mutation)', async () => {
      // upsertAppSetting uses prisma.app_settings.upsert with AppSettingCreateInput
      const mockSetting = {
        setting_key: 'test_key',
        setting_value: { test: 'new_value' },
      };

      mockPrismockMethod(prismock.app_settings, 'upsert', mockSetting);

      await miscService.upsertAppSetting(mockSetting);

      expect(prismock.app_settings.upsert).toHaveBeenCalledWith({
        where: { setting_key: 'test_key' },
        update: mockSetting,
        create: mockSetting,
      });
    });
  });

  describe('getEmailEngagementSummary', () => {
    it('should return email engagement summary', async () => {
      // getEmailEngagementSummary uses prisma.email_engagement_summary.findUnique with select (10 fields)
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
        last_bounced_at: null,
      };

      mockPrismockMethod(prismock.email_engagement_summary, 'findUnique', mockData);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getEmailEngagementSummary('test@example.com');

      expect(prismock.email_engagement_summary.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.objectContaining({
          email: true,
          emails_sent: true,
          emails_delivered: true,
        }),
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('upsertEmailEngagementSummary', () => {
    it('should upsert email engagement summary (mutation)', async () => {
      // upsertEmailEngagementSummary uses prisma.email_engagement_summary.upsert with EmailEngagementSummaryCreateInput
      const mockEngagement = {
        email: 'test@example.com',
        emails_sent: 10,
        emails_delivered: 9,
        emails_opened: 8,
        emails_clicked: 5,
      };

      mockPrismockMethod(prismock.email_engagement_summary, 'upsert', mockEngagement);

      await miscService.upsertEmailEngagementSummary(mockEngagement);

      expect(prismock.email_engagement_summary.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        update: mockEngagement,
        create: mockEngagement,
      });
    });
  });

  describe('upsertEmailBlocklist', () => {
    it('should upsert email blocklist entry (mutation)', async () => {
      // upsertEmailBlocklist uses prisma.email_blocklist.upsert with EmailBlocklistCreateInput
      const mockBlocklistEntry = {
        email: 'blocked@example.com',
        reason: 'bounce' as const,
      };

      mockPrismockMethod(prismock.email_blocklist, 'upsert', mockBlocklistEntry);

      await miscService.upsertEmailBlocklist(mockBlocklistEntry);

      expect(prismock.email_blocklist.upsert).toHaveBeenCalledWith({
        where: { email: 'blocked@example.com' },
        update: mockBlocklistEntry,
        create: mockBlocklistEntry,
      });
    });
  });

  describe('updateWebhookEventStatus', () => {
    it('should update webhook event status (mutation)', async () => {
      // After migration: Uses Prisma update instead of $executeRawUnsafe
      mockPrismockMethod(prismock.webhook_events, 'update', {
        id: 'webhook-123',
        processed: true,
        processed_at: new Date(),
      } as any);

      await miscService.updateWebhookEventStatus('webhook-123');

      expect(prismock.webhook_events.update).toHaveBeenCalledWith({
        where: { id: 'webhook-123' },
        data: {
          processed: true,
          processed_at: expect.any(Date),
        },
      });
    });
  });

  describe('upsertNotification', () => {
    it('should upsert notification (mutation)', async () => {
      const mockData = {
        id: 'notif-1',
        title: 'Test',
        message: 'Test message',
      };

      mockPrismockMethod(prismock.notifications, 'upsert', mockData);

      await miscService.upsertNotification({
        id: 'notif-1',
        title: 'Test',
        message: 'Test message',
      });

      expect(prismock.notifications.upsert).toHaveBeenCalled();
    });
  });

  describe('insertNotification', () => {
    it('should insert notification (mutation)', async () => {
      const mockData = {
        id: 'notif-1',
        title: 'Test',
      };

      mockPrismockMethod(prismock.notifications, 'create', mockData);

      await miscService.insertNotification({
        title: 'Test',
        message: 'Test message',
      });

      expect(prismock.notifications.create).toHaveBeenCalled();
    });
  });

  describe('getWebhookEventBySvixId', () => {
    it('should return webhook event by Svix ID', async () => {
      // getWebhookEventBySvixId uses prisma.webhook_events.findFirst with select { id: true }
      const mockData = {
        id: 'webhook-1',
      };

      mockPrismockMethod(prismock.webhook_events, 'findFirst', mockData);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getWebhookEventBySvixId({
        p_svix_id: 'svix-123',
        p_source: 'polar',
      });

      expect(prismock.webhook_events.findFirst).toHaveBeenCalledWith({
        where: {
          svix_id: 'svix-123',
          source: 'polar',
        },
        select: { id: true },
      });
      expect(result).toEqual(mockData);
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

      // callRpc formats the SQL as: SELECT * FROM insert_webhook_event(p_svix_id => $1, p_source => $2, p_payload => $3)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
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

      // callRpc formats the SQL as: SELECT * FROM handle_polar_webhook(webhook_id => $1, webhook_data => $2)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('handle_polar_webhook'),
        'webhook-123',
        {}
      );
    });
  });
});
