import type { Metadata } from 'next';
import { ContentErrorBoundary } from '@/components/content-error-boundary';
import { ContentListServer } from '@/components/content-list-server';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs
export const runtime = 'edge';

export const metadata: Metadata = {
  title: `Claude Rules - Expert System Prompts | ${APP_CONFIG.name}`,
  description:
    "Expert-crafted system prompts and configurations to enhance Claude's capabilities across different domains and use cases.",
  keywords: 'Claude rules, system prompts, AI configurations, prompt engineering, Claude AI',
};

async function getRulesContent() {
  try {
    // Try cache first
    let rules = await contentCache.getContentByCategory('rules');

    // Fetch from GitHub API if cache miss
    if (!rules) {
      rules = await contentProcessor.getContentByCategory('rules');

      // Cache the result
      if (rules) {
        await contentCache.setContentByCategory('rules', rules);
      }
    }

    return rules || [];
  } catch (error) {
    logger.error('Failed to fetch rules content', error as Error);
    return [];
  }
}

export default async function RulesPage() {
  const rules = await getRulesContent();

  return (
    <ContentErrorBoundary>
      <ContentListServer
        title="Claude Rules"
        description="Expert-crafted system prompts and configurations to enhance Claude's capabilities across different domains and use cases."
        icon="book-open"
        items={rules}
        type="rules"
        searchPlaceholder="Search Claude rules..."
        badges={[
          { icon: 'book-open', text: `${rules.length} Rules Available` },
          { text: 'Expert Tested' },
          { text: 'Copy & Paste Ready' },
        ]}
      />
    </ContentErrorBoundary>
  );
}
