/**
 * Misc Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types remain using Database type (Prisma doesn't generate RPC types).
 */

import type { Database, Json } from '@heyclaude/database-types';
import type { Prisma } from '@heyclaude/data-layer/prisma';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
import { logRpcError } from '../utils/rpc-error-logging.ts';

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
    args: Database['public']['Functions']['get_active_notifications']['Args']
  ): Promise<Database['public']['Functions']['get_active_notifications']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_active_notifications']['Returns']>(
      'get_active_notifications',
      args,
      { methodName: 'getActiveNotifications' }
    );
  }

  async getActiveAnnouncement(): Promise<
    Database['public']['Functions']['get_active_announcement']['Returns']
  > {
    return this.callRpc<Database['public']['Functions']['get_active_announcement']['Returns']>(
      'get_active_announcement',
      {},
      { methodName: 'getActiveAnnouncement' }
    );
  }

  async getContactCommands(): Promise<
    Database['public']['Functions']['get_contact_commands']['Returns']
  > {
    return this.callRpc<Database['public']['Functions']['get_contact_commands']['Returns']>(
      'get_contact_commands',
      {},
      { methodName: 'getContactCommands' }
    );
  }

  async getFormFieldConfig(
    args: Database['public']['Functions']['get_form_field_config']['Args']
  ): Promise<Database['public']['Functions']['get_form_field_config']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_form_field_config']['Returns']>(
      'get_form_field_config',
      args,
      { methodName: 'getFormFieldConfig' }
    );
  }

  async getSocialProofStats(): Promise<
    Database['public']['Functions']['get_social_proof_stats']['Returns']
  > {
    return this.callRpc<Database['public']['Functions']['get_social_proof_stats']['Returns']>(
      'get_social_proof_stats',
      {},
      { methodName: 'getSocialProofStats' }
    );
  }

  async getApiHealth(): Promise<Database['public']['Functions']['get_api_health']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_api_health']['Returns']>(
      'get_api_health',
      {},
      { methodName: 'getApiHealth' }
    );
  }

  async getApiHealthFormatted(): Promise<
    Database['public']['Functions']['get_api_health_formatted']['Returns']
  > {
    return this.callRpc<Database['public']['Functions']['get_api_health_formatted']['Returns']>(
      'get_api_health_formatted',
      {},
      { methodName: 'getApiHealthFormatted' }
    );
  }

  async getSiteUrls(): Promise<Database['public']['Functions']['get_site_urls']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_site_urls']['Returns']>(
      'get_site_urls',
      {},
      { methodName: 'getSiteUrls' }
    );
  }

  async getSiteUrlsFormatted(
    args: Database['public']['Functions']['get_site_urls_formatted']['Args']
  ): Promise<Database['public']['Functions']['get_site_urls_formatted']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_site_urls_formatted']['Returns']>(
      'get_site_urls_formatted',
      args,
      { methodName: 'getSiteUrlsFormatted' }
    );
  }

  async generateSitemapXml(
    args?: Database['public']['Functions']['generate_sitemap_xml']['Args']
  ): Promise<Database['public']['Functions']['generate_sitemap_xml']['Returns']> {
    return this.callRpc<Database['public']['Functions']['generate_sitemap_xml']['Returns']>(
      'generate_sitemap_xml',
      args ?? {},
      { methodName: 'generateSitemapXml' }
    );
  }

  async getSponsoredContentById(sponsoredId: string): Promise<{
    content_type: Prisma.sponsored_contentGetPayload<{}>['content_type'];
  } | null> {
    const sponsored = await prisma.sponsored_content.findUnique({
      where: { id: sponsoredId },
      select: { content_type: true },
    });
    return sponsored;
  }

  async getAppSetting(settingKey: string): Promise<{
    setting_value: Prisma.app_settingsGetPayload<{}>['setting_value'];
    updated_at: Prisma.app_settingsGetPayload<{}>['updated_at'];
  } | null> {
    const setting = await prisma.app_settings.findUnique({
      where: { setting_key: settingKey },
      select: {
        setting_value: true,
        updated_at: true,
      },
    });
    return setting;
  }

  async upsertAppSetting(
    setting: Prisma.app_settingsCreateInput
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

  async getEmailEngagementSummary(email: string): Promise<
    Prisma.email_engagement_summaryGetPayload<{}> | null
  > {
    const summary = await prisma.email_engagement_summary.findUnique({
      where: { email },
    });
    return summary;
  }

  async upsertEmailEngagementSummary(
    engagement: Prisma.email_engagement_summaryCreateInput
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
    blocklistEntry: Prisma.email_blocklistCreateInput
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
          processed_at: new Date(),
          status: 'processed',
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
    notification: Prisma.notificationsCreateInput
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
    notification: Prisma.notificationsCreateInput
  ): Promise<Prisma.notificationsGetPayload<{}>> {
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
    args: Database['public']['Functions']['get_webhook_event_by_svix_id']['Args']
  ): Promise<Database['public']['Functions']['get_webhook_event_by_svix_id']['Returns'][0] | null> {
    const result = await this.callRpc<Database['public']['Functions']['get_webhook_event_by_svix_id']['Returns']>(
      'get_webhook_event_by_svix_id',
      args,
      { methodName: 'getWebhookEventBySvixId' }
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }

  async insertWebhookEvent(
    args: Database['public']['Functions']['insert_webhook_event']['Args']
  ): Promise<Database['public']['Functions']['insert_webhook_event']['Returns']> {
    // Mutations don't use caching
    return this.callRpc<Database['public']['Functions']['insert_webhook_event']['Returns']>(
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
      webhook_data: Json;
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
