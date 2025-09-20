import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentDetailPage } from '@/components/agent-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { agents, getAgentBySlug, getAgentFullContent } from '@/generated/content';
import { getDisplayTitle } from '@/lib/utils';

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);

  if (!agent) {
    return {
      title: 'Agent Not Found',
      description: 'The requested AI agent could not be found.',
    };
  }

  const displayTitle = getDisplayTitle(agent);

  return {
    title: `${displayTitle} - AI Agent | Claude Pro Directory`,
    description: agent.description,
    keywords: agent.tags?.join(', '),
    openGraph: {
      title: displayTitle,
      description: agent.description,
      type: 'article',
    },
  };
}

export async function generateStaticParams() {
  return agents.map((agent) => ({
    slug: agent.slug,
  }));
}

// Enable ISR - revalidate every hour
export const revalidate = 14400;

export default async function AgentPage({ params }: AgentPageProps) {
  const { slug } = await params;
  const agentMeta = getAgentBySlug(slug);

  if (!agentMeta) {
    notFound();
  }

  // Load full content
  const fullAgent = await getAgentFullContent(slug);

  const relatedAgents = agents
    .filter((a) => a.id !== agentMeta.id && a.category === agentMeta.category)
    .slice(0, 3);

  return (
    <>
      <ViewTracker category="agents" slug={slug} />
      <AgentDetailPage item={fullAgent || agentMeta} relatedItems={relatedAgents} />
    </>
  );
}
