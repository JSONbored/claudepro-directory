/**
 * Page Component Props Schema
 * Defines props for Next.js page components with proper typing
 */

import { z } from 'zod';
import { nonNegativeInt, positiveInt } from '../primitives';
import { unifiedContentItemSchema } from './content-item.schema';

/**
 * Next.js 15 compatible page props schema
 */
export const pagePropsSchema = z
  .object({
    params: z
      .promise(z.record(z.string().describe('Parameter key'), z.any()))
      .optional()
      .describe('Promise resolving to dynamic route parameters'),
    searchParams: z
      .promise(z.record(z.string().describe('Search parameter key'), z.any()))
      .optional()
      .describe('Promise resolving to URL search parameters'),
  })
  .describe('Next.js 15 compatible page component props with async params and searchParams');

export type PageProps = z.infer<typeof pagePropsSchema>;

/**
 * SHA-2100: slugParamsSchema moved to app.schema.ts (canonical location)
 * Import from @/lib/schemas/app.schema instead
 */

/**
 * Search params schema for list pages
 */
export const searchParamsSchema = z
  .object({
    query: z.string().optional().describe('Search query string for filtering content'),
    category: z.string().optional().describe('Category filter for content type'),
    tag: z.string().optional().describe('Tag filter for content classification'),
    author: z.string().optional().describe('Author filter for content creator'),
    sort: z.string().optional().describe('Sort order specification for results'),
    page: z.string().optional().describe('Current page number for pagination'),
    limit: z.string().optional().describe('Maximum number of items per page'),
  })
  .describe('URL search parameters for filtering and paginating content lists');

export type SearchParams = z.infer<typeof searchParamsSchema>;

/**
 * Content detail page props schema
 */
export const contentDetailPagePropsSchema = z
  .object({
    item: unifiedContentItemSchema.describe('Primary content item being displayed'),
    relatedItems: z
      .array(unifiedContentItemSchema)
      .max(10)
      .default([])
      .describe('Related content items for recommendations, limited to 10'),
  })
  .describe('Props for content detail pages displaying a single item with related content');

export type ContentDetailPageProps = z.infer<typeof contentDetailPagePropsSchema>;

/**
 * Home page props schema
 */
export const homePagePropsSchema = z
  .object({
    rules: z.array(unifiedContentItemSchema).describe('Collection of rule content items'),
    mcp: z.array(unifiedContentItemSchema).describe('Collection of MCP server content items'),
    agents: z.array(unifiedContentItemSchema).describe('Collection of agent content items'),
    commands: z.array(unifiedContentItemSchema).describe('Collection of command content items'),
    hooks: z.array(unifiedContentItemSchema).describe('Collection of hook content items'),
    allConfigs: z
      .array(unifiedContentItemSchema)
      .describe('Combined collection of all configuration content'),
  })
  .describe('Props for the home page containing categorized content collections');

export type HomePageProps = z.infer<typeof homePagePropsSchema>;

/**
 * Client component props for home page
 */
export const homePageClientPropsSchema = z
  .object({
    initialData: homePagePropsSchema.describe('Initial server-side data for client hydration'),
  })
  .describe('Props for client-side home page component with SSR hydration data');

export type HomePageClientProps = z.infer<typeof homePageClientPropsSchema>;

/**
 * Content list page props schema
 */
export const contentListPagePropsSchema = z
  .object({
    items: z.array(unifiedContentItemSchema).describe('Array of content items to display'),
    totalCount: nonNegativeInt.describe('Total number of items across all pages'),
    currentPage: positiveInt.default(1).describe('Current page number, defaults to 1'),
    itemsPerPage: positiveInt.default(20).describe('Number of items per page, defaults to 20'),
    category: z
      .enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'])
      .describe('Content category being displayed'),
  })
  .describe('Props for content list pages with pagination and category filtering');

export type ContentListPageProps = z.infer<typeof contentListPagePropsSchema>;

/**
 * Agent detail page props schema
 */
export const agentDetailPagePropsSchema = z
  .object({
    item: unifiedContentItemSchema.describe('Agent content item being displayed'),
    relatedItems: z
      .array(unifiedContentItemSchema)
      .optional()
      .default([])
      .describe('Related agent items for recommendations'),
  })
  .describe('Props for agent detail pages displaying a single agent with related content');

export type AgentDetailPageProps = z.infer<typeof agentDetailPagePropsSchema>;

/**
 * MCP detail page props schema
 */
export const mcpDetailPagePropsSchema = z
  .object({
    item: unifiedContentItemSchema.describe('MCP server content item being displayed'),
    relatedItems: z
      .array(unifiedContentItemSchema)
      .optional()
      .default([])
      .describe('Related MCP server items for recommendations'),
  })
  .describe('Props for MCP server detail pages displaying a single server with related content');

export type McpDetailPageProps = z.infer<typeof mcpDetailPagePropsSchema>;

/**
 * Rule detail page props schema
 */
export const ruleDetailPagePropsSchema = z
  .object({
    item: unifiedContentItemSchema.describe('Rule content item being displayed'),
    relatedItems: z
      .array(unifiedContentItemSchema)
      .optional()
      .default([])
      .describe('Related rule items for recommendations'),
  })
  .describe('Props for rule detail pages displaying a single rule with related content');

export type RuleDetailPageProps = z.infer<typeof ruleDetailPagePropsSchema>;

/**
 * Command detail page props schema
 */
export const commandDetailPagePropsSchema = z
  .object({
    item: unifiedContentItemSchema.describe('Command content item being displayed'),
    relatedItems: z
      .array(unifiedContentItemSchema)
      .optional()
      .default([])
      .describe('Related command items for recommendations'),
  })
  .describe('Props for command detail pages displaying a single command with related content');

export type CommandDetailPageProps = z.infer<typeof commandDetailPagePropsSchema>;

/**
 * Hook detail page props schema
 */
export const hookDetailPagePropsSchema = z
  .object({
    item: unifiedContentItemSchema.describe('Hook content item being displayed'),
    relatedItems: z
      .array(unifiedContentItemSchema)
      .optional()
      .default([])
      .describe('Related hook items for recommendations'),
  })
  .describe('Props for hook detail pages displaying a single hook with related content');

export type HookDetailPageProps = z.infer<typeof hookDetailPagePropsSchema>;
