import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MCPDetailPage } from '@/components/mcp-detail-page';
import { MCPStructuredData } from '@/components/structured-data/mcp-schema';
import { ViewTracker } from '@/components/view-tracker';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas/app.schema';
import { slugParamsSchema } from '@/lib/schemas/app.schema';
import { mcpServerContentSchema } from '@/lib/schemas/content.schema';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';
import { transformForDetailPage } from '@/lib/transformers';
import { getDisplayTitle } from '@/lib/utils';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!params) {
    return {
      title: 'MCP Server Not Found',
      description: 'The requested MCP server could not be found.',
    };
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for MCP metadata', {
      slug: String(rawParams.slug),
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'MCP Server Not Found',
      description: 'The requested MCP server could not be found.',
    };
  }

  const { slug } = validationResult.data;

  // Get MCP metadata from content processor
  const mcpServer = await contentProcessor.getContentItemBySlug('mcp', slug);

  if (!mcpServer) {
    return {
      title: 'MCP Server Not Found',
      description: 'The requested MCP server could not be found.',
    };
  }

  return {
    title: `${getDisplayTitle(mcpServer)} - MCP Server | ${APP_CONFIG.name}`,
    description: mcpServer.description,
    keywords: mcpServer.tags?.join(', '),
    openGraph: {
      title: getDisplayTitle(mcpServer),
      description: mcpServer.description,
      type: 'article',
    },
  };
}

// Note: generateStaticParams removed to enable Edge Runtime
// Pages will be generated on-demand with ISR (4-hour revalidation)

export default async function MCPPage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for MCP page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid MCP slug'),
      {
        slug: String(rawParams.slug),
        errorCount: validationResult.error.issues.length,
      }
    );
    notFound();
  }

  const { slug } = validationResult.data;

  logger.info('MCP page accessed', {
    slug: slug,
    validated: true,
  });

  // Try cache first for metadata
  let mcpMeta = await contentCache.getContentItemBySlug('mcp', slug);

  if (!mcpMeta) {
    // Fetch from GitHub API if not cached
    mcpMeta = await contentProcessor.getContentItemBySlug('mcp', slug);

    if (!mcpMeta) {
      notFound();
    }

    // Cache the metadata
    await contentCache.setContentItemBySlug('mcp', slug, mcpMeta);
  }

  // Load full content from GitHub
  const fullContent = await contentProcessor.getFullContentBySlug('mcp', slug);
  const mcpData = fullContent || mcpMeta;

  // Get all MCP servers for related items
  let allMcp = await contentCache.getContentByCategory('mcp');

  if (!allMcp) {
    allMcp = await contentProcessor.getContentByCategory('mcp');
    if (allMcp) {
      await contentCache.setContentByCategory('mcp', allMcp);
    }
  }

  const relatedMCPs = (allMcp || [])
    .filter((m) => m.slug !== slug && m.category === mcpMeta.category)
    .slice(0, 3);

  const mcpServer = mcpServerContentSchema.parse(mcpData);
  const relatedMCPsParsed = relatedMCPs.map((m) => mcpServerContentSchema.parse(m));

  // Transform for component interface
  const { item: transformedMCP, relatedItems: transformedRelatedMCPs } = transformForDetailPage(
    mcpServer,
    relatedMCPsParsed
  );

  return (
    <>
      <ViewTracker category="mcp" slug={slug} />
      <MCPStructuredData item={mcpServer} />
      <MCPDetailPage item={transformedMCP} relatedItems={transformedRelatedMCPs} />
    </>
  );
}
// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance
// Use Node.js runtime for GitHub API and Redis compatibility
