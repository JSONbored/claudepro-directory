/**
 * Page Component Props Schema - Database-First Architecture
 * Defines props for Next.js page components with proper typing
 *
 * DATABASE-FIRST 2025 Architecture:
 * - Uses RPC return types from database-overrides.ts
 * - Zero manual schema maintenance
 * - Auto-updates when database schema changes
 */

import type { GetHomepageCompleteReturn } from '@/src/types/database-overrides';

/**
 * SHA-2100: slugParamsSchema moved to app.schema.ts (canonical location)
 * Import from @/lib/schemas/app.schema instead
 */

/**
 * Client component props for home page - Database-First
 * Uses proper RPC return types from get_homepage_complete()
 */
export interface HomePageClientProps {
  /** Initial server-side data for client hydration (from get_homepage_complete RPC) */
  initialData: GetHomepageCompleteReturn['content']['categoryData'];
  /** Weekly featured content grouped by category */
  featuredByCategory?: GetHomepageCompleteReturn['content']['categoryData'];
  /** Content category statistics */
  stats?: GetHomepageCompleteReturn['content']['stats'];
}
