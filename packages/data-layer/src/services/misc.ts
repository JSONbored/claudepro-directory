/**
 * Misc Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types use postgres-types generator (Prisma doesn't generate RPC types).
 */

import type {
  GetActiveNotificationsArgs,
  GetActiveNotificationsReturns,
  GetActiveAnnouncementReturns,
  GetContactCommandsReturns,
  GetFormFieldConfigArgs,
  GetFormFieldConfigReturns,
  GetSocialProofStatsReturns,
  GetApiHealthReturns,
  GetApiHealthFormattedReturns,
  GetSiteUrlsReturns,
  GetSiteUrlsFormattedArgs,
  GetSiteUrlsFormattedReturns,
  GenerateSitemapXmlArgs,
  GenerateSitemapXmlReturns,
  GetWebhookEventBySvixIdArgs,
  GetWebhookEventBySvixIdReturns,
  InsertWebhookEventArgs,
  InsertWebhookEventReturns,
} from '@heyclaude/database-types/postgres-types';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
import { logRpcError } from '../utils/rpc-error-logging.ts';
import { withSmartCache } from '../utils/request-cache.ts';

// Type helpers: Extract model types from Prisma query results
type SponsoredContent = Awaited<ReturnType<typeof prisma.sponsored_content.findUnique>>;
type AppSetting = Awaited<ReturnType<typeof prisma.app_settings.findUnique>>;
type EmailEngagementSummary = Awaited<ReturnType<typeof prisma.email_engagement_summary.findUnique>>;
type Notification = Awaited<ReturnType<typeof prisma.notifications.create>>;

// Type helpers: Extract input types from Prisma operations
type AppSettingCreateInput = Parameters<typeof prisma.app_settings.create>[0]['data'];
type EmailEngagementSummaryCreateInput = Parameters<typeof prisma.email_engagement_summary.create>[0]['data'];
type EmailBlocklistCreateInput = Parameters<typeof prisma.email_blocklist.create>[0]['data'];
type NotificationCreateInput = Parameters<typeof prisma.notifications.create>[0]['data'];

/**
 * Misc Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Direct Prisma queries for table operations
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class MiscService extends BasePrismaService {
  async getActiveNotifications(
    args: GetActiveNotificationsArgs
  ): Promise<GetActiveNotificationsReturns> {
    return this.callRpc<GetActiveNotificationsReturns>(
      'get_active_notifications',
      args,
      { methodName: 'getActiveNotifications' }
    );
  }

  async getActiveAnnouncement(): Promise<GetActiveAnnouncementReturns> {
    return this.callRpc<GetActiveAnnouncementReturns>(
      'get_active_announcement',
      {},
      { methodName: 'getActiveAnnouncement' }
    );
  }

  async getContactCommands(): Promise<GetContactCommandsReturns> {
    return this.callRpc<GetContactCommandsReturns>(
      'get_contact_commands',
      {},
      { methodName: 'getContactCommands' }
    );
  }

  async getFormFieldConfig(
    args: GetFormFieldConfigArgs
  ): Promise<GetFormFieldConfigReturns> {
    return this.callRpc<GetFormFieldConfigReturns>(
      'get_form_field_config',
      args,
      { methodName: 'getFormFieldConfig' }
    );
  }

  async getSocialProofStats(): Promise<GetSocialProofStatsReturns> {
    return this.callRpc<GetSocialProofStatsReturns>(
      'get_social_proof_stats',
      {},
      { methodName: 'getSocialProofStats' }
    );
  }

  async getApiHealth(): Promise<GetApiHealthReturns> {
    return this.callRpc<GetApiHealthReturns>(
      'get_api_health',
      {},
      { methodName: 'getApiHealth' }
    );
  }

  async getApiHealthFormatted(): Promise<GetApiHealthFormattedReturns> {
    return this.callRpc<GetApiHealthFormattedReturns>(
      'get_api_health_formatted',
      {},
      { methodName: 'getApiHealthFormatted' }
    );
  }

  async getSiteUrls(): Promise<GetSiteUrlsReturns> {
    return this.callRpc<GetSiteUrlsReturns>(
      'get_site_urls',
      {},
      { methodName: 'getSiteUrls' }
    );
  }

  async getSiteUrlsFormatted(
    args: GetSiteUrlsFormattedArgs
  ): Promise<GetSiteUrlsFormattedReturns> {
    return this.callRpc<GetSiteUrlsFormattedReturns>(
      'get_site_urls_formatted',
      args,
      { methodName: 'getSiteUrlsFormatted' }
    );
  }

  async generateSitemapXml(
    args?: GenerateSitemapXmlArgs
  ): Promise<GenerateSitemapXmlReturns> {
    return this.callRpc<GenerateSitemapXmlReturns>(
      'generate_sitemap_xml',
      args ?? {},
      { methodName: 'generateSitemapXml' }
    );
  }

  /**
   * Get sponsored content by ID
   * 
   * OPTIMIZATION: Uses request-scoped caching to prevent duplicate queries in same request.
   */
  async getSponsoredContentById(sponsoredId: string): Promise<{
    content_type: NonNullable<SponsoredContent>['content_type'];
  } | null> {
    return withSmartCache(
      'getSponsoredContentById',
      'getSponsoredContentById',
      async () => {
        const sponsored = await prisma.sponsored_content.findUnique({
          where: { id: sponsoredId },
          select: { content_type: true },
        });
        return sponsored;
      },
      { sponsoredId } // Cache key
    );
  }

  /**
   * Get app setting by key
   * 
   * OPTIMIZATION: Uses request-scoped caching to prevent duplicate queries in same request.
   */
  async getAppSetting(settingKey: string): Promise<{
    setting_value: NonNullable<AppSetting>['setting_value'];
    updated_at: NonNullable<AppSetting>['updated_at'];
  } | null> {
    return withSmartCache(
      'getAppSetting',
      'getAppSetting',
      async () => {
        const setting = await prisma.app_settings.findUnique({
          where: { setting_key: settingKey },
          select: {
            setting_value: true,
            updated_at: true,
          },
        });
        return setting;
      },
      { settingKey } // Cache key
    );
  }

  async upsertAppSetting(
    setting: AppSettingCreateInput
  ): Promise<void> {
    try {
      await prisma.app_settings.upsert({
        where: { setting_key: setting.setting_key },
        update: setting,
        create: setting,
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'app_settings.upsert',
        operation: 'MiscService.upsertAppSetting',
        args: { settingKey: setting.setting_key },
      });
      throw error;
    }
  }

  /**
   * Get email engagement summary by email
   * 
   * OPTIMIZATION: Uses request-scoped caching to prevent duplicate queries in same request.
   */
  async getEmailEngagementSummary(email: string): Promise<
    EmailEngagementSummary | null
  > {
    return withSmartCache(
      'getEmailEngagementSummary',
      'getEmailEngagementSummary',
      async () => {
        const summary = await prisma.email_engagement_summary.findUnique({
          where: { email },
        });
        return summary;
      },
      { email } // Cache key
    );
  }

  async upsertEmailEngagementSummary(
    engagement: EmailEngagementSummaryCreateInput
  ): Promise<void> {
    try {
      await prisma.email_engagement_summary.upsert({
        where: { email: engagement.email },
        update: engagement,
        create: engagement,
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'email_engagement_summary.upsert',
        operation: 'MiscService.upsertEmailEngagementSummary',
        args: { email: engagement.email },
      });
      throw error;
    }
  }

  async upsertEmailBlocklist(
    blocklistEntry: EmailBlocklistCreateInput
  ): Promise<void> {
    try {
      await prisma.email_blocklist.upsert({
        where: { email: blocklistEntry.email },
        update: blocklistEntry,
        create: blocklistEntry,
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'email_blocklist.upsert',
        operation: 'MiscService.upsertEmailBlocklist',
        args: { email: blocklistEntry.email },
      });
      throw error;
    }
  }

  async updateWebhookEventStatus(webhookId: string): Promise<void> {
    try {
      await prisma.webhook_events.update({
        where: { id: webhookId },
        data: {
          processed: true,
          processed_at: new Date(),
        },
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'webhook_events.update',
        operation: 'MiscService.updateWebhookEventStatus',
        args: { webhookId },
      });
      throw error;
    }
  }

  async upsertNotification(
    notification: NotificationCreateInput
  ): Promise<void> {
    try {
      await prisma.notifications.upsert({
        where: { id: notification.id },
        update: notification,
        create: notification,
      });
    } catch (error) {
      logRpcError(error, {
        rpcName: 'notifications.upsert',
        operation: 'MiscService.upsertNotification',
        args: { notificationId: notification.id },
      });
      throw error;
    }
  }

  async insertNotification(
    notification: NotificationCreateInput
  ): Promise<Notification> {
    try {
      const result = await prisma.notifications.create({
        data: notification,
      });
      return result;
    } catch (error) {
      logRpcError(error, {
        rpcName: 'notifications.insert',
        operation: 'MiscService.insertNotification',
        args: { notificationId: notification.id },
      });
      throw error;
    }
  }

  async getWebhookEventBySvixId(
    args: GetWebhookEventBySvixIdArgs
  ): Promise<GetWebhookEventBySvixIdReturns[0] | null> {
    const result = await this.callRpc<GetWebhookEventBySvixIdReturns>(
      'get_webhook_event_by_svix_id',
      args,
      { methodName: 'getWebhookEventBySvixId' }
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }

  async insertWebhookEvent(
    args: InsertWebhookEventArgs
  ): Promise<InsertWebhookEventReturns> {
    // Mutations don't use caching
    return this.callRpc<InsertWebhookEventReturns>(
      'insert_webhook_event',
      args,
      { methodName: 'insertWebhookEvent', useCache: false }
    );
  }

  /**
   * Handle Polar webhook RPC call
   *
   * Generic method to call any Polar webhook RPC function.
   * Used by Inngest functions for processing Polar payment webhooks.
   *
   * @param rpcName - Name of the Polar webhook RPC function (e.g., 'handle_polar_order_paid')
   * @param args - Arguments for the RPC function (webhook_id, webhook_data)
   * @returns Promise that resolves when RPC completes (void for mutations)
   */
  async handlePolarWebhookRpc(
    rpcName: string,
    args: {
      webhook_id: string;
      webhook_data: unknown;
    }
  ): Promise<void> {
    // Mutations don't use caching
    await this.callRpc<void>(
      rpcName,
      args,
      { methodName: 'handlePolarWebhookRpc', useCache: false }
    );
  }
}
