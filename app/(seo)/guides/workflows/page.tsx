import { Workflow } from 'lucide-react';
import { GuidePageFactory, generateGuideMetadata } from '@/lib/components/guide-page-factory';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs
export const runtime = 'edge';

const config = {
  type: 'workflows',
  directory: 'seo/workflows',
  icon: Workflow as React.ComponentType,
  iconColor: 'text-pink-500',
  title: 'Workflows',
  description: 'Automated workflows and integrations with Claude AI',
  badgeLabel: 'Workflow',
  breadcrumbText: 'Workflows',
  metaTitle: `Claude Workflows - Automation & Integration | ${APP_CONFIG.name}`,
  metaDescription:
    'Build automated workflows and integrations with Claude AI. Streamline your AI-powered processes.',
};

export const metadata = generateGuideMetadata(config);

export default async function WorkflowsPage() {
  return <GuidePageFactory config={config} />;
}
