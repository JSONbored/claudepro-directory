import type { Metadata } from 'next';
import { ContentListServer } from '@/components/content-list-server';
import { agents } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs

export const metadata: Metadata = {
  title: `AI Agents - Specialized Claude Agents | ${APP_CONFIG.name}`,
  description:
    "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
  keywords: 'Claude agents, AI agents, specialized assistants, workflow automation, Claude AI',
};

export default function AgentsPage() {
  return (
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
  );
}
