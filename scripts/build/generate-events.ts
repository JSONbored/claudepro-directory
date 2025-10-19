#!/usr/bin/env tsx
/**
 * Analytics Events Code Generator - Unified Tree-Shakeable Architecture
 *
 * Generates a single, fully tree-shakeable analytics file from UNIFIED_CATEGORY_REGISTRY.
 * Merges events.constants.ts + events.config.ts + event-payloads.types.ts into ONE file.
 *
 * Modern 2025 Architecture with Maximum Tree-Shaking:
 * - Configuration-driven: Events derive from category registry
 * - Type-safe: Full TypeScript inference with template literals
 * - Zero duplication: Single source of truth
 * - Build-time generation: Zero runtime overhead
 * - Tree-shakeable: Lazy initialization prevents loading unused code
 * - Bundle optimized: Components importing EVENTS get ~2KB, not ~7KB
 *
 * Tree-Shaking Strategy:
 * - EVENTS: Static const, fully tree-shakeable (~2KB)
 * - getEventConfig(): Lazy getter, only loads when tracker.ts needs it (~4KB)
 * - EventPayloads: Types only, 0KB at runtime
 *
 * Usage:
 *   npm run generate:events
 *   (automatically runs during build)
 *
 * @module scripts/generate-events
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type CategoryId,
  UNIFIED_CATEGORY_REGISTRY,
} from '../../src/lib/config/category-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get all category IDs from registry
 * MODERNIZATION: Single source of truth - all categories come from UNIFIED_CATEGORY_REGISTRY
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
 * MODERNIZATION: Pure registry-driven - all categories from UNIFIED_CATEGORY_REGISTRY
 */
function generateTypes(categories: CategoryId[]): string {
  // Format union type with each member on new line (Biome style)
  const categoryUnion = categories.map((c) => `  | '${c}'`).join('\n');

  // Build suffix mapping cases with cascading indentation (Biome style)
  // Each level adds 2 spaces, final `: never` matches deepest nesting
  const suffixCases = categories
    .map((cat, index) => {
      const suffix = categoryToSuffix(cat);
      const indent = '  '.repeat(index);
      if (index === 0) {
        return `T extends '${cat}'\n  ? '${suffix}'`;
      }
      return `${indent}: T extends '${cat}'\n${indent}  ? '${suffix}'`;
    })
    .join('\n');

  // Calculate final indent for `: never` to match deepest nesting level
  const finalIndent = '  '.repeat(categories.length - 1);

  return `/**
 * Category IDs that have analytics events
 * Auto-generated from UNIFIED_CATEGORY_REGISTRY
 * MODERNIZATION: Single source of truth - all 11 categories included
 */
type AnalyticsCategory =
${categoryUnion};

/**
 * Category event suffix mapping (for singular forms)
 * Auto-generated transformation rules:
 * - agents → agent
 * - statuslines → statusline
 * - guides → guide
 * - mcp → mcp (unchanged)
 */
type CategorySuffix<T extends string> = ${suffixCases}
${finalIndent}  : never;

/**
 * TypeScript template literal types for dynamic event generation
 * These types ensure compile-time validation of all event names
 * MODERNIZATION: 100% registry-driven, zero hardcoded categories
 */
type ContentViewEvent<T extends AnalyticsCategory> = \`content_view_\${CategorySuffix<T>}\`;
type RelatedClickEvent<T extends AnalyticsCategory> = \`related_click_from_\${CategorySuffix<T>}\`;
type RelatedViewEvent<T extends AnalyticsCategory> = \`related_view_on_\${CategorySuffix<T>}\`;
type SearchEvent<T extends AnalyticsCategory> = \`search_\${T}\`;
type CopyCodeEvent<T extends AnalyticsCategory> = \`copy_code_\${CategorySuffix<T>}\`;
type CopyMarkdownEvent<T extends AnalyticsCategory> = \`copy_markdown_\${CategorySuffix<T>}\`;
type DownloadMarkdownEvent<T extends AnalyticsCategory> = \`download_markdown_\${CategorySuffix<T>}\`;`;
}

/**
 * Generate event constants for a specific event type
 * MODERNIZATION: Pure registry-driven - no additional types needed
 */
function generateEventSection(
  title: string,
  categories: CategoryId[],
  prefix: string,
  type: string,
  useFullCategoryId = false // For SEARCH events, use full category ID instead of suffix
): string {
  const events: string[] = [];

  // Generate events for all registry categories
  for (const cat of categories) {
    const keySuffix = useFullCategoryId ? cat.toUpperCase() : categoryToKeySuffix(cat);
    const valueSuffix = useFullCategoryId ? cat : categoryToSuffix(cat);
    const key = `${prefix}_${keySuffix}`;
    const value = `${prefix.toLowerCase()}_${valueSuffix}`;
    events.push(`  ${key}: '${value}' as ${type}<'${cat}'>,`);
  }

  return `  // ============================================
  // ${title}
  // ============================================
${events.join('\n')}`;
}

/**
 * Generate EVENT_CONFIG builder function for lazy initialization
 */
function generateEventConfigBuilder(): string {
  return `/**
 * ============================================
 * EVENT CONFIGURATION (LAZY INITIALIZATION)
 * ============================================
 *
 * Tree-shaking optimization: EVENT_CONFIG is built lazily via getEventConfig().
 * Components importing only EVENTS will NOT include this code in their bundle.
 * Only tracker.ts uses this, saving ~5KB per route for other components.
 */

/**
 * Event configuration interface
 */
interface EventConfig {
  description: string;
  category: 'CONTENT' | 'JOURNEY' | 'PERFORMANCE' | 'INTERACTION' | 'ERROR' | 'FEATURE' | 'NAVIGATION' | 'PERSONALIZATION';
  enabled: boolean;
  sampleRate?: number;
  debugOnly?: boolean;
}

/**
 * Category display name mapping for descriptions
 */
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  agents: 'agent',
  mcp: 'MCP server',
  commands: 'command',
  rules: 'rule',
  hooks: 'hook',
  statuslines: 'statusline',
  collections: 'collection',
  skills: 'skill',
  guides: 'guide',
};

/**
 * Build event configurations dynamically from EVENTS
 * Generates consistent configs for all category-specific events
 */
function buildEventConfig(): Record<EventName, EventConfig> {
  const config: Record<string, EventConfig> = {};

  // Dynamically generate configs for all category events
  for (const [key, value] of Object.entries(EVENTS)) {
    const eventName = value as EventName;

    // Content view events
    if (key.startsWith('CONTENT_VIEW_')) {
      const category = key.replace('CONTENT_VIEW_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: \`User views \${displayName} detail page\`,
        category: 'CONTENT',
        enabled: true,
      };
    }
    // Related view events
    else if (key.startsWith('RELATED_VIEW_ON_')) {
      const category = key.replace('RELATED_VIEW_ON_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: \`Related content viewed on \${displayName} detail page\`,
        category: 'CONTENT',
        enabled: true,
      };
    }
    // Related click events
    else if (key.startsWith('RELATED_CLICK_FROM_')) {
      const category = key.replace('RELATED_CLICK_FROM_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: \`User clicks related content from \${displayName} detail page\`,
        category: 'CONTENT',
        enabled: true,
      };
    }
    // Search events
    else if (key.startsWith('SEARCH_') && key !== 'SEARCH_GLOBAL') {
      const category = key.replace('SEARCH_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: \`User searches within \${displayName} section\`,
        category: 'INTERACTION',
        enabled: true,
      };
    }
    // Copy code events
    else if (key.startsWith('COPY_CODE_')) {
      const category = key.replace('COPY_CODE_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: \`User copies code from \${displayName} detail page\`,
        category: 'INTERACTION',
        enabled: true,
      };
    }
    // Copy markdown events
    else if (key.startsWith('COPY_MARKDOWN_')) {
      const category = key.replace('COPY_MARKDOWN_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: \`User copies \${displayName} as markdown\`,
        category: 'INTERACTION',
        enabled: true,
      };
    }
    // Download markdown events
    else if (key.startsWith('DOWNLOAD_MARKDOWN_')) {
      const category = key.replace('DOWNLOAD_MARKDOWN_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: \`User downloads \${displayName} as markdown file\`,
        category: 'INTERACTION',
        enabled: true,
      };
    }
  }

  // Add static event configurations
  return {
    ...config,

    // Related Content (Generic)
    [EVENTS.RELATED_CONTENT_IMPRESSION]: {
      description: 'Related content items shown to user',
      category: 'CONTENT',
      enabled: true,
      sampleRate: 0.5,
    },
    [EVENTS.CAROUSEL_NAVIGATION]: {
      description: 'User navigates carousel',
      category: 'CONTENT',
      enabled: true,
    },

    // User Journey
    [EVENTS.CONTENT_JOURNEY]: {
      description: 'User navigates between content',
      category: 'JOURNEY',
      enabled: true,
    },
    [EVENTS.SESSION_START]: {
      description: 'New user session starts',
      category: 'JOURNEY',
      enabled: true,
    },
    [EVENTS.SESSION_DEPTH]: {
      description: 'Session engagement metrics',
      category: 'JOURNEY',
      enabled: true,
    },

    // Performance
    [EVENTS.PERFORMANCE_METRIC]: {
      description: 'Performance measurement (Core Web Vitals)',
      category: 'PERFORMANCE',
      enabled: true,
      sampleRate: 0.2,
    },
    [EVENTS.CACHE_PERFORMANCE]: {
      description: 'Cache hit/miss metrics',
      category: 'PERFORMANCE',
      enabled: true,
      sampleRate: 0.1,
    },
    [EVENTS.API_LATENCY]: {
      description: 'API response times',
      category: 'PERFORMANCE',
      enabled: true,
      sampleRate: 0.1,
    },
    [EVENTS.PAGE_LOAD_TIME]: {
      description: 'Page load performance',
      category: 'PERFORMANCE',
      enabled: true,
    },

    // Algorithm
    [EVENTS.ALGORITHM_PERFORMANCE]: {
      description: 'Content algorithm effectiveness',
      category: 'CONTENT',
      enabled: true,
    },

    // Search (Global)
    [EVENTS.SEARCH_GLOBAL]: {
      description: 'User performs global search across all content types',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.FILTER_APPLIED]: {
      description: 'User applies filter',
      category: 'NAVIGATION',
      enabled: true,
    },

    // Sharing & Feedback
    [EVENTS.DOWNLOAD_RESOURCE]: {
      description: 'User downloads resource',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.SHARE_CONTENT]: {
      description: 'User shares content',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.FEEDBACK_SUBMITTED]: {
      description: 'User submits feedback',
      category: 'INTERACTION',
      enabled: true,
    },

    // Email Capture
    [EVENTS.EMAIL_MODAL_SHOWN]: {
      description: 'Email capture modal displayed to user',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EMAIL_MODAL_DISMISSED]: {
      description: 'User dismissed email capture modal',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EMAIL_SUBSCRIBED_FOOTER]: {
      description: 'User subscribed via sticky footer bar',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EMAIL_SUBSCRIBED_INLINE]: {
      description: 'User subscribed via inline CTA',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EMAIL_SUBSCRIBED_POST_COPY]: {
      description: 'User subscribed via post-copy modal',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EMAIL_SUBSCRIBED_HOMEPAGE]: {
      description: 'User subscribed from homepage',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EMAIL_SUBSCRIBED_MODAL]: {
      description: 'User subscribed via modal',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EMAIL_SUBSCRIBED_CONTENT_PAGE]: {
      description: 'User subscribed from content detail page',
      category: 'INTERACTION',
      enabled: true,
    },

    // PWA / App Installation
    [EVENTS.PWA_INSTALLABLE]: {
      description: 'PWA install prompt available to user',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.PWA_PROMPT_ACCEPTED]: {
      description: 'User accepted PWA install prompt',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.PWA_PROMPT_DISMISSED]: {
      description: 'User dismissed PWA install prompt',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.PWA_INSTALLED]: {
      description: 'PWA successfully installed to home screen',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.PWA_LAUNCHED]: {
      description: 'App launched in standalone mode (from home screen)',
      category: 'INTERACTION',
      enabled: true,
    },

    // Error Tracking
    [EVENTS.ERROR_OCCURRED]: {
      description: 'Error occurred',
      category: 'ERROR',
      enabled: true,
    },
    [EVENTS.NOT_FOUND]: {
      description: '404 page accessed',
      category: 'ERROR',
      enabled: true,
    },
    [EVENTS.API_ERROR]: {
      description: 'API error occurred',
      category: 'ERROR',
      enabled: true,
    },

    // Content Activation
    [EVENTS.MCP_INSTALLED]: {
      description: 'MCP server installed',
      category: 'FEATURE',
      enabled: true,
    },
    [EVENTS.AGENT_ACTIVATED]: {
      description: 'Agent activated',
      category: 'FEATURE',
      enabled: true,
    },
    [EVENTS.COMMAND_EXECUTED]: {
      description: 'Command executed',
      category: 'FEATURE',
      enabled: true,
    },
    [EVENTS.RULE_APPLIED]: {
      description: 'Rule applied',
      category: 'FEATURE',
      enabled: true,
    },
    [EVENTS.HOOK_TRIGGERED]: {
      description: 'Hook triggered',
      category: 'FEATURE',
      enabled: true,
    },

    // Navigation
    [EVENTS.TAB_SWITCHED]: {
      description: 'Tab switched',
      category: 'NAVIGATION',
      enabled: true,
    },
    [EVENTS.FILTER_TOGGLED]: {
      description: 'Filter toggled',
      category: 'NAVIGATION',
      enabled: true,
    },
    [EVENTS.SORT_CHANGED]: {
      description: 'Sort order changed',
      category: 'NAVIGATION',
      enabled: true,
    },
    [EVENTS.PAGINATION_CLICKED]: {
      description: 'Pagination used',
      category: 'NAVIGATION',
      enabled: true,
    },

    // Personalization
    [EVENTS.PERSONALIZATION_AFFINITY_CALCULATED]: {
      description: 'User affinity score calculated',
      category: 'PERSONALIZATION',
      enabled: true,
      sampleRate: 0.1,
    },
    [EVENTS.PERSONALIZATION_RECOMMENDATION_SHOWN]: {
      description: 'Personalized recommendation displayed',
      category: 'PERSONALIZATION',
      enabled: true,
    },
    [EVENTS.PERSONALIZATION_RECOMMENDATION_CLICKED]: {
      description: 'User clicked personalized recommendation',
      category: 'PERSONALIZATION',
      enabled: true,
    },
    [EVENTS.PERSONALIZATION_SIMILAR_CONFIG_CLICKED]: {
      description: 'User clicked similar config suggestion',
      category: 'PERSONALIZATION',
      enabled: true,
    },
    [EVENTS.PERSONALIZATION_FOR_YOU_VIEWED]: {
      description: 'User viewed For You feed',
      category: 'PERSONALIZATION',
      enabled: true,
    },
    [EVENTS.PERSONALIZATION_USAGE_RECOMMENDATION_SHOWN]: {
      description: 'Usage-based recommendation displayed',
      category: 'PERSONALIZATION',
      enabled: true,
    },
  } as Record<EventName, EventConfig>;
}

/**
 * Lazy initialization cache for EVENT_CONFIG
 * Only builds when getEventConfig() is called (by tracker.ts)
 */
let _eventConfigCache: Record<EventName, EventConfig> | null = null;

/**
 * Get event configuration with lazy initialization
 *
 * Tree-shaking: This function and buildEventConfig() are only included
 * in bundles that actually call getEventConfig(). Components importing
 * only EVENTS will NOT include this code (~5KB savings per route).
 *
 * @returns Event configuration map
 */
export function getEventConfig(): Record<EventName, EventConfig> {
  if (!_eventConfigCache) {
    _eventConfigCache = buildEventConfig();
  }
  return _eventConfigCache;
}`;
}

/**
 * Generate EventPayloads interface (types only - 0KB runtime)
 */
function generateEventPayloads(categories: CategoryId[]): string {
  const payloads: string[] = [];

  // Generate category-specific payloads
  for (const cat of categories) {
    const suffix = categoryToKeySuffix(cat);

    // Content view
    payloads.push(`  [EVENTS.CONTENT_VIEW_${suffix}]: {
    slug: string;
    page: string;
    source?: string;
  };`);

    // Search
    payloads.push(`  [EVENTS.SEARCH_${cat.toUpperCase()}]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };`);

    // Copy code
    payloads.push(`  [EVENTS.COPY_CODE_${suffix}]: {
    slug: string;
    content_length: number;
    language?: string;
  };`);

    // Copy markdown
    payloads.push(`  [EVENTS.COPY_MARKDOWN_${suffix}]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };`);

    // Download markdown
    payloads.push(`  [EVENTS.DOWNLOAD_MARKDOWN_${suffix}]: {
    slug: string;
    filename: string;
    file_size: number;
  };`);

    // Related click from
    payloads.push(`  [EVENTS.RELATED_CLICK_FROM_${suffix}]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };`);

    // Related view on
    payloads.push(`  [EVENTS.RELATED_VIEW_ON_${suffix}]: {
    items_shown: number;
    cache_hit: boolean;
  };`);
  }

  return `/**
 * ============================================
 * EVENT PAYLOAD TYPE DEFINITIONS
 * ============================================
 *
 * Type-only definitions - 0KB runtime cost (types are stripped at compile time).
 * Provides full type safety and autocomplete for trackEvent() calls.
 */

/**
 * Event payload definitions for type-safe analytics tracking
 * Maps each event name to its required payload structure
 */
export interface EventPayloads {
${payloads.join('\n\n')}

  [EVENTS.RELATED_CONTENT_IMPRESSION]: {
    source_page: string;
    algorithm_version: string;
    content_ids: string;
    user_segment?: 'new' | 'returning';
  };

  [EVENTS.CAROUSEL_NAVIGATION]: {
    action: 'next' | 'previous';
    current_slide: number;
    total_slides: number;
    source_page: string;
  };

  [EVENTS.CONTENT_JOURNEY]: {
    from_page: string;
    to_page: string;
    journey_step: number;
    session_id?: string;
  };

  [EVENTS.SESSION_START]: {
    entry_page: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };

  [EVENTS.SESSION_DEPTH]: {
    pages_viewed: number;
    time_spent: number;
    categories_explored: string;
  };

  [EVENTS.PERFORMANCE_METRIC]: {
    metric: string;
    value: number;
    page?: string;
    component?: string;
  };

  [EVENTS.CACHE_PERFORMANCE]: {
    cache_hit: boolean;
    latency_ms: number;
    cache_key?: string;
    cache_size?: number;
  };

  [EVENTS.API_LATENCY]: {
    endpoint: string;
    method: string;
    duration_ms: number;
    status_code: number;
    cached: boolean;
  };

  [EVENTS.PAGE_LOAD_TIME]: {
    page: string;
    time_to_interactive: number;
    time_to_first_byte: number;
    dom_content_loaded: number;
    fully_loaded: number;
  };

  [EVENTS.ALGORITHM_PERFORMANCE]: {
    algorithm_version: string;
    match_score: number;
    user_clicked: boolean;
    position?: number;
  };

  [EVENTS.SEARCH_GLOBAL]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.FILTER_APPLIED]: {
    filter_type: string;
    filter_value: string;
    page: string;
    results_count: number;
  };

  [EVENTS.DOWNLOAD_RESOURCE]: {
    resource_type: string;
    resource_name: string;
    file_size?: number;
    page: string;
  };

  [EVENTS.SHARE_CONTENT]: {
    content_type: string;
    content_slug: string;
    share_method: 'twitter' | 'linkedin' | 'copy_link' | 'email';
  };

  [EVENTS.FEEDBACK_SUBMITTED]: {
    feedback_type: 'helpful' | 'not_helpful' | 'report_issue';
    page: string;
    category?: string;
  };

  [EVENTS.EMAIL_MODAL_SHOWN]: {
    trigger_source: string;
    copy_type?: string;
    session_copy_count: number;
  };

  [EVENTS.EMAIL_MODAL_DISMISSED]: {
    trigger_source: string;
    dismissal_method: 'close_button' | 'overlay_click' | 'maybe_later';
    time_shown_ms: number;
  };

  [EVENTS.EMAIL_SUBSCRIBED_FOOTER]: {
    contact_id?: string;
    referrer?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_INLINE]: {
    contact_id?: string;
    referrer?: string;
    page?: string;
    category?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_POST_COPY]: {
    contact_id?: string;
    referrer?: string;
    copy_type?: string;
    content_category?: string;
    content_slug?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_HOMEPAGE]: {
    contact_id?: string;
    referrer?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_MODAL]: {
    contact_id?: string;
    referrer?: string;
    modal_context?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_CONTENT_PAGE]: {
    contact_id?: string;
    referrer?: string;
    page?: string;
    category?: string;
  };

  [EVENTS.PWA_INSTALLABLE]: {
    platform: string;
    user_agent?: string;
  };

  [EVENTS.PWA_PROMPT_ACCEPTED]: {
    platform: string;
  };

  [EVENTS.PWA_PROMPT_DISMISSED]: {
    platform: string;
  };

  [EVENTS.PWA_INSTALLED]: {
    platform: string;
    timestamp: string;
  };

  [EVENTS.PWA_LAUNCHED]: {
    platform: string;
    timestamp: string;
  };

  [EVENTS.ERROR_OCCURRED]: {
    error_type: string;
    error_code?: string;
    context?: string;
    page?: string;
  };

  [EVENTS.NOT_FOUND]: {
    requested_path: string;
    referrer?: string;
  };

  [EVENTS.API_ERROR]: {
    endpoint: string;
    status_code: number;
    error_message?: string;
  };

  [EVENTS.MCP_INSTALLED]: {
    mcp_slug: string;
    installation_method: string;
    from_page: string;
  };

  [EVENTS.AGENT_ACTIVATED]: {
    agent_slug: string;
    activation_source: string;
    configuration?: string;
  };

  [EVENTS.COMMAND_EXECUTED]: {
    command_slug: string;
    execution_context: string;
    parameters?: string;
  };

  [EVENTS.RULE_APPLIED]: {
    rule_slug: string;
    application_context: string;
  };

  [EVENTS.HOOK_TRIGGERED]: {
    hook_slug: string;
    trigger_context: string;
    execution_time?: number;
  };

  [EVENTS.TAB_SWITCHED]: {
    from_tab: string;
    to_tab: string;
    page: string;
  };

  [EVENTS.FILTER_TOGGLED]: {
    filter_name: string;
    filter_state: boolean;
    page: string;
  };

  [EVENTS.SORT_CHANGED]: {
    sort_field: string;
    sort_direction: 'asc' | 'desc';
    page: string;
  };

  [EVENTS.PAGINATION_CLICKED]: {
    from_page: number;
    to_page: number;
    total_pages: number;
    items_per_page: number;
    section: string;
  };

  [EVENTS.PERSONALIZATION_AFFINITY_CALCULATED]: {
    user_id: string;
    content_type: string;
    affinity_score: number;
    based_on_interactions: number;
  };

  [EVENTS.PERSONALIZATION_RECOMMENDATION_SHOWN]: {
    recommendation_source: string;
    position: number;
    content_slug: string;
    content_type: string;
  };

  [EVENTS.PERSONALIZATION_RECOMMENDATION_CLICKED]: {
    content_slug: string;
    content_type: string;
    position: number;
    recommendation_source: string;
  };

  [EVENTS.PERSONALIZATION_SIMILAR_CONFIG_CLICKED]: {
    source_slug: string;
    target_slug: string;
    similarity_score: number;
  };

  [EVENTS.PERSONALIZATION_FOR_YOU_VIEWED]: {
    items_shown: number;
    algorithm_version: string;
    user_has_history: boolean;
  };

  [EVENTS.PERSONALIZATION_USAGE_RECOMMENDATION_SHOWN]: {
    trigger: string;
    recommendations_count: number;
    context_type?: string;
  };
}

/**
 * Type helper to extract payload type for a specific event
 *
 * @example
 * \`\`\`typescript
 * type Payload = EventPayload<'copy_code_agent'>;
 * // Inferred as: { slug: string; content_length: number; language?: string; }
 * \`\`\`
 */
export type EventPayload<T extends keyof EventPayloads> = EventPayloads[T];`;
}

/**
 * Generate the complete unified events.constants.ts file
 */
function generateUnifiedEventsFile(): string {
  const categories = getAllCategories();

  const header = `/**
 * Analytics Events - Unified Tree-Shakeable Architecture (AUTO-GENERATED)
 *
 * Single source of truth for ALL analytics: events, config, and type definitions.
 * Merges events.constants.ts + events.config.ts + event-payloads.types.ts into ONE file.
 *
 * ⚠️  DO NOT EDIT THIS FILE MANUALLY ⚠️
 * This file is auto-generated by scripts/generate-events.ts
 * To add events, add a category to UNIFIED_CATEGORY_REGISTRY in category-config.ts
 *
 * Modern 2025 Architecture with Maximum Performance:
 * - Configuration-driven: Events auto-generated from category registry
 * - Type-safe: Full TypeScript inference with template literals
 * - Zero duplication: Single source of truth in category-config.ts
 * - Build-time generation: Run 'npm run generate:events'
 * - Maintainable: Add category → all events/config/types auto-generate
 * - Tree-shakeable: Lazy initialization prevents loading unused code
 *
 * Tree-Shaking Optimization:
 * - EVENTS const: ~2KB (imported by all components)
 * - getEventConfig(): ~4KB (only imported by tracker.ts)
 * - EventPayloads: 0KB (types stripped at compile time)
 *
 * Components importing EVENTS get ~2KB, NOT ~7KB like the old architecture.
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
 * ============================================
 * EVENT NAMES (STATIC CONST - TREE-SHAKEABLE)
 * ============================================
 *
 * Static const object - fully tree-shakeable, no side effects.
 * Components can import this without pulling in EVENT_CONFIG.
 * 100% auto-generated from UNIFIED_CATEGORY_REGISTRY.
 */
export const EVENTS = {
${generateEventSection('CONTENT VIEW EVENTS (Category-specific)', categories, 'CONTENT_VIEW', 'ContentViewEvent')}

${generateEventSection('RELATED CONTENT CLICK EVENTS (Category-specific)', categories, 'RELATED_CLICK_FROM', 'RelatedClickEvent')}

${generateEventSection('RELATED CONTENT VIEW EVENTS (Category-specific)', categories, 'RELATED_VIEW_ON', 'RelatedViewEvent')}

${generateEventSection('SEARCH EVENTS (Category-specific)', categories, 'SEARCH', 'SearchEvent', true)}

${generateEventSection('COPY CODE EVENTS (Category-specific)', categories, 'COPY_CODE', 'CopyCodeEvent')}

${generateEventSection('COPY MARKDOWN EVENTS (Category-specific)', categories, 'COPY_MARKDOWN', 'CopyMarkdownEvent')}

${generateEventSection('DOWNLOAD MARKDOWN EVENTS (Category-specific)', categories, 'DOWNLOAD_MARKDOWN', 'DownloadMarkdownEvent')}

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

  // PWA / App Installation
  PWA_INSTALLABLE: 'pwa_installable',
  PWA_PROMPT_ACCEPTED: 'pwa_prompt_accepted',
  PWA_PROMPT_DISMISSED: 'pwa_prompt_dismissed',
  PWA_INSTALLED: 'pwa_installed',
  PWA_LAUNCHED: 'pwa_launched',

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

${generateEventConfigBuilder()}

${generateEventPayloads(categories)}
`;

  return header;
}

/**
 * Main execution
 */
function main() {
  console.log('🎯 Generating unified tree-shakeable analytics from UNIFIED_CATEGORY_REGISTRY...');

  const categories = getAllCategories();
  console.log(`📦 Found ${categories.length} categories: ${categories.join(', ')}`);

  const content = generateUnifiedEventsFile();
  const outputPath = resolve(__dirname, '../../src/lib/analytics/events.constants.ts');

  writeFileSync(outputPath, content, 'utf-8');

  // Auto-format with Biome to ensure consistent formatting
  try {
    execSync(`npx biome format --write ${outputPath}`, { stdio: 'pipe' });
  } catch {
    console.warn(`⚠️  Auto-formatting failed for: ${outputPath}`);
  }

  console.log(`✅ Generated unified file: ${outputPath}`);

  console.log(
    '🌳 Tree-shakeable: EVENTS (~2KB) + getEventConfig() (~4KB lazy) + EventPayloads (0KB types)'
  );
  console.log('📉 Bundle savings: ~5KB per component route vs old architecture');
  console.log('🎉 Analytics generation complete!');
}

main();
