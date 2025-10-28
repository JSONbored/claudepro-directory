/**
 * Page Component Props Schema - Database-First Architecture
 * Defines props for Next.js page components with proper typing
 *
 * DATABASE-FIRST 2025 Architecture:
 * - Uses ContentItem from database views (content_unified)
 * - Zero manual schema maintenance
 * - Auto-updates when database schema changes
 */

import { z } from 'zod';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';

/**
 * SHA-2100: slugParamsSchema moved to app.schema.ts (canonical location)
 * Import from @/lib/schemas/app.schema instead
 */

/**
 * Client component props for home page - Database-First
 *
 * DATABASE-FIRST 2025 Architecture:
 * - Uses ContentItem from content_unified view
 * - Dynamic stats object derived from UNIFIED_CATEGORY_REGISTRY
 * - Zero hardcoded category fields
 */
export interface HomePageClientProps {
  /** Initial server-side data for client hydration (from content_unified view) */
  initialData: Record<string, ContentItem[]>;
  /** Initial search query from URL parameter */
  initialSearchQuery?: string;
  /** Weekly featured content grouped by category */
  featuredByCategory?: Record<string, ContentItem[]>;
  /** Content category statistics */
  stats?: Record<string, number>;
}
