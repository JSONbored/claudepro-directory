/**
 * Consulting Page - Database-First Architecture Specialist
 */

import { ConsultingClient } from '@/src/components/features/consulting/consulting-client';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/consulting');

/**
 * Static generation - marketing page that doesn't change
 */
export const revalidate = false;

export default function ConsultingPage() {
  return <ConsultingClient />;
}
