/**
 * Page Component Props Schema
 * Defines props for Next.js page components with proper typing
 */

import { z } from 'zod';
import { HOMEPAGE_FEATURED_CATEGORIES } from '@/src/lib/config/category-config';
import { unifiedContentItemSchema } from './content-item.schema';

/**
 * SHA-2100: slugParamsSchema moved to app.schema.ts (canonical location)
 * Import from @/lib/schemas/app.schema instead
 */

/**
 * Home page props schema - dynamically generated from HOMEPAGE_FEATURED_CATEGORIES
 * This ensures adding a new category to the homepage only requires updating category-config.ts
 */
const homePagePropsSchema = z
  .object({
    // Dynamically add each featured category
    ...Object.fromEntries(
      HOMEPAGE_FEATURED_CATEGORIES.map((category) => [
        category,
        z.array(unifiedContentItemSchema).describe(`Collection of ${category} content items`),
      ])
    ),
    allConfigs: z
      .array(unifiedContentItemSchema)
      .describe('Combined collection of all configuration content'),
  })
  .describe('Props for the home page containing categorized content collections');

/**
 * Client component props for home page
 */
const homePageClientPropsSchema = z
  .object({
    initialData: homePagePropsSchema.describe('Initial server-side data for client hydration'),
    initialSearchQuery: z
      .string()
      .optional()
      .describe('Initial search query from URL parameter (for SearchAction schema integration)'),
    stats: z
      .object({
        rules: z.number().describe('Number of rules'),
        mcp: z.number().describe('Number of MCP servers'),
        agents: z.number().describe('Number of AI agents'),
        commands: z.number().describe('Number of commands'),
        hooks: z.number().describe('Number of automation hooks'),
        statuslines: z.number().describe('Number of statuslines'),
        collections: z.number().describe('Number of collections'),
      })
      .optional()
      .describe('Content category statistics'),
  })
  .describe('Props for client-side home page component with SSR hydration data');

export type HomePageClientProps = z.infer<typeof homePageClientPropsSchema>;
