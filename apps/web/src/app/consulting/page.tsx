/**
 * Consulting Page - Database-First Architecture Specialist
 *
 * This is a hybrid page combining "about me" (the creator of the website/project) with consulting services solicitation.
 * Comprehensive research and analysis has been conducted for modern consulting/about-me page patterns, motion.dev
 * animations, shadcn components, and Dec 2025 UX/UI standards. See .cursor/consulting-page-research.md for detailed
 * findings and implementation recommendations.
 */

import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import { lazy, Suspense } from 'react';

import Loading from './loading';

// OPTIMIZATION: Dynamic import for large component (789 lines) - only loads when needed
const ConsultingClient = lazy(() =>
  import('@/src/components/features/consulting/consulting-page-content').then((mod) => ({
    default: mod.ConsultingClient,
  }))
);

/**
 * Produce page metadata for the /consulting marketing page used by Next.js during static generation.
 *
 * The metadata is generated once at build time and is intended for a marketing page that does not use incremental
 * revalidation in this module.
 *
 * @returns Metadata for the consulting page
 *
 * @see generatePageMetadata - helper that constructs the Metadata object
 * @see ConsultingClient - component that renders the consulting page content
 */

export async function generateMetadata(): Promise<Metadata> {
  'use cache';
  // Static route - metadata never changes, use very long cache (30 days)
  // Generated once at build time, cached forever (or until manual invalidation)
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire
  cacheTag('seo-metadata-static');
  cacheTag('seo-metadata-consulting');

  return generatePageMetadata('/consulting');
}

/**
 * Render the Consulting page content wrapped in an error boundary.
 *
 * Renders the ConsultingClient component inside an ErrorBoundary so rendering errors
 * from the client component are contained and handled by the boundary.
 *
 * @returns The React element tree for the consulting page.
 *
 * @see ErrorBoundary - UI component used to catch and handle runtime render errors.
 * @see ConsultingClient - Main consulting page content component.
 * @see generatePageMetadata - Metadata generator used for the '/consulting' page.
 */
export default function ConsultingPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <ConsultingClient />
      </Suspense>
    </ErrorBoundary>
  );
}
