import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { MiscService } from './misc.ts';

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

describe('MiscService', () => {
  let miscService: MiscService;
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;

    // Reset Prismock data before each test
    prismock.reset();

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

      vi.mocked(prismock.notifications.findMany).mockResolvedValue(
        mockNotifications as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getActiveNotifications({
        p_dismissed_ids: [],
      });

      expect(prismock.notifications.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });

    it('should filter dismissed notifications', async () => {
      vi.mocked(prismock.notifications.findMany).mockResolvedValue([]);

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

      vi.mocked(prismock.announcements.findFirst).mockResolvedValue(
        mockAnnouncement as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getActiveAnnouncement();

      expect(prismock.announcements.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockAnnouncement);
    });

    it('should return null when no active announcement', async () => {
      vi.mocked(prismock.announcements.findFirst).mockResolvedValue(null);

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

      vi.mocked(prismock.contact_commands.findMany).mockResolvedValue(
        mockCommands as any
      );

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
      const mockData = {
        fields: [],
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await miscService.getFormFieldConfig({
        p_form_type: 'content_submission',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_form_field_config')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSocialProofStats', () => {
    it('should return social proof stats', async () => {
      const mockData = {
        contributors: { count: 100, names: [] },
        submissions: 500,
        successRate: 0.8,
        totalUsers: 1000,
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await miscService.getSocialProofStats();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_social_proof_stats')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getApiHealth', () => {
    it('should return API health status', async () => {
      const mockData = {
        status: 'healthy',
        database: 'connected',
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

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

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

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

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

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

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await miscService.getSiteUrlsFormatted({
        p_format: 'json',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_site_urls_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('generateSitemapXml', () => {
    it('should generate sitemap XML', async () => {
      const mockData = {
        xml: '<?xml version="1.0"?><urlset>...</urlset>',
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await miscService.generateSitemapXml();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('generate_sitemap_xml')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSponsoredContentById', () => {
    it('should return sponsored content', async () => {
      const mockData = {
        id: 'sponsored-1',
        content_type: 'agents',
      };

      vi.mocked(prismock.sponsored_content.findUnique).mockResolvedValue(
        mockData as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getSponsoredContentById('sponsored-1');

      expect(prismock.sponsored_content.findUnique).toHaveBeenCalledWith({
        where: { id: 'sponsored-1' },
        select: { content_type: true },
      });
      expect(result).toEqual({ content_type: 'agents' });
    });
  });

  describe('getAppSetting', () => {
    it('should return app setting', async () => {
      const mockData = {
        key: 'test_key',
        value: 'test_value',
      };

      vi.mocked(prismock.app_settings.findUnique).mockResolvedValue(
        mockData as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getAppSetting('test_key');

      expect(prismock.app_settings.findUnique).toHaveBeenCalledWith({
        where: { key: 'test_key' },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('upsertAppSetting', () => {
    it('should upsert app setting (mutation)', async () => {
      const mockData = {
        key: 'test_key',
        value: 'new_value',
      };

      vi.mocked(prismock.app_settings.upsert).mockResolvedValue(mockData as any);

      await miscService.upsertAppSetting('test_key', 'new_value');

      expect(prismock.app_settings.upsert).toHaveBeenCalledWith({
        where: { key: 'test_key' },
        update: { value: 'new_value', updated_at: expect.any(Date) },
        create: {
          key: 'test_key',
          value: 'new_value',
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
      });
    });
  });

  describe('getEmailEngagementSummary', () => {
    it('should return email engagement summary', async () => {
      const mockData = {
        email: 'test@example.com',
        total_sent: 10,
        total_opened: 8,
        total_clicked: 5,
      };

      vi.mocked(prismock.email_engagement_summary.findUnique).mockResolvedValue(
        mockData as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getEmailEngagementSummary('test@example.com');

      expect(prismock.email_engagement_summary.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('upsertEmailEngagementSummary', () => {
    it('should upsert email engagement summary (mutation)', async () => {
      const mockData = {
        email: 'test@example.com',
        total_sent: 10,
      };

      vi.mocked(prismock.email_engagement_summary.upsert).mockResolvedValue(
        mockData as any
      );

      await miscService.upsertEmailEngagementSummary('test@example.com', {
        total_sent: 10,
      });

      expect(prismock.email_engagement_summary.upsert).toHaveBeenCalled();
    });
  });

  describe('upsertEmailBlocklist', () => {
    it('should upsert email blocklist entry (mutation)', async () => {
      vi.mocked(prismock.email_blocklist.upsert).mockResolvedValue({
        email: 'blocked@example.com',
      } as any);

      await miscService.upsertEmailBlocklist('blocked@example.com', 'bounce');

      expect(prismock.email_blocklist.upsert).toHaveBeenCalled();
    });
  });

  describe('updateWebhookEventStatus', () => {
    it('should update webhook event status (mutation)', async () => {
      vi.mocked(prismock.webhook_events.updateMany).mockResolvedValue({
        count: 1,
      });

      await miscService.updateWebhookEventStatus('webhook-123');

      expect(prismock.webhook_events.updateMany).toHaveBeenCalledWith({
        where: { id: 'webhook-123' },
        data: {
          status: 'processed',
          updated_at: expect.any(Date),
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

      vi.mocked(prismock.notifications.upsert).mockResolvedValue(mockData as any);

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

      vi.mocked(prismock.notifications.create).mockResolvedValue(mockData as any);

      await miscService.insertNotification({
        title: 'Test',
        message: 'Test message',
      });

      expect(prismock.notifications.create).toHaveBeenCalled();
    });
  });

  describe('getWebhookEventBySvixId', () => {
    it('should return webhook event by Svix ID', async () => {
      const mockData = {
        id: 'webhook-1',
        svix_id: 'svix-123',
        source: 'polar',
      };

      vi.mocked(prismock.webhook_events.findFirst).mockResolvedValue(mockData as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await miscService.getWebhookEventBySvixId('svix-123', 'polar');

      expect(prismock.webhook_events.findFirst).toHaveBeenCalledWith({
        where: {
          svix_id: 'svix-123',
          source: 'polar',
        },
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

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      await miscService.insertWebhookEvent({
        p_svix_id: 'svix-123',
        p_source: 'polar',
        p_payload: {},
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('insert_webhook_event')
      );
    });
  });

  describe('handlePolarWebhookRpc', () => {
    it('should handle Polar webhook RPC (mutation)', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(undefined as any);

      await miscService.handlePolarWebhookRpc({
        p_event_type: 'subscription.created',
        p_payload: {},
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('handle_polar_webhook')
      );
    });
  });
});
