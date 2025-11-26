/**
 * Consulting Page - Database-First Architecture Specialist
 */

import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';

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
