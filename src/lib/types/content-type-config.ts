/**
 * Content Type Configuration System
 *
 * Unified configuration interface for all content types (agents, commands, hooks, mcp, rules).
 * Provides type-safe configuration for detail page rendering, custom sections, and generators.
 *
 * @see components/unified-detail-page.tsx - Main consumer of these configs
 */

import type { ReactNode } from 'react';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import type { LucideIcon } from '@/src/lib/icons';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';

/**
 * Installation steps structure
 */
export interface InstallationSteps {
  claudeCode?: {
    steps?: string[];
    configPath?: Record<string, string>;
    configFormat?: string;
  };
  claudeDesktop?: {
    steps?: string[];
    configPath?: Record<string, string>;
  };
  sdk?: {
    steps?: string[];
  };
  requirements?: string[];
}

/**
 * Action button configuration
 */
export interface ActionButtonConfig {
  label: string;
  icon: ReactNode;
  handler: (item: ContentItem) => void | Promise<void>;
}

/**
 * Section visibility configuration
 */
export interface SectionConfig {
  features: boolean;
  installation: boolean;
  use_cases: boolean;
  configuration: boolean;
  security: boolean;
  troubleshooting: boolean;
  examples: boolean;
}

/**
 * Generator functions - DEPRECATED
 *
 * Generators have been migrated to PostgreSQL database (content_generator_configs table).
 * All generation logic now happens in the database via triggers using generate_content_field() RPC.
 *
 * This interface is kept for backwards compatibility but should not be used.
 * All content fields (installation, use_cases, troubleshooting, etc.) are now pre-populated
 * in the database before TypeScript ever sees them.
 */
export type GeneratorConfig = Record<string, never>;

/**
 * Custom renderer functions for specialized content
 */
export interface RendererConfig {
  configRenderer?: (item: ContentItem, handlers?: Record<string, () => void>) => ReactNode;
  sidebarRenderer?: (
    item: ContentItem,
    relatedItems: ContentItem[],
    router: { push: (path: string) => void; back: () => void }
  ) => ReactNode;
  installationRenderer?: (item: ContentItem, installation: InstallationSteps) => ReactNode;
  useCasesRenderer?: (item: ContentItem, use_cases: string[]) => ReactNode;
}

/**
 * Content Type Configuration
 *
 * Main configuration interface for each content type.
 * Defines how content should be displayed, what sections to show,
 * and provides custom rendering and generation logic.
 */
export interface ContentTypeConfig {
  // Display properties
  typeName: string; // "Agent", "Command", "MCP Server", etc.
  icon: LucideIcon; // Lucide icon component
  colorScheme: string; // Tailwind color class for badges (e.g., "purple-500")
  description?: string; // Category description

  // Primary action button
  primaryAction: ActionButtonConfig;

  // Secondary action buttons (optional)
  secondaryActions?: ActionButtonConfig[];

  // Section visibility configuration
  sections: SectionConfig;

  // Custom renderers for specialized content
  renderers?: RendererConfig;

  // Auto-generation helpers
  generators: GeneratorConfig;

  // Additional metadata (optional)
  metadata?: {
    categoryLabel?: string; // Display label for category badge
    showGitHubLink?: boolean; // Show "View on GitHub" link
    githubPathPrefix?: string; // Path prefix for GitHub URLs
  };
}

/**
 * Type-safe content type discriminator
 * Re-exported from canonical schema definition
 */
export type { CategoryId } from '@/src/lib/schemas/shared.schema';

/**
 * Configuration registry type
 * Partial because not all content categories have detailed configs
 */
export type ContentTypeConfigRegistry = Partial<Record<CategoryId, ContentTypeConfig>>;
