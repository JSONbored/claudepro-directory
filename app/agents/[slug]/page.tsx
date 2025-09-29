import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentDetailPage } from '@/components/agent-detail-page';
import { AgentStructuredData } from '@/components/structured-data/agent-schema';
import { ViewTracker } from '@/components/view-tracker';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas/app.schema';
import { slugParamsSchema } from '@/lib/schemas/app.schema';
import { agentContentSchema } from '@/lib/schemas/content/agent.schema';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';
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

  // Get agent metadata from content processor
  const agent = await contentProcessor.getContentItemBySlug('agents', slug);

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

// Note: generateStaticParams removed to enable Edge Runtime
// Pages will be generated on-demand with ISR (4-hour revalidation)

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance
// Use Node.js runtime for GitHub API and Redis compatibility

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

  // Try cache first for metadata
  let agentMeta = await contentCache.getContentItemBySlug('agents', slug);

  if (!agentMeta) {
    // Fetch from GitHub API if not cached
    agentMeta = await contentProcessor.getContentItemBySlug('agents', slug);

    if (!agentMeta) {
      notFound();
    }

    // Cache the metadata
    await contentCache.setContentItemBySlug('agents', slug, agentMeta);
  }

  // Load full content from GitHub
  const fullContent = await contentProcessor.getFullContentBySlug('agents', slug);
  const agentData = fullContent || agentMeta;

  // Get all agents for related items
  let allAgents = await contentCache.getContentByCategory('agents');

  if (!allAgents) {
    allAgents = await contentProcessor.getContentByCategory('agents');
    if (allAgents) {
      await contentCache.setContentByCategory('agents', allAgents);
    }
  }

  const relatedAgentsData = (allAgents || [])
    .filter((a) => a.slug !== slug && a.category === agentMeta.category)
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
      <AgentDetailPage item={item} relatedItems={relatedItems} />
    </>
  );
}
