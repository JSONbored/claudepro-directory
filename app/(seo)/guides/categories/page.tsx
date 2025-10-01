import { GuidePageFactory, generateGuideMetadata } from '@/lib/components/guide-page-factory';
import { APP_CONFIG, GUIDE_CATEGORIES } from '@/lib/constants';
import { FileText } from '@/lib/icons';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs

const config = {
  type: 'categories',
  directory: GUIDE_CATEGORIES.categories,
  icon: FileText as React.ComponentType,
  iconColor: 'text-orange-500',
  title: 'Category Guides',
  description: 'Comprehensive guides organized by category to help you master Claude AI',
  badgeLabel: 'Category Guide',
  breadcrumbText: 'Categories',
  metaTitle: `Claude Category Guides - Comprehensive Guides | ${APP_CONFIG.name}`,
  metaDescription:
    'Comprehensive guides organized by category for Claude AI. Master different aspects of Claude with detailed category-specific guides.',
};

export const metadata = generateGuideMetadata(config);

export default async function CategoriesPage() {
  return <GuidePageFactory config={config} />;
}
