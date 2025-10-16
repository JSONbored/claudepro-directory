#!/usr/bin/env tsx
/**
 * Analytics Events Code Generator
 *
 * Generates fully-typed analytics event constants from UNIFIED_CATEGORY_REGISTRY.
 * This is the single source of truth - adding a category automatically generates all event variants.
 *
 * Modern 2025 Architecture:
 * - Configuration-driven: Events derive from category registry
 * - Type-safe: Full TypeScript inference with template literals
 * - Zero duplication: One place to add categories
 * - Build-time generation: Zero runtime overhead
 * - Maintainable: No manual sync required
 *
 * Usage:
 *   npm run generate:events
 *   (automatically runs during build)
 *
 * @module scripts/generate-events
 */

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CategoryId, UNIFIED_CATEGORY_REGISTRY } from '../src/lib/config/category-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Additional content types not in main category registry
 */
const ADDITIONAL_CONTENT_TYPES = ['guide'] as const;

/**
 * Get all category IDs from registry
 */
function getAllCategories(): CategoryId[] {
  return Object.keys(UNIFIED_CATEGORY_REGISTRY) as CategoryId[];
}

/**
 * Convert category ID to singular event suffix
 * agents → agent, statuslines → statusline, mcp → mcp
 */
function categoryToSuffix(categoryId: string): string {
  if (categoryId === 'statuslines') return 'statusline';
  if (categoryId === 'mcp') return 'mcp';
  return categoryId.replace(/s$/, '');
}

/**
 * Convert category ID to uppercase event key suffix
 * agents → AGENT, statuslines → STATUSLINE, mcp → MCP
 */
function categoryToKeySuffix(categoryId: string): string {
  const suffix = categoryToSuffix(categoryId);
  return suffix.toUpperCase();
}

/**
 * Generate TypeScript type definitions for template literals
 */
function generateTypes(categories: CategoryId[]): string {
  const categoryUnion = categories.map((c) => `'${c}'`).join(' | ');
  const additionalUnion = ADDITIONAL_CONTENT_TYPES.map((c) => `'${c}'`).join(' | ');

  // Build suffix mapping cases
  const suffixCases = categories
    .map((cat) => {
      const suffix = categoryToSuffix(cat);
      return `  T extends '${cat}' ? '${suffix}' :`;
    })
    .join('\n');

  const additionalSuffixCases = ADDITIONAL_CONTENT_TYPES.map((type) => {
    return `  T extends '${type}' ? '${type}' :`;
  }).join('\n');

  return `/**
 * Category IDs that have analytics events
 * Auto-generated from UNIFIED_CATEGORY_REGISTRY
 */
type AnalyticsCategory = ${categoryUnion};

/**
 * Additional content types (not in main category registry)
 */
type AdditionalContentType = ${additionalUnion};

/**
 * Category event suffix mapping (for singular forms)
 * Auto-generated transformation rules
 */
type CategorySuffix<T extends string> =
${suffixCases}
${additionalSuffixCases}
  never;

/**
 * TypeScript template literal types for dynamic event generation
 * These types ensure compile-time validation of all event names
 */
type ContentViewEvent<T extends AnalyticsCategory> = \`content_view_\${CategorySuffix<T>}\`;
type RelatedClickEvent<T extends AnalyticsCategory | AdditionalContentType> = \`related_click_from_\${CategorySuffix<T>}\`;
type RelatedViewEvent<T extends AnalyticsCategory | AdditionalContentType> = \`related_view_on_\${CategorySuffix<T>}\`;
type SearchEvent<T extends AnalyticsCategory | 'guides'> = \`search_\${T}\`;
type CopyCodeEvent<T extends AnalyticsCategory | AdditionalContentType> = \`copy_code_\${CategorySuffix<T>}\`;
type CopyMarkdownEvent<T extends AnalyticsCategory | AdditionalContentType> = \`copy_markdown_\${CategorySuffix<T>}\`;
type DownloadMarkdownEvent<T extends AnalyticsCategory | AdditionalContentType> = \`download_markdown_\${CategorySuffix<T>}\`;`;
}

/**
 * Generate event constants for a specific event type
 */
function generateEventSection(
  title: string,
  categories: CategoryId[],
  prefix: string,
  type: string,
  includeAdditional = false,
  useFullCategoryId = false // For SEARCH events, use full category ID instead of suffix
): string {
  const events: string[] = [];

  // Generate for main categories
  for (const cat of categories) {
    // For SEARCH events, use full uppercase category (AGENTS, MCP, etc.)
    // For others, use singular suffix (AGENT, MCP, etc.)
    const keySuffix = useFullCategoryId ? cat.toUpperCase() : categoryToKeySuffix(cat);
    const valueSuffix = useFullCategoryId ? cat : categoryToSuffix(cat);
    const key = `${prefix}_${keySuffix}`;
    const value = `${prefix.toLowerCase()}_${valueSuffix}`;
    events.push(`  ${key}: '${value}' as ${type}<'${cat}'>,`);
  }

  // Generate for additional types if needed
  if (includeAdditional) {
    for (const additional of ADDITIONAL_CONTENT_TYPES) {
      const keySuffix = additional.toUpperCase();
      const value = `${prefix.toLowerCase()}_${additional}`;
      events.push(`  ${prefix}_${keySuffix}: '${value}' as ${type}<'${additional}'>,`);
    }
  }

  return `  // ============================================
  // ${title}
  // ============================================
${events.join('\n')}`;
}

/**
 * Generate the complete events.constants.ts file
 */
function generateEventsFile(): string {
  const categories = getAllCategories();

  const header = `/**
 * Analytics Event Names Constants (AUTO-GENERATED)
 * Single source of truth for all analytics event names
 *
 * ⚠️  DO NOT EDIT THIS FILE MANUALLY ⚠️
 * This file is auto-generated by scripts/generate-events.ts
 * To add events, add a category to UNIFIED_CATEGORY_REGISTRY in category-config.ts
 *
 * Modern 2025 Architecture:
 * - Configuration-driven: Events auto-generated from category registry
 * - Type-safe: Full TypeScript inference with template literals
 * - Zero duplication: Single source of truth in category-config.ts
 * - Build-time generation: Run 'npm run generate:events'
 * - Maintainable: Add category → events auto-generate
 *
 * Generated: ${new Date().toISOString()}
 *
 * @module lib/analytics/events.constants
 * @generated
 */

/**
 * ============================================
 * TYPE-SAFE EVENT GENERATION
 * ============================================
 *
 * Category-specific events use TypeScript template literals
 * for full compile-time type safety and IDE autocomplete.
 */

${generateTypes(categories)}

/**
 * Event names as const for type safety
 * 100% auto-generated from UNIFIED_CATEGORY_REGISTRY
 */
export const EVENTS = {
${generateEventSection('CONTENT VIEW EVENTS (Category-specific)', categories, 'CONTENT_VIEW', 'ContentViewEvent')}

${generateEventSection('RELATED CONTENT CLICK EVENTS (Category-specific)', categories, 'RELATED_CLICK_FROM', 'RelatedClickEvent', true)}

${generateEventSection('RELATED CONTENT VIEW EVENTS (Category-specific)', categories, 'RELATED_VIEW_ON', 'RelatedViewEvent', true)}

${generateEventSection('SEARCH EVENTS (Category-specific)', categories, 'SEARCH', 'SearchEvent', false, true)}
  SEARCH_GUIDES: 'search_guides' as SearchEvent<'guides'>,

${generateEventSection('COPY CODE EVENTS (Category-specific)', categories, 'COPY_CODE', 'CopyCodeEvent', true)}

${generateEventSection('COPY MARKDOWN EVENTS (Category-specific)', categories, 'COPY_MARKDOWN', 'CopyMarkdownEvent', true)}

${generateEventSection('DOWNLOAD MARKDOWN EVENTS (Category-specific)', categories, 'DOWNLOAD_MARKDOWN', 'DownloadMarkdownEvent', true)}

  // ============================================
  // CORE EVENTS (Non-category-specific)
  // ============================================

  // Related Content (Generic)
  RELATED_CONTENT_IMPRESSION: 'related_content_impression',
  CAROUSEL_NAVIGATION: 'carousel_navigation',

  // User Journey
  CONTENT_JOURNEY: 'content_journey',
  SESSION_START: 'session_start',
  SESSION_DEPTH: 'session_depth',

  // Performance
  PERFORMANCE_METRIC: 'performance_metric',
  CACHE_PERFORMANCE: 'cache_performance',
  API_LATENCY: 'api_latency',
  PAGE_LOAD_TIME: 'page_load_time',

  // Algorithm
  ALGORITHM_PERFORMANCE: 'algorithm_performance',

  // Search (Global)
  SEARCH_GLOBAL: 'search_global',
  FILTER_APPLIED: 'filter_applied',

  // Sharing & Feedback
  DOWNLOAD_RESOURCE: 'download_resource',
  SHARE_CONTENT: 'share_content',
  FEEDBACK_SUBMITTED: 'feedback_submitted',

  // Email Capture
  EMAIL_MODAL_SHOWN: 'email_modal_shown',
  EMAIL_MODAL_DISMISSED: 'email_modal_dismissed',
  EMAIL_SUBSCRIBED_FOOTER: 'email_subscribed_footer',
  EMAIL_SUBSCRIBED_INLINE: 'email_subscribed_inline',
  EMAIL_SUBSCRIBED_POST_COPY: 'email_subscribed_post_copy',
  EMAIL_SUBSCRIBED_HOMEPAGE: 'email_subscribed_homepage',
  EMAIL_SUBSCRIBED_MODAL: 'email_subscribed_modal',
  EMAIL_SUBSCRIBED_CONTENT_PAGE: 'email_subscribed_content_page',

  // Error Tracking
  ERROR_OCCURRED: 'error_occurred',
  NOT_FOUND: 'not_found',
  API_ERROR: 'api_error',

  // Content Activation
  MCP_INSTALLED: 'mcp_installed',
  AGENT_ACTIVATED: 'agent_activated',
  COMMAND_EXECUTED: 'command_executed',
  RULE_APPLIED: 'rule_applied',
  HOOK_TRIGGERED: 'hook_triggered',

  // Navigation
  TAB_SWITCHED: 'tab_switched',
  FILTER_TOGGLED: 'filter_toggled',
  SORT_CHANGED: 'sort_changed',
  PAGINATION_CLICKED: 'pagination_clicked',

  // Personalization
  PERSONALIZATION_AFFINITY_CALCULATED: 'personalization_affinity_calculated',
  PERSONALIZATION_RECOMMENDATION_SHOWN: 'personalization_recommendation_shown',
  PERSONALIZATION_RECOMMENDATION_CLICKED: 'personalization_recommendation_clicked',
  PERSONALIZATION_SIMILAR_CONFIG_CLICKED: 'personalization_similar_config_clicked',
  PERSONALIZATION_FOR_YOU_VIEWED: 'personalization_for_you_viewed',
  PERSONALIZATION_USAGE_RECOMMENDATION_SHOWN: 'personalization_usage_recommendation_shown',
} as const;

/**
 * Type helper for event names
 */
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
`;

  return header;
}

/**
 * Main execution
 */
function main() {
  console.log('🎯 Generating analytics events from UNIFIED_CATEGORY_REGISTRY...');

  const categories = getAllCategories();
  console.log(`📦 Found ${categories.length} categories: ${categories.join(', ')}`);

  const content = generateEventsFile();
  const outputPath = resolve(__dirname, '../src/lib/analytics/events.constants.ts');

  writeFileSync(outputPath, content, 'utf-8');

  console.log(`✅ Generated ${outputPath}`);
  console.log('🎉 Analytics events generation complete!');
}

main();
