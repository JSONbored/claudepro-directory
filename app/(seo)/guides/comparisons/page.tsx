import { GitCompare } from 'lucide-react';
import { GuidePageFactory, generateGuideMetadata } from '@/lib/components/guide-page-factory';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs

const config = {
  type: 'comparisons',
  directory: 'seo/comparisons',
  icon: GitCompare as React.ComponentType,
  iconColor: 'text-red-500',
  title: 'Comparisons',
  description: 'Compare Claude AI with other AI tools and platforms',
  badgeLabel: 'Comparison',
  breadcrumbText: 'Comparisons',
  metaTitle: `Claude Comparisons - AI Tools Comparison | ${APP_CONFIG.name}`,
  metaDescription:
    'Compare Claude AI with other AI platforms and tools. Make informed decisions with detailed comparisons.',
};

export const metadata = generateGuideMetadata(config);

export default async function ComparisonsPage() {
  return <GuidePageFactory config={config} />;
}
