import { GuidePageFactory, generateGuideMetadata } from '@/lib/components/guide-page-factory';
import { APP_CONFIG, GUIDE_CATEGORIES } from '@/lib/constants';
import { BookOpen } from '@/lib/icons';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs

const config = {
  type: 'tutorials',
  directory: GUIDE_CATEGORIES.tutorials,
  icon: BookOpen as React.ComponentType,
  iconColor: 'text-green-500',
  title: 'Tutorials',
  description: 'Step-by-step tutorials to help you master Claude AI features',
  badgeLabel: 'Tutorial',
  breadcrumbText: 'Tutorials',
  metaTitle: `Claude Tutorials - Step-by-Step Guides | ${APP_CONFIG.name}`,
  metaDescription:
    'Learn Claude AI with our comprehensive step-by-step tutorials. Master MCP servers, agents, rules, and more.',
};

export const metadata = generateGuideMetadata(config);

export default async function TutorialsPage() {
  return <GuidePageFactory config={config} />;
}
