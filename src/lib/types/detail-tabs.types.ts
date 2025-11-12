/**
 * Type definitions for tabbed detail layout components
 */

import type { CategoryId, TabConfig } from '@/src/lib/config/category-config.types';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import type { UnifiedCategoryConfig } from '@/src/lib/config/category-config';
import type { ReactNode } from 'react';

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
  installationData?: {
    claudeCode: {
      steps: Array<
        | { type: 'command'; html: string; code: string }
        | { type: 'text'; text: string }
      >;
      configPath?: Record<string, string>;
      configFormat?: string;
    } | null;
    claudeDesktop: {
      steps: Array<
        | { type: 'command'; html: string; code: string }
        | { type: 'text'; text: string }
      >;
      configPath?: Record<string, string>;
    } | null;
    sdk: {
      steps: Array<
        | { type: 'command'; html: string; code: string }
        | { type: 'text'; text: string }
      >;
    } | null;
    requirements?: string[];
  } | null | undefined;

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
  guideSections?: unknown[] | null;
  collectionSections?: ReactNode;
}

/**
 * Props for TabbedDetailLayout component
 */
export interface TabbedDetailLayoutProps {
  item: ContentItem;
  config: UnifiedCategoryConfig<CategoryId>;
  tabs: ReadonlyArray<TabConfig>;
  sectionData: ProcessedSectionData;
  relatedItems?: ContentItem[];
}
