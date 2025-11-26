/**
 * Consulting Page - Database-First Architecture Specialist
 */

import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';

import { ErrorBoundary } from '@/src/components/core/infra/error-boundary';
import { ConsultingClient } from '@/src/components/features/consulting/consulting-page-content';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/consulting');
}

/**
 * Static generation - marketing page that doesn't change
 */
export const revalidate = 86_400;

export default function ConsultingPage() {
  return (
    <ErrorBoundary>
      <ConsultingClient />
    </ErrorBoundary>
  );
}
