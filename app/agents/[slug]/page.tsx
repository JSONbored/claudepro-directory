import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentStructuredData } from '@/components/structured-data/agent-schema';
import { UnifiedDetailPage } from '@/components/unified-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { agents, getAgentBySlug, getAgentFullContent } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';
import { sortAgents } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas/app.schema';
import { slugParamsSchema } from '@/lib/schemas/app.schema';
import { agentContentSchema } from '@/lib/schemas/content/agent.schema';
import { transformForDetailPage } from '@/lib/transformers';
import { getDisplayTitle } from '@/lib/utils';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!params) {
    return {
      title: 'Agent Not Found',
      description: 'The requested AI agent could not be found.',
    };
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for agent metadata', {
      slug: String(rawParams.slug),
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'Agent Not Found',
      description: 'The requested AI agent could not be found.',
    };
  }

  const { slug } = validationResult.data;
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    return {
      title: 'Agent Not Found',
      description: 'The requested AI agent could not be found.',
    };
  }

  const displayTitle = getDisplayTitle(agent);

  return {
    title: `${displayTitle} - AI Agent | ${APP_CONFIG.name}`,
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
    const agentsData = await agents;
    const sortedAgents = await sortAgents([...agentsData], 'popularity');

    return sortedAgents
      .map((agent) => {
        // Validate slug using existing schema before static generation
        const validation = slugParamsSchema.safeParse({ slug: agent.slug });

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

    const agentsData = await agents;
    return agentsData.map((agent) => ({
      slug: agent.slug,
    }));
  }
}

// Enable ISR - revalidate every hour
export const revalidate = 14400;

export default async function AgentPage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for agent page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      {
        slug: String(rawParams.slug),
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

  const agentMeta = await getAgentBySlug(slug);

  if (!agentMeta) {
    notFound();
  }

  // Load full content
  const fullAgent = await getAgentFullContent(slug);
  const agentData = fullAgent || agentMeta;

  const agentsData = await agents;
  const relatedAgentsData = agentsData
    .filter((a) => a.slug !== agentMeta.slug && a.category === agentMeta.category)
    .slice(0, 3);

  // Parse through Zod to ensure type safety
  const agent = agentContentSchema.parse(agentData);
  const relatedAgents = relatedAgentsData.map((a) => agentContentSchema.parse(a));

  // Transform for component interface
  const { item, relatedItems } = transformForDetailPage(agent, relatedAgents);

  return (
    <>
      <ViewTracker category="agents" slug={slug} />
      <AgentStructuredData agent={agent} />
      <UnifiedDetailPage item={item} relatedItems={relatedItems} />
    </>
  );
}
