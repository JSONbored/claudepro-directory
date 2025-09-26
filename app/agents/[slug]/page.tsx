import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentDetailPage } from '@/components/agent-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { agents, getAgentBySlug, getAgentFullContent } from '@/generated/content';
import { sortAgents } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import { slugParamSchema } from '@/lib/schemas/search.schema';
import { getDisplayTitle } from '@/lib/utils';

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for agent metadata', {
      slug: rawParams.slug,
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'Agent Not Found',
      description: 'The requested AI agent could not be found.',
    };
  }

  const { slug } = validationResult.data;
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
  try {
    // Sort agents by popularity/trending for optimized static generation
    // Most popular items will be generated first, improving initial page loads
    const sortedAgents = await sortAgents([...agents], 'popularity');

    return sortedAgents
      .map((agent) => {
        // Validate slug using existing schema before static generation
        const validation = slugParamSchema.safeParse({ slug: agent.slug });

        if (!validation.success) {
          logger.warn('Invalid slug in generateStaticParams for agents', {
            slug: agent.slug,
            error: validation.error.issues[0]?.message || 'Unknown validation error',
          });
          return null;
        }

        return {
          slug: agent.slug,
        };
      })
      .filter(Boolean);
  } catch (error) {
    // Fallback to unsorted if sorting fails
    logger.error(
      'Failed to sort agents for static generation, using default order',
      error instanceof Error ? error : new Error(String(error))
    );

    return agents.map((agent) => ({
      slug: agent.slug,
    }));
  }
}

// Enable ISR - revalidate every hour
export const revalidate = 14400;

export default async function AgentPage({ params }: AgentPageProps) {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for agent page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      {
        slug: rawParams.slug,
        errorCount: validationResult.error.issues.length,
      }
    );
    notFound();
  }

  const { slug } = validationResult.data;

  logger.info('Agent page accessed', {
    slug: slug,
    validated: true,
  });

  const agentMeta = getAgentBySlug(slug);

  if (!agentMeta) {
    notFound();
  }

  // Load full content
  const fullAgent = await getAgentFullContent(slug);

  const relatedAgents = agents
    .filter((a) => a.slug !== agentMeta.slug && a.category === agentMeta.category)
    .slice(0, 3);

  return (
    <>
      <ViewTracker category="agents" slug={slug} />
      <AgentDetailPage item={fullAgent || agentMeta} relatedItems={relatedAgents} />
    </>
  );
}
