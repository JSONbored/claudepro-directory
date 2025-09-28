import { Users } from 'lucide-react';
import { GuidePageFactory, generateGuideMetadata } from '@/lib/components/guide-page-factory';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs
export const runtime = 'edge';

const config = {
  type: 'collections',
  directory: 'seo/collections',
  icon: Users as React.ComponentType,
  iconColor: 'text-blue-500',
  title: 'Collections',
  description: 'Curated collections of Claude resources, tools, and best practices',
  badgeLabel: 'Collection',
  breadcrumbText: 'Collections',
  metaTitle: `Claude Collections - Curated Resources | ${APP_CONFIG.name}`,
  metaDescription:
    'Explore curated collections of Claude AI resources, tools, and best practices. Find everything you need in organized collections.',
};

export const metadata = generateGuideMetadata(config);

export default async function CollectionsPage() {
  return <GuidePageFactory config={config} />;
}
