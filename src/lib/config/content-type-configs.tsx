/**
 * Content Type Configurations - Database-First Architecture
 *
 * MIGRATED TO DATABASE: All configuration data now lives in category_configs table.
 * This file provides runtime mapping from database configs to TypeScript/React components.
 */

import { unstable_cache } from 'next/cache';
import {
  commonActions,
  createDownloadAction,
  createGitHubLinkAction,
  createNotificationAction,
  createScrollAction,
} from '@/src/lib/config/factories/action-factories';
import {
  BookOpen,
  Bot,
  Briefcase,
  Code,
  FileText,
  Layers,
  type LucideIcon,
  Server,
  Sparkles,
  Terminal,
  Webhook,
} from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/server';
import type {
  ActionButtonConfig,
  ContentTypeConfig,
  ContentTypeConfigRegistry,
  SectionConfig,
} from '@/src/lib/types/content-type-config';
import type { Tables } from '@/src/types/database.types';

// Icon name to component mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Terminal,
  Webhook,
  Bot,
  BookOpen,
  Server,
  Layers,
  Briefcase,
  FileText,
  Code,
};

// Map database action type to action handler
function createPrimaryAction(
  dbConfig: Tables<'category_configs'>,
  IconComponent: LucideIcon
): ActionButtonConfig {
  const actionConfig = dbConfig.primary_action_config as Record<string, string> | null;

  switch (dbConfig.primary_action_type) {
    case 'notification':
      return createNotificationAction(
        dbConfig.primary_action_label,
        <IconComponent className="h-4 w-4 mr-2" />,
        actionConfig?.notificationTitle || 'Action',
        actionConfig?.notificationDescription || ''
      );

    case 'copy_command':
      return commonActions.copyCommand();

    case 'copy_script':
      return commonActions.copyScript();

    case 'scroll':
      return createScrollAction(
        dbConfig.primary_action_label,
        <IconComponent className="h-4 w-4 mr-2" />,
        actionConfig?.sectionId || 'content'
      );

    case 'download':
      return createDownloadAction(
        dbConfig.primary_action_label,
        <IconComponent className="h-4 w-4 mr-2" />,
        actionConfig?.pathTemplate || '/downloads/{slug}.zip'
      );

    case 'github_link':
      return createGitHubLinkAction(
        actionConfig?.pathTemplate || '',
        dbConfig.primary_action_label,
        <Webhook className="h-4 w-4 mr-2" />
      );

    default:
      // Fallback to scroll action
      return createScrollAction(
        dbConfig.primary_action_label,
        <IconComponent className="h-4 w-4 mr-2" />,
        'content'
      );
  }
}

const CATEGORY_CONFIG_REVALIDATE_SECONDS = 60 * 60 * 24; // 24 hours
const CATEGORY_CONFIG_TAG = 'category-configs';

async function fetchContentTypeConfig(
  category: Tables<'category_configs'>['category']
): Promise<ContentTypeConfig | null> {
  const supabase = await createClient();

  const { data: dbConfig, error } = await supabase
    .from('category_configs')
    .select('*')
    .eq('category', category)
    .single();

  if (error || !dbConfig) {
    console.error(`Failed to load config for category: ${category}`, error);
    return null;
  }

  // Map icon name to component
  const icon = ICON_MAP[dbConfig.icon_name] || FileText;

  // Parse sections from JSONB
  const sections = dbConfig.sections as unknown as SectionConfig;

  // Create primary action with proper handler
  const primaryAction = createPrimaryAction(dbConfig, icon);

  return {
    typeName: dbConfig.title,
    icon,
    colorScheme: dbConfig.color_scheme,
    description: dbConfig.description,
    primaryAction,
    sections,
    generators: {}, // Empty - generators now in database
  };
}

const getCachedContentTypeConfig = unstable_cache(fetchContentTypeConfig, ['category-config'], {
  revalidate: CATEGORY_CONFIG_REVALIDATE_SECONDS,
  tags: [CATEGORY_CONFIG_TAG],
});

/**
 * Fetch content type configuration from database
 *
 * @param category - Content category
 * @returns ContentTypeConfig with mapped React components and handlers, or null if not found
 */
export async function getContentTypeConfig(
  category: string | undefined | null
): Promise<ContentTypeConfig | null> {
  if (!category) return null;
  return getCachedContentTypeConfig(category as Tables<'category_configs'>['category']);
}

/**
 * LEGACY EXPORT - For backwards compatibility
 *
 * This will be removed once all call sites are updated to use async getContentTypeConfig
 */
export const CONTENT_TYPE_CONFIGS: Partial<ContentTypeConfigRegistry> = {
  // Empty object - all configs now loaded from database
  // Call sites should use: await getContentTypeConfig(category)
};
