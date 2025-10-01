import { GuidePageFactory, generateGuideMetadata } from '@/lib/components/guide-page-factory';
import { APP_CONFIG } from '@/lib/constants';
import { AlertTriangle } from '@/lib/icons';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs

const config = {
  type: 'troubleshooting',
  directory: 'seo/troubleshooting',
  icon: AlertTriangle as React.ComponentType,
  iconColor: 'text-yellow-500',
  title: 'Troubleshooting',
  description: 'Solutions to common Claude AI issues and problems',
  badgeLabel: 'Troubleshooting',
  breadcrumbText: 'Troubleshooting',
  metaTitle: `Claude Troubleshooting - Solutions & Fixes | ${APP_CONFIG.name}`,
  metaDescription:
    'Find solutions to common Claude AI issues. Troubleshooting guides, error fixes, and problem-solving tips.',
};

export const metadata = generateGuideMetadata(config);

export default async function TroubleshootingPage() {
  return <GuidePageFactory config={config} />;
}
