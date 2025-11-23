import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../toolkit/logger.js';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
// Go up from dist/commands to root/packages/data-layer
const DATA_LAYER_ROOT = path.resolve(SCRIPT_DIR, '../../../../packages/data-layer/src');

interface ServiceMethod {
  rpcName: string;
  description?: string;
}

interface ServiceConfig {
  description: string;
  methods: Record<string, string | ServiceMethod>;
}

// Definition of services to generate
const SERVICE_DEFINITIONS: Record<string, ServiceConfig> = {
  AccountService: {
    description: 'Service for user account and dashboard data',
    methods: {
      getAccountDashboard: 'get_account_dashboard',
      getUserLibrary: 'get_user_library',
      getUserDashboard: 'get_user_dashboard',
      getCollectionDetailWithItems: 'get_collection_detail_with_items',
      getUserSettings: 'get_user_settings',
      getSponsorshipAnalytics: 'get_sponsorship_analytics',
      getUserCompanies: 'get_user_companies',
      getUserSponsorships: 'get_user_sponsorships',
      getSubmissionDashboard: 'get_submission_dashboard',
      isBookmarked: 'is_bookmarked',
      isBookmarkedBatch: 'is_bookmarked_batch',
      isFollowing: 'is_following',
      isFollowingBatch: 'is_following_batch',
      getUserActivitySummary: 'get_user_activity_summary',
      getUserActivityTimeline: 'get_user_activity_timeline',
      getUserIdentities: 'get_user_identities',
    },
  },
  CommunityService: {
    description: 'Service for community directory and profiles',
    methods: {
      getCommunityDirectory: 'get_community_directory',
      getUserProfile: 'get_user_profile',
      getUserCollectionDetail: 'get_user_collection_detail',
    },
  },
  CompaniesService: {
    description: 'Service for company profiles and lists',
    methods: {
      getCompanyAdminProfile: 'get_company_admin_profile',
      getCompanyProfile: 'get_company_profile',
      getCompaniesList: 'get_companies_list',
    },
  },
  ContentService: {
    description: 'Service for content retrieval, filtering, and analytics',
    methods: {
      getSitewideReadme: 'generate_readme_data',
      getSitewideLlmsTxt: 'generate_sitewide_llms_txt',
      getChangelogLlmsTxt: 'generate_changelog_llms_txt',
      getCategoryLlmsTxt: 'generate_category_llms_txt',
      getChangelogEntryLlmsTxt: 'generate_changelog_entry_llms_txt',
      getToolLlmsTxt: 'generate_tool_llms_txt',
      getCategoryConfigs: 'get_category_configs_with_features',
      getApiContentFull: 'get_api_content_full',
      getContentDetailComplete: 'get_content_detail_complete',
      getEnrichedContentList: 'get_enriched_content_list',
      getContentPaginated: 'get_content_paginated',
      getHomepageComplete: 'get_homepage_complete',
      getReviewsWithStats: 'get_reviews_with_stats',
      getRelatedContent: 'get_related_content',
      getSimilarContent: 'get_similar_content',
      getContentTemplates: 'get_content_templates',
      getContentPaginatedSlim: 'get_content_paginated_slim',
    },
  },
  JobsService: {
    description: 'Service for job listings and details',
    methods: {
      getJobs: 'get_jobs_list',
      getJobBySlug: 'get_job_detail',
      getFeaturedJobs: 'get_featured_jobs',
      getJobsByCategory: 'get_jobs_by_category',
      getJobsCount: 'get_jobs_count',
    },
  },
  MiscService: {
    description: 'Service for miscellaneous data (notifications, announcements, etc.)',
    methods: {
      getActiveNotifications: 'get_active_notifications',
      getActiveAnnouncement: 'get_active_announcement',
      getNavigationMenu: 'get_navigation_menu',
      getContactCommands: 'get_contact_commands',
      getFormFieldConfig: 'get_form_field_config',
    },
  },
  // NewsletterService skipped for now (contains non-RPC method getSubscriptionById)
  // We will handle it manually or in a future pass.
  QuizService: {
    description: 'Service for quiz configuration and recommendations',
    methods: {
      getQuizConfiguration: 'get_quiz_configuration',
      getRecommendations: 'get_recommendations',
    },
  },
  SearchService: {
    description: 'Service for unified search and job filtering',
    methods: {
      searchUnified: 'search_unified',
      searchContent: 'search_content_optimized',
      filterJobs: 'filter_jobs',
    },
  },
  SeoService: {
    description: 'Service for generating SEO metadata',
    methods: {
      generateMetadata: 'generate_metadata_complete',
    },
  },
  TrendingService: {
    description: 'Service for trending content and metrics',
    methods: {
      getTrendingMetrics: 'get_trending_metrics_with_content',
      getPopularContent: 'get_popular_content',
      getRecentContent: 'get_recent_content',
      getTrendingContent: 'get_trending_content',
    },
  },
  ChangelogService: {
    description: 'Service for accessing changelog data',
    methods: {
      getChangelogOverview: 'get_changelog_overview',
      getChangelogDetail: 'get_changelog_detail',
      getChangelogWithCategoryStats: 'get_changelog_with_category_stats',
    },
  },
};

export async function runGenerateServices(targetService?: string) {
  logger.info('🚀 Starting Service Auto-Generation POC...');

  const servicesToGenerate = targetService
    ? { [targetService]: SERVICE_DEFINITIONS[targetService] }
    : SERVICE_DEFINITIONS;

  // Check if the specific target was found
  if (targetService && !SERVICE_DEFINITIONS[targetService]) {
    logger.error(`Service ${targetService} not found in definitions.`);
    return;
  }

  for (const [className, config] of Object.entries(servicesToGenerate)) {
    if (!config) continue;
    await generateServiceFile(className, config);
  }

  logger.info('✨ Service generation complete.');
}

async function generateServiceFile(className: string, config: ServiceConfig) {
  const fileName = `${className.replace('Service', '').toLowerCase()}.generated.ts`;
  const outputPath = path.join(DATA_LAYER_ROOT, 'services', fileName);

  logger.info(`Generating ${className} to ${fileName}...`);

  const methodStrings = Object.entries(config.methods).map(([methodName, rpcDef]) => {
    const rpcName = typeof rpcDef === 'string' ? rpcDef : rpcDef.rpcName;

    return `
  /**
   * Calls the database RPC: ${rpcName}
   */
  async ${methodName}(args: Database['public']['Functions']['${rpcName}']['Args']) {
    const { data, error } = await this.supabase.rpc('${rpcName}', args);
    if (error) throw error;
    return data as Database['public']['Functions']['${rpcName}']['Returns'];
  }`;
  });

  const fileContent = `/**
 * 🔒 AUTO-GENERATED SERVICE - DO NOT EDIT DIRECTLY
 * 
 * This file is generated by the "Hollow Core" architecture generator.
 * To update this service, update the database schema and re-run the generator.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export class ${className} {
  constructor(private supabase: SupabaseClient<Database>) {}
${methodStrings.join('\n')}
}
`;

  // Ensure directory exists (though it should)
  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, fileContent, 'utf-8');
  logger.info(`Created ${outputPath}`);
}
