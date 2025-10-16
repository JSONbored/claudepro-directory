/**
 * Page Component Props Schema - Modern 2025 Configuration-Driven
 * Defines props for Next.js page components with proper typing
 *
 * Modern 2025 Architecture:
 * - Dynamic schema generation from UNIFIED_CATEGORY_REGISTRY
 * - Zero hardcoded category lists in type definitions
 * - Auto-updates when new categories added to registry
 */

import { z } from 'zod';
import { unifiedContentItemSchema } from './content-item.schema';

/**
 * SHA-2100: slugParamsSchema moved to app.schema.ts (canonical location)
 * Import from @/lib/schemas/app.schema instead
 */

/**
 * Client component props for home page - Configuration-Driven
 *
 * Modern 2025 Architecture:
 * - Dynamic stats object derived from UNIFIED_CATEGORY_REGISTRY
 * - Zero hardcoded category fields
 * - Auto-includes Skills and future categories
 */
const homePageClientPropsSchema = z
  .object({
    initialData: z
      .record(z.string(), z.array(unifiedContentItemSchema))
      .describe('Initial server-side data for client hydration (dynamic categories)'),
    initialSearchQuery: z
      .string()
      .optional()
      .describe('Initial search query from URL parameter (for SearchAction schema integration)'),
    featuredByCategory: z
      .record(z.string(), z.array(unifiedContentItemSchema))
      .optional()
      .describe(
        'Weekly featured content grouped by category (algorithm-selected, max 6 per category)'
      ),
    stats: z
      .record(z.string(), z.number())
      .optional()
      .describe('Content category statistics (dynamic from registry)'),
  })
  .describe('Props for client-side home page component with SSR hydration data');

export type HomePageClientProps = z.infer<typeof homePageClientPropsSchema>;
