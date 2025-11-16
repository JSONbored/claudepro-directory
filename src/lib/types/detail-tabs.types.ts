/**
 * Type definitions for tabbed detail layout components
 */

import type { ReactNode } from 'react';
import type { UnifiedCategoryConfig } from '@/src/lib/data/config/category';
import type { CategoryId, TabConfig } from '@/src/lib/data/config/category/category-config.types';
import type { ContentItem } from '@/src/lib/data/content';
import type { GetContentDetailCompleteReturn, Tables } from '@/src/types/database-overrides';

/**
 * Pre-processed section data passed from server component
 */
export interface ProcessedSectionData {
  // Content/Code section data
  contentData?: {
    html: string;
    code: string;
    language: string;
    filename: string;
  } | null;

  // Configuration section data
  configData?:
    | {
        format: 'json';
        html: string;
        code: string;
        filename: string;
      }
    | {
        format: 'multi';
        configs: Array<{ key: string; html: string; code: string; filename: string }>;
      }
    | {
        format: 'hook';
        hookConfig: { html: string; code: string; filename: string } | null;
        scriptContent: { html: string; code: string; filename: string } | null;
      }
    | null;

  // Installation section data
  installationData?:
    | {
        claudeCode: {
          steps: Array<
            { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
          >;
          configPath?: Record<string, string>;
          configFormat?: string;
        } | null;
        claudeDesktop: {
          steps: Array<
            { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
          >;
          configPath?: Record<string, string>;
        } | null;
        sdk: {
          steps: Array<
            { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
          >;
        } | null;
        requirements?: string[];
      }
    | null
    | undefined;

  // Examples section data
  examplesData?: Array<{
    title: string;
    description?: string;
    html: string;
    code: string;
    language: string;
    filename: string;
  }> | null;

  // Simple array data
  features?: string[];
  useCases?: string[];
  requirements?: string[];
  troubleshooting?: Array<string | { issue: string; solution: string }>;

  // Special content types
  guideSections?: Array<Record<string, unknown> & { html?: string }> | null;
  collectionSections?: ReactNode;
}

/**
 * Props for TabbedDetailLayout component
 *
 * Note: TabbedDetailLayout is only used for content detail pages, never for jobs.
 * So we narrow the type to exclude Tables<'jobs'> to ensure proper type safety.
 */
export interface TabbedDetailLayoutProps {
  item: Tables<'content'> | GetContentDetailCompleteReturn['content'];
  config: UnifiedCategoryConfig<CategoryId>;
  tabs: ReadonlyArray<TabConfig>;
  sectionData: ProcessedSectionData;
  relatedItems?: ContentItem[] | GetContentDetailCompleteReturn['related'];
}
