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
// Use Node.js runtime for GitHub API and Redis compatibility

export const metadata: Metadata = {
  title: `AI Agents - Specialized Claude Agents | ${APP_CONFIG.name}`,
  description:
    "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
  keywords: 'Claude agents, AI agents, specialized assistants, workflow automation, Claude AI',
};

async function getAgentsContent() {
  try {
    // Try cache first
    let agents = await contentCache.getContentByCategory('agents');

    // Fetch from GitHub API if cache miss
    if (!agents) {
      agents = await contentProcessor.getContentByCategory('agents');

      // Cache the result
      if (agents) {
        await contentCache.setContentByCategory('agents', agents);
      }
    }

    return agents || [];
  } catch (error) {
    logger.error('Failed to fetch agents content', error as Error);
    return [];
  }
}

export default async function AgentsPage() {
  const agents = await getAgentsContent();

  return (
    <ContentErrorBoundary>
      <ContentListServer
        title="AI Agents"
        description="Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities."
        icon="sparkles"
        items={agents}
        type="agents"
        searchPlaceholder="Search AI agents..."
        badges={[
          { icon: 'sparkles', text: `${agents.length} Agents Available` },
          { text: 'Task Optimized' },
          { text: 'Ready to Deploy' },
        ]}
      />
    </ContentErrorBoundary>
  );
}
