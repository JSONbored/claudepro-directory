/**
 * Consulting Page - Database-First Architecture Specialist
 */

import type { Metadata } from 'next';
import { ConsultingClient } from '@/src/components/features/consulting/consulting-client';

export const metadata: Metadata = {
  title: 'Work With Me | Database-First Architecture Consultant',
  description:
    'I help companies ship production-ready AI systems and database-first architectures. Creator of ClaudePro Directory. Available for consulting engagements.',
  openGraph: {
    title: 'Work With Me | Database-First Architecture Consultant',
    description:
      'I help companies ship production-ready AI systems and database-first architectures.',
  },
};

/**
 * Static generation - marketing page that doesn't change
 */
export const revalidate = false;

export default function ConsultingPage() {
  return <ConsultingClient />;
}
