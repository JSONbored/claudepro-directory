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
export const pagePropsSchema = z.object({
  params: z.promise(z.record(z.string(), z.any())).optional(),
  searchParams: z.promise(z.record(z.string(), z.any())).optional(),
});

export type PageProps = z.infer<typeof pagePropsSchema>;

/**
 * SHA-2100: slugParamsSchema moved to app.schema.ts (canonical location)
 * Import from @/lib/schemas/app.schema instead
 */

/**
 * Search params schema for list pages
 */
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  sort: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

/**
 * Content detail page props schema
 */
export const contentDetailPagePropsSchema = z.object({
  item: unifiedContentItemSchema,
  relatedItems: z.array(unifiedContentItemSchema).max(10).default([]),
});

export type ContentDetailPageProps = z.infer<typeof contentDetailPagePropsSchema>;

/**
 * Home page props schema
 */
export const homePagePropsSchema = z.object({
  rules: z.array(unifiedContentItemSchema),
  mcp: z.array(unifiedContentItemSchema),
  agents: z.array(unifiedContentItemSchema),
  commands: z.array(unifiedContentItemSchema),
  hooks: z.array(unifiedContentItemSchema),
  allConfigs: z.array(unifiedContentItemSchema),
});

export type HomePageProps = z.infer<typeof homePagePropsSchema>;

/**
 * Client component props for home page
 */
export const homePageClientPropsSchema = z.object({
  initialData: homePagePropsSchema,
});

export type HomePageClientProps = z.infer<typeof homePageClientPropsSchema>;

/**
 * Content list page props schema
 */
export const contentListPagePropsSchema = z.object({
  items: z.array(unifiedContentItemSchema),
  totalCount: nonNegativeInt,
  currentPage: positiveInt.default(1),
  itemsPerPage: positiveInt.default(20),
  category: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides']),
});

export type ContentListPageProps = z.infer<typeof contentListPagePropsSchema>;

/**
 * Agent detail page props schema
 */
export const agentDetailPagePropsSchema = z.object({
  item: unifiedContentItemSchema,
  relatedItems: z.array(unifiedContentItemSchema).optional().default([]),
});

export type AgentDetailPageProps = z.infer<typeof agentDetailPagePropsSchema>;

/**
 * MCP detail page props schema
 */
export const mcpDetailPagePropsSchema = z.object({
  item: unifiedContentItemSchema,
  relatedItems: z.array(unifiedContentItemSchema).optional().default([]),
});

export type McpDetailPageProps = z.infer<typeof mcpDetailPagePropsSchema>;

/**
 * Rule detail page props schema
 */
export const ruleDetailPagePropsSchema = z.object({
  item: unifiedContentItemSchema,
  relatedItems: z.array(unifiedContentItemSchema).optional().default([]),
});

export type RuleDetailPageProps = z.infer<typeof ruleDetailPagePropsSchema>;

/**
 * Command detail page props schema
 */
export const commandDetailPagePropsSchema = z.object({
  item: unifiedContentItemSchema,
  relatedItems: z.array(unifiedContentItemSchema).optional().default([]),
});

export type CommandDetailPageProps = z.infer<typeof commandDetailPagePropsSchema>;

/**
 * Hook detail page props schema
 */
export const hookDetailPagePropsSchema = z.object({
  item: unifiedContentItemSchema,
  relatedItems: z.array(unifiedContentItemSchema).optional().default([]),
});

export type HookDetailPageProps = z.infer<typeof hookDetailPagePropsSchema>;
