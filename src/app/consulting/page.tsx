/**
 * Consulting Page - Database-First Architecture Specialist
 */

import type { Metadata } from 'next';
import { ErrorBoundary } from '@/src/components/core/infra/error-boundary';
import { ConsultingClient } from '@/src/components/features/consulting/consulting-page-content';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata: Promise<Metadata> = generatePageMetadata('/consulting');

/**
 * Static generation - marketing page that doesn't change
 */
export const revalidate = false;

export default function ConsultingPage() {
  return (
    <ErrorBoundary>
      <ConsultingClient />
    </ErrorBoundary>
  );
}
