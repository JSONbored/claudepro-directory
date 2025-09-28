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
  title: `Automation Hooks - Claude Event Hooks | ${APP_CONFIG.name}`,
  description: 'Discover automation hooks to trigger actions and workflows based on Claude events.',
  keywords: 'Claude hooks, automation, event triggers, workflow automation, Claude Pro',
};

async function getHooksContent() {
  try {
    // Try cache first
    let hooks = await contentCache.getContentByCategory('hooks');

    // Fetch from GitHub API if cache miss
    if (!hooks) {
      hooks = await contentProcessor.getContentByCategory('hooks');

      // Cache the result
      if (hooks) {
        await contentCache.setContentByCategory('hooks', hooks);
      }
    }

    return hooks || [];
  } catch (error) {
    logger.error('Failed to fetch hooks content', error as Error);
    return [];
  }
}

export default async function HooksPage() {
  const hooks = await getHooksContent();

  return (
    <ContentErrorBoundary>
      <ContentListServer
        title="Automation Hooks"
        description="Discover automation hooks to trigger actions and workflows based on Claude events."
        icon="webhook"
        items={hooks}
        type="hooks"
        searchPlaceholder="Search automation hooks..."
        badges={[
          { icon: 'webhook', text: `${hooks.length} Hooks Available` },
          { text: 'Event Driven' },
          { text: 'Automation Ready' },
        ]}
      />
    </ContentErrorBoundary>
  );
}
