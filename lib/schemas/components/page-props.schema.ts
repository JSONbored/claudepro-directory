/**
 * Page Component Props Schema
 * Defines props for Next.js page components with proper typing
 */

import { z } from 'zod';
import { unifiedContentItemSchema } from './content-item.schema';

/**
 * SHA-2100: slugParamsSchema moved to app.schema.ts (canonical location)
 * Import from @/lib/schemas/app.schema instead
 */

/**
 * Home page props schema
 */
const homePagePropsSchema = z
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

/**
 * Client component props for home page
 */
const homePageClientPropsSchema = z
  .object({
    initialData: homePagePropsSchema.describe('Initial server-side data for client hydration'),
  })
  .describe('Props for client-side home page component with SSR hydration data');

export type HomePageClientProps = z.infer<typeof homePageClientPropsSchema>;
