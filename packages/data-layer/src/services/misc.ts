/**
 * Misc Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types use postgres-types generator (Prisma doesn't generate RPC types).
 */

import type {
  GetApiHealthReturns,
  GetApiHealthFormattedReturns,
  GetSiteUrlsReturns,
  GetSiteUrlsFormattedArgs,
  GetSiteUrlsFormattedReturns,
  GenerateSitemapXmlArgs,
  GenerateSitemapXmlReturns,
  InsertWebhookEventArgs,
  InsertWebhookEventReturns,
  GenerateMetadataCompleteArgs,
  GenerateMetadataCompleteReturns,
  GetCommunityDirectoryArgs,
  GetCommunityDirectoryReturns,
  GetUserProfileArgs,
  GetUserProfileReturns,
  GetUserCollectionDetailArgs,
  GetUserCollectionDetailReturns,
  GetRecommendationsArgs,
  GetRecommendationsReturns,
  EnrollInEmailSequenceArgs,
} from '@heyclaude/database-types/postgres-types';
import type { Prisma, webhook_source } from '@prisma/client';
type announcementsModel = Prisma.announcementsGetPayload<{}>;

// Local types for converted RPCs (RPCs removed, using Prisma directly)
type DueSequenceEmailItem = {
  id: string | null;
  sequence_id: string | null;
  email: string | null;
  due_at: string | null;
  processed: boolean | null;
  step: number | null;
};

export type GetFormFieldConfigArgs = {
  p_form_type: string;
};

export type FormFieldConfigItem = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  help_text: string | null;
  default_value: string | null;
  grid_column: number | null;
  icon_name: string | null;
  icon_position: string | null;
  rows: number | null;
  monospace: boolean | null;
  min_value: number | null;
  max_value: number | null;
  step_value: number | null;
  select_options: Record<string, unknown> | null;
  field_group: string | null;
  display_order: number | null;
};

export type GetFormFieldConfigReturns = {
  form_type: string;
  fields: FormFieldConfigItem[] | null;
};

// Exported for use in web-runtime
export type GetSocialProofStatsReturns = Array<{
  contributor_count: number;
  contributor_names: string[] | null;
  submission_count: number;
  success_rate: number | null;
  total_users: number;
}>;

// Alias for API route compatibility
export type GetSocialProofStatsReturnRow = GetSocialProofStatsReturns[number];

// Local types for converted RPCs (using Prisma directly)
type GetWebhookEventBySvixIdArgs = {
  p_svix_id: string;
  p_source: webhook_source;
};

type GetActiveAnnouncementArgs = {
  p_now?: Date;
};

// Local types for get_active_notifications (RPC removed, using Prisma directly)
type GetActiveNotificationsArgs = {
  p_dismissed_ids?: string[];
};

// Use Prisma model type instead of postgres-types composite type
// Prisma namespace already imported above

type notificationsModel = Prisma.notificationsGetPayload<{}>;
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
import { logRpcError } from '../utils/rpc-error-logging.ts';
import { withSmartCache } from '../utils/request-cache.ts';

// Type helpers: Extract model types from Prisma query results
type SponsoredContent = Awaited<ReturnType<typeof prisma.sponsored_content.findUnique>>;
type AppSetting = Awaited<ReturnType<typeof prisma.app_settings.findUnique>>;
// Removed: EmailEngagementSummary type - now using inferred type from select query
type Notification = Awaited<ReturnType<typeof prisma.notifications.create>>;
type EmailSequence = Awaited<ReturnType<typeof prisma.email_sequences.findUnique>>;

// Local types for consolidated services
// Exported for use in web-runtime
export type QuizConfigurationQuestion = {
  id: string | null;
  question: string | null;
  description: string | null;
  required: boolean | null;
  display_order: number | null;
  options: Array<{
    value: string | null;
    label: string | null;
    description: string | null;
    icon_name: string | null;
  }> | null;
};

export type GetQuizConfigurationReturns = QuizConfigurationQuestion[];

// Type helpers: Extract input types from Prisma operations
type AppSettingCreateInput = Parameters<typeof prisma.app_settings.create>[0]['data'];
type EmailEngagementSummaryCreateInput = Parameters<
  typeof prisma.email_engagement_summary.create
>[0]['data'];
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
  /**
   * Get active notifications
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT with WHERE filters, which Prisma handles perfectly.
   *
   * @param args - Arguments with optional p_dismissed_ids array
   * @returns Array of active notifications
   */
  async getActiveNotifications(
    args: GetActiveNotificationsArgs = {}
  ): Promise<notificationsModel[]> {
    const { p_dismissed_ids = [] } = args;

    return withSmartCache<notificationsModel[]>(
      'getActiveNotifications',
      'getActiveNotifications',
      async () => {
        // OPTIMIZATION: Use Prisma query builder instead of raw SQL for better type safety and maintainability
        // Since we're in withSmartCache (skips during build), Date.now() is safe here
        const now = new Date();
        
        const notifications = await prisma.notifications.findMany({
          where: {
            active: true,
            OR: [
              { expires_at: null },
              { expires_at: { gt: now } },
            ],
            ...(p_dismissed_ids.length > 0 && {
              id: { notIn: p_dismissed_ids },
            }),
          },
          orderBy: { created_at: 'desc' },
        });
        
        return notifications;
      },
      args
    );
  }

  /**
   * Get active announcement
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT with date range filtering, which Prisma handles perfectly.
   *
   * @param args - Optional arguments with p_now (defaults to current date)
   * @returns Active announcement or null if none found
   */
  async getActiveAnnouncement(
    args: GetActiveAnnouncementArgs = {}
  ): Promise<announcementsModel | null> {
    // Remove p_now parameter - use database NOW() instead (eliminates new Date() call)
    return withSmartCache<announcementsModel | null>(
      'getActiveAnnouncement',
      'getActiveAnnouncement',
      async () => {
        // OPTIMIZATION: Use Prisma query builder instead of raw SQL for better type safety and maintainability
        // Since we're in withSmartCache (skips during build), Date.now() is safe here
        const now = new Date();
        
        const result = await prisma.announcements.findFirst({
          where: {
            active: true,
            AND: [
              {
                OR: [
                  { start_date: null },
                  { start_date: { lte: now } },
                ],
              },
              {
                OR: [
                  { end_date: null },
                  { end_date: { gte: now } },
                ],
              },
            ],
          },
          orderBy: [
            { priority: 'desc' },
            { start_date: { sort: 'desc', nulls: 'last' } },
          ],
        });
        
        return result;
      },
      args
    );
  }

  /**
   * Get contact commands
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was returning a nested array structure (ContactCommandResult[][]), but we can
   * return a simple array directly. Transform Prisma model to match RPC composite type structure.
   *
   * Note: The RPC returned ContactCommandResult[][] (array of arrays), but consumers
   * access it as result?.[0] (first array). We return an array that matches ContactCommandResult
   * structure (with `text` field instead of `command_text`).
   *
   * @returns Array of contact commands (transformed to match RPC structure)
   */
  async getContactCommands(): Promise<
    Array<{
      id: string | null;
      text: string | null;
      description: string | null;
      category: string | null;
      icon_name: string | null;
      action_type: string | null;
      action_value: string | null;
      confetti_variant: string | null;
      requires_auth: boolean | null;
      aliases: string[] | null;
    }>
  > {
    return withSmartCache(
      'getContactCommands',
      'getContactCommands',
      async () => {
        // OPTIMIZATION: Use select to fetch only needed fields, excluding timestamps and unused metadata
        const commands = await prisma.contact_commands.findMany({
          where: {
            is_active: true,
          },
          select: {
            id: true,
            command_text: true,
            description: true,
            category: true,
            icon_name: true,
            action_type: true,
            action_value: true,
            confetti_variant: true,
            requires_auth: true,
            aliases: true,
            // Exclude: created_at, updated_at, metadata (not used in transformation)
          },
          orderBy: {
            display_order: 'asc',
          },
        });

        // Transform Prisma model to match RPC composite type structure
        // RPC uses `text` instead of `command_text`, and `id` instead of `id`
        return commands.map((cmd) => ({
          id: cmd.id,
          text: cmd.command_text, // Transform command_text -> text
          description: cmd.description,
          category: cmd.category,
          icon_name: cmd.icon_name,
          action_type: cmd.action_type,
          action_value: cmd.action_value,
          confetti_variant: cmd.confetti_variant,
          requires_auth: cmd.requires_auth,
          aliases: cmd.aliases,
        }));
      },
      {}
    );
  }

  /**
   * Get form field configuration
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT with WHERE/ORDER BY, which Prisma handles perfectly.
   *
   * @param args - Arguments with p_form_type
   * @returns Array of form field configurations
   */
  async getFormFieldConfig(args: GetFormFieldConfigArgs): Promise<GetFormFieldConfigReturns> {
    return withSmartCache(
      'getFormFieldConfig',
      'getFormFieldConfig',
      async () => {
        // OPTIMIZATION: Use select to fetch only needed fields, excluding timestamps
        const configs = await prisma.form_field_configs.findMany({
          where: {
            form_type: args.p_form_type,
            enabled: true,
          },
          select: {
            field_name: true,
            field_label: true,
            field_type: true,
            required: true,
            placeholder: true,
            help_text: true,
            default_value: true,
            grid_column: true,
            icon_name: true,
            icon_position: true,
            config: true, // JSONB field needed for additional config data
            field_group: true,
            display_order: true,
            // Exclude: id, form_type, created_at, updated_at, enabled (not used in transformation)
          },
          orderBy: [{ field_group: 'asc' }, { display_order: 'asc' }],
        });

        // Transform Prisma model to match RPC return structure
        // RPC returns FormFieldConfigResult composite type with form_type and fields array
        // FormFieldConfigItem uses different field names (name, label, type instead of field_name, field_label, field_type)
        const fields = configs.map((config) => {
          // Extract additional fields from config JSON if present
          const configData = (config.config as Record<string, unknown> | null) ?? {};
          return {
            name: config.field_name,
            label: config.field_label,
            type: config.field_type,
            required: config.required,
            placeholder: config.placeholder,
            help_text: config.help_text,
            default_value: config.default_value,
            grid_column: config.grid_column,
            icon_name: config.icon_name,
            icon_position: config.icon_position,
            rows: typeof configData['rows'] === 'number' ? configData['rows'] : null,
            monospace:
              typeof configData['monospace'] === 'boolean' ? configData['monospace'] : null,
            min_value: typeof configData['min_value'] === 'number' ? configData['min_value'] : null,
            max_value: typeof configData['max_value'] === 'number' ? configData['max_value'] : null,
            step_value:
              typeof configData['step_value'] === 'number' ? configData['step_value'] : null,
            select_options:
              (configData['select_options'] as Record<string, unknown> | null) ?? null,
            field_group: config.field_group,
            display_order: config.display_order,
          };
        });

        return {
          form_type: args.p_form_type,
          fields: fields.length > 0 ? fields : null,
        } as GetFormFieldConfigReturns;
      },
      args
    );
  }

  /**
   * Get social proof stats
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing aggregations and counts, which Prisma handles perfectly.
   *
   * @returns Social proof statistics (contributor count, names, submission count, success rate, total users)
   */
  async getSocialProofStats(): Promise<GetSocialProofStatsReturns> {
    return withSmartCache(
      'getSocialProofStats',
      'getSocialProofStats',
      async () => {
        // OPTIMIZATION: Calculate dates once before Promise.all (since we're in withSmartCache, Date.now() is safe)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // OPTIMIZATION: Use Prisma queries instead of raw SQL for better type safety
        const [
          recentSubmissionsCount,
          monthSubmissionsResult,
          topContributorsResult,
          totalContentCount,
        ] = await Promise.all([
          // Recent submissions count (last 7 days)
          prisma.content_submissions.count({
            where: { created_at: { gte: sevenDaysAgo } },
          }),
          // Month submissions and success rate - use Prisma groupBy
          prisma.content_submissions.groupBy({
            by: ['status'],
            where: { created_at: { gte: thirtyDaysAgo } },
            _count: { id: true },
          }),
          // Top 5 contributors this week - use Prisma groupBy
          prisma.content_submissions.groupBy({
            by: ['author'],
            where: { created_at: { gte: sevenDaysAgo } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
          }),
          // Total content count (proxy for total users)
          prisma.content.count(),
        ]);

        // Transform results to match expected structure
        // recentSubmissionsCount is already a number from count()
        // monthSubmissionsResult and topContributorsResult are already in the correct format from groupBy

        // OPTIMIZATION: Calculate month submissions count and success rate from groupBy results
        // groupBy already provides counts per status, so we can sum them directly
        const monthSubmissionsCount = monthSubmissionsResult.reduce(
          (sum, stat) => sum + stat._count.id,
          0
        );
        const approvedCount =
          monthSubmissionsResult.find((stat) => stat.status === 'merged')?._count.id ?? 0;
        const successRate =
          monthSubmissionsCount > 0
            ? Math.round((approvedCount / monthSubmissionsCount) * 100)
            : null;

        // Process contributor names (extract username from email if needed)
        const contributorNames = topContributorsResult
          .map((contributor) => {
            if (!contributor.author) return null;
            // Extract username: handle both email and non-email formats
            const author = contributor.author.trim();
            if (author.includes('@')) {
              return author.substring(0, author.indexOf('@'));
            }
            return author;
          })
          .filter((name): name is string => name !== null);

        // Return single row result (matching RPC return structure)
        return [
          {
            contributor_count: topContributorsResult.length,
            contributor_names: contributorNames.length > 0 ? contributorNames : null,
            submission_count: recentSubmissionsCount,
            success_rate: successRate,
            total_users: totalContentCount,
          },
        ];
      },
      {}
    );
  }

  async getApiHealth(): Promise<GetApiHealthReturns> {
    return this.callRpc<GetApiHealthReturns>('get_api_health', {}, { methodName: 'getApiHealth' });
  }

  async getApiHealthFormatted(): Promise<GetApiHealthFormattedReturns> {
    return this.callRpc<GetApiHealthFormattedReturns>(
      'get_api_health_formatted',
      {},
      { methodName: 'getApiHealthFormatted' }
    );
  }

  async getSiteUrls(): Promise<GetSiteUrlsReturns> {
    return this.callRpc<GetSiteUrlsReturns>('get_site_urls', {}, { methodName: 'getSiteUrls' });
  }

  async getSiteUrlsFormatted(args: GetSiteUrlsFormattedArgs): Promise<GetSiteUrlsFormattedReturns> {
    return this.callRpc<GetSiteUrlsFormattedReturns>('get_site_urls_formatted', args, {
      methodName: 'getSiteUrlsFormatted',
    });
  }

  async generateSitemapXml(args?: GenerateSitemapXmlArgs): Promise<GenerateSitemapXmlReturns> {
    return this.callRpc<GenerateSitemapXmlReturns>('generate_sitemap_xml', args ?? {}, {
      methodName: 'generateSitemapXml',
    });
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

  async upsertAppSetting(setting: AppSettingCreateInput): Promise<void> {
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
  async getEmailEngagementSummary(email: string) {
    return withSmartCache(
      'getEmailEngagementSummary',
      'getEmailEngagementSummary',
      async () => {
        // OPTIMIZATION: Use select to fetch only required fields (10 fields)
        // This reduces data transfer (from 20+ fields to 10 fields)
        // Return type will automatically narrow to selected fields (Prisma handles this)
        const summary = await prisma.email_engagement_summary.findUnique({
          where: { email },
          select: {
            email: true,
            emails_sent: true,
            emails_delivered: true,
            emails_opened: true,
            emails_clicked: true,
            last_sent_at: true,
            last_delivered_at: true,
            last_opened_at: true,
            last_clicked_at: true,
            health_status: true,
          },
        });
        return summary;
      },
      { email } // Cache key
    );
  }

  async upsertEmailEngagementSummary(engagement: EmailEngagementSummaryCreateInput): Promise<void> {
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

  async upsertEmailBlocklist(blocklistEntry: EmailBlocklistCreateInput): Promise<void> {
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

  /**
   * Update webhook event status
   *
   * OPTIMIZATION: Uses Prisma update instead of raw SQL for better type safety.
   * Uses new Date() for timestamp (safe for mutations which don't use caching).
   *
   * @param webhookId - Webhook event ID
   */
  async updateWebhookEventStatus(webhookId: string): Promise<void> {
    try {
      await prisma.webhook_events.update({
        where: { id: webhookId },
        data: {
          processed: true,
          processed_at: new Date(), // Use JavaScript Date for mutations (not in cache context)
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

  async upsertNotification(notification: NotificationCreateInput): Promise<void> {
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

  async insertNotification(notification: NotificationCreateInput): Promise<Notification> {
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

  /**
   * Get webhook event by Svix ID
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT id FROM webhook_events WHERE svix_id = ? AND source = ?,
   * which Prisma handles perfectly. This eliminates the array unwrapping logic.
   *
   * @param args - Arguments with svix_id and source
   * @returns Webhook event ID or null if not found
   */
  async getWebhookEventBySvixId(args: GetWebhookEventBySvixIdArgs): Promise<{ id: string } | null> {
    return withSmartCache(
      'getWebhookEventBySvixId',
      'getWebhookEventBySvixId',
      async () => {
        const event = await prisma.webhook_events.findFirst({
          where: {
            svix_id: args.p_svix_id,
            source: args.p_source as webhook_source,
          },
          select: { id: true },
        });
        return event;
      },
      args
    );
  }

  async insertWebhookEvent(args: InsertWebhookEventArgs): Promise<InsertWebhookEventReturns> {
    // Mutations don't use caching
    return this.callRpc<InsertWebhookEventReturns>('insert_webhook_event', args, {
      methodName: 'insertWebhookEvent',
      useCache: false,
    });
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
    await this.callRpc<void>(rpcName, args, {
      methodName: 'handlePolarWebhookRpc',
      useCache: false,
    });
  }

  // ============================================================================
  // CONSOLIDATED SERVICES: Methods moved from SeoService, CommunityService,
  // QuizService, and EmailService into MiscService for better organization
  // ============================================================================

  /**
   * Generate SEO metadata (from SeoService)
   *
   * @param args - Arguments with p_route and p_include
   * @returns SEO metadata with optional schemas
   */
  async generateMetadata(
    args: GenerateMetadataCompleteArgs
  ): Promise<GenerateMetadataCompleteReturns> {
    return this.callRpc<GenerateMetadataCompleteReturns>('generate_metadata_complete', args, {
      methodName: 'generateMetadata',
    });
  }

  /**
   * Get community directory (from CommunityService)
   *
   * @param args - Arguments with p_limit
   * @returns Community directory data
   */
  async getCommunityDirectory(
    args: GetCommunityDirectoryArgs
  ): Promise<GetCommunityDirectoryReturns> {
    return this.callRpc<GetCommunityDirectoryReturns>('get_community_directory', args, {
      methodName: 'getCommunityDirectory',
    });
  }

  /**
   * Get user profile (from CommunityService)
   *
   * @param args - Arguments with p_user_slug and optional p_viewer_id
   * @returns User profile data
   */
  async getUserProfile(args: GetUserProfileArgs): Promise<GetUserProfileReturns> {
    return this.callRpc<GetUserProfileReturns>('get_user_profile', args, {
      methodName: 'getUserProfile',
    });
  }

  /**
   * Get user collection detail (from CommunityService)
   *
   * @param args - Arguments with p_collection_slug, p_user_slug, and optional p_viewer_id
   * @returns User collection detail data
   */
  async getUserCollectionDetail(
    args: GetUserCollectionDetailArgs
  ): Promise<GetUserCollectionDetailReturns> {
    return this.callRpc<GetUserCollectionDetailReturns>('get_user_collection_detail', args, {
      methodName: 'getUserCollectionDetail',
    });
  }

  /**
   * Get quiz configuration (from QuizService)
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   *
   * @returns Array of quiz questions with nested options
   */
  async getQuizConfiguration(): Promise<GetQuizConfigurationReturns> {
    return withSmartCache(
      'getQuizConfiguration',
      'getQuizConfiguration',
      async () => {
        // OPTIMIZATION: Use relationLoadStrategy: 'join' to fetch questions and options in a single query
        // OPTIMIZATION: Replace include with select to fetch only required fields
        // This reduces data transfer from both questions and options tables
        const questions = await prisma.quiz_questions.findMany({
          select: {
            question_id: true,
            question_text: true,
            description: true,
            required: true,
            display_order: true,
            quiz_options: {
              select: {
                value: true,
                label: true,
                description: true,
                icon_name: true,
              },
              orderBy: {
                display_order: 'asc',
              },
            },
          },
          orderBy: {
            display_order: 'asc',
          },
          relationLoadStrategy: 'join', // Use JOIN for better performance (requires relationJoins preview feature)
        });

        // Transform to match RPC return structure (QuizConfigurationQuestion[])
        const transformed: QuizConfigurationQuestion[] = questions.map(
          (q: (typeof questions)[number]) => ({
            id: q.question_id,
            question: q.question_text,
            description: q.description,
            required: q.required ?? false,
            display_order: q.display_order,
            options: q.quiz_options.map((opt: (typeof q.quiz_options)[number]) => ({
              value: opt.value,
              label: opt.label,
              description: opt.description,
              icon_name: opt.icon_name,
            })),
          })
        );

        return transformed;
      },
      {}
    );
  }

  /**
   * Get recommendations (from QuizService)
   *
   * @param args - Arguments for recommendations
   * @returns Recommendations data
   */
  async getRecommendations(args: GetRecommendationsArgs): Promise<GetRecommendationsReturns> {
    return this.callRpc<GetRecommendationsReturns>('get_recommendations', args, {
      methodName: 'getRecommendations',
    });
  }

  /**
   * Get due sequence emails (from EmailService)
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   *
   * @returns Array of due sequence email items
   */
  async getDueSequenceEmails(): Promise<DueSequenceEmailItem[]> {
    // OPTIMIZATION: Use Prisma query builder instead of raw SQL for better type safety and maintainability
    // Since this is not in withSmartCache, we can safely use new Date()
    const now = new Date();
    
    const dueSchedules = await prisma.email_sequence_schedule.findMany({
      where: {
        sequence_id: 'onboarding',
        processed: false,
        due_at: { lte: now },
      },
      orderBy: { due_at: 'asc' },
      take: 100,
      select: {
        id: true,
        sequence_id: true,
        email: true,
        due_at: true,
        processed: true,
        step: true,
      },
    });

    if (dueSchedules.length === 0) {
      // Return empty array matching DueSequenceEmailItem[] type
      const emptyResult: DueSequenceEmailItem[] = [];
      return emptyResult;
    }

    // Fetch active sequences for the emails (step 2)
    const emails = dueSchedules.map((s: (typeof dueSchedules)[number]) => s.email);
    const activeSequences = await prisma.email_sequences.findMany({
      where: {
        sequence_id: 'onboarding',
        email: {
          in: emails,
        },
        status: 'active',
      },
      select: {
        email: true,
      },
    });

    // Create a Set of active email addresses for fast lookup
    const activeEmailsSet = new Set(
      activeSequences.map((s: (typeof activeSequences)[number]) => s.email)
    );

    // Filter schedules to only those with active sequences and transform to match RPC return structure
    // DueSequenceEmailItem has all fields nullable
    const result: DueSequenceEmailItem[] = dueSchedules
      .filter((schedule: (typeof dueSchedules)[number]) => activeEmailsSet.has(schedule.email))
      .map((schedule: (typeof dueSchedules)[number]) => ({
        id: schedule.id ?? null,
        sequence_id: schedule.sequence_id ?? null,
        email: schedule.email ?? null,
        due_at: schedule.due_at ? schedule.due_at.toISOString() : null,
        processed: schedule.processed ?? null,
        step: schedule.step ?? null,
      }));

    return result;
  }

  /**
   * Claims an email sequence step (idempotent update) (from EmailService)
   * Updates current_step only if it matches the expected value (prevents duplicate sends)
   * Returns the updated record if successful, null if already claimed
   *
   * OPTIMIZATION: Uses transaction for atomic operation (update + fetch in same transaction)
   */
  async claimEmailSequenceStep(
    sequenceId: string,
    expectedStep: number
  ): Promise<EmailSequence | null> {
    // OPTIMIZATION: Use transaction for atomic operation
    return this.transaction(
      async (tx) => {
        // Step 1: Update (atomic check + update)
        const result = await tx.email_sequences.updateMany({
          where: {
            id: sequenceId,
            current_step: expectedStep, // Only update if step hasn't changed (idempotency check)
          },
          data: {
            current_step: expectedStep + 1,
            // Use database NOW() for updated_at (eliminates new Date() call)
            // Note: Prisma doesn't support SQL functions in data, so we use raw SQL for the entire update
          },
        });
        // Update updated_at using Prisma update (within transaction)
        await tx.email_sequences.update({
          where: { id: sequenceId },
          data: { updated_at: new Date() },
        });

        // Step 2: Fetch updated record (in same transaction)
        if (result.count === 0) {
          return null; // Step was already claimed
        }

        const updated = await tx.email_sequences.findUnique({
          where: { id: sequenceId },
        });

        return updated ?? null;
      },
      { timeout: 10000 }
    ); // 10 second timeout for email sequence operations
  }

  /**
   * Updates email sequence last_sent_at timestamp (from EmailService)
   */
  /**
   * Update email sequence last_sent_at timestamp
   *
   * OPTIMIZATION: Uses Prisma update instead of raw SQL for better type safety.
   * Uses new Date() for timestamp (safe for mutations which don't use caching).
   *
   * @param sequenceId - Email sequence ID
   */
  async updateEmailSequenceLastSent(sequenceId: string): Promise<void> {
    await prisma.email_sequences.update({
      where: { id: sequenceId },
      data: { last_sent_at: new Date() },
    });
  }

  /**
   * Enrolls an email address into the onboarding email sequence (from EmailService)
   * Uses the database RPC to create/update the email sequence record
   * This is a mutation, so it does NOT use request-scoped caching
   */
  async enrollInEmailSequence(args: EnrollInEmailSequenceArgs): Promise<void> {
    await this.callRpc<void>('enroll_in_email_sequence', args, {
      methodName: 'enrollInEmailSequence',
      useCache: false,
    });
  }
}
