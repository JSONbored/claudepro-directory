/**
 * Consulting Page - Database-First Architecture Specialist
 */

import { ConsultingClient } from '@/src/components/features/consulting/consulting-page-content';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { normalizeError } from '@/src/lib/utils/error.utils';

export const metadata = generatePageMetadata('/consulting');

/**
 * Static generation - marketing page that doesn't change
 */
export const revalidate = false;

export default function ConsultingPage() {
  try {
    return <ConsultingClient />;
  } catch (error) {
    const normalized = normalizeError(error, 'Consulting page render failed');
    logger.error('ConsultingPage: ConsultingClient render failed', normalized);
    throw normalized;
  }
}
