import type { Metadata } from 'next';
import { ContentListPage } from '@/components/content-list-page';
import { agents } from '@/generated/content';

export const metadata: Metadata = {
  title: 'AI Agents - Specialized Claude Agents | Claude Pro Directory',
  description:
    "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
  keywords: 'Claude agents, AI agents, specialized assistants, workflow automation, Claude AI',
};

export default function AgentsPage() {
  return (
    <ContentListPage
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

// Enable ISR - revalidate every hour
export const revalidate = 3600;
