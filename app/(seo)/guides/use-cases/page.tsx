import { Zap } from 'lucide-react';
import { GuidePageFactory, generateGuideMetadata } from '@/lib/components/guide-page-factory';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

const config = {
  type: 'use-cases',
  directory: 'seo/use-cases',
  icon: Zap as React.ComponentType,
  iconColor: 'text-blue-500',
  title: 'Use Cases',
  description: 'Real-world applications and use cases for Claude AI',
  badgeLabel: 'Use Case',
  breadcrumbText: 'Use Cases',
  metaTitle: `Claude Use Cases - Real-World Applications | ${APP_CONFIG.name}`,
  metaDescription:
    'Discover real-world applications and use cases for Claude AI. Learn how others are leveraging Claude in production.',
};

export const metadata = generateGuideMetadata(config);

export default async function UseCasesPage() {
  return <GuidePageFactory config={config} />;
}
