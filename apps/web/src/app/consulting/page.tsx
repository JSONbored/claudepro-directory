/**
 * Consulting Page - Database-First Architecture Specialist
 */

import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

import { ConsultingClient } from '@/src/components/features/consulting/consulting-page-content';

export const revalidate = 86_400;

/**
 * Static generation - marketing page that doesn't change
 */

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/consulting');
}

export default function ConsultingPage() {
  return (
    <ErrorBoundary>
      <ConsultingClient />
    </ErrorBoundary>
  );
}
