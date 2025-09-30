import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UnifiedStructuredData } from '@/components/structured-data/unified-structured-data';
import { UnifiedDetailPage } from '@/components/unified-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { getMcpBySlug, getMcpFullContent, mcp } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';
import { sortMcp } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas';
import { slugParamsSchema } from '@/lib/schemas';
import { mcpContentSchema as mcpServerContentSchema } from '@/lib/schemas/content';
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
  const mcpServer = await getMcpBySlug(slug);

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

export async function generateStaticParams() {
  try {
    // Sort MCP servers by popularity/trending for optimized static generation
    // Most popular items will be generated first, improving initial page loads
    const mcpData = await mcp;
    const sortedMcp = await sortMcp([...mcpData], 'popularity');

    return sortedMcp
      .map((mcpItem) => {
        // Validate slug using existing schema before static generation
        const validation = slugParamsSchema.safeParse({ slug: mcpItem.slug });

        if (!validation.success) {
          logger.warn('Invalid slug in generateStaticParams for MCP', {
            slug: mcpItem.slug,
            error: validation.error.issues[0]?.message || 'Unknown validation error',
          });
          return null;
        }

        return {
          slug: mcpItem.slug,
        };
      })
      .filter(Boolean);
  } catch (error) {
    // Fallback to unsorted if sorting fails
    logger.error(
      'Failed to sort MCP servers for static generation, using default order',
      error instanceof Error ? error : new Error(String(error))
    );

    const mcpData = await mcp;
    return mcpData.map((mcpItem) => ({
      slug: mcpItem.slug,
    }));
  }
}

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

  const mcpMeta = await getMcpBySlug(slug);

  if (!mcpMeta) {
    notFound();
  }

  // Load full content
  const fullMCP = await getMcpFullContent(slug);

  const mcpData = await mcp;
  const relatedMCPs = mcpData
    .filter((m) => m.slug !== mcpMeta.slug && m.category === mcpMeta.category)
    .slice(0, 3);

  const mcpServer = mcpServerContentSchema.parse(fullMCP || mcpMeta);
  const relatedMCPsParsed = relatedMCPs.map((m) => mcpServerContentSchema.parse(m));

  // Transform for component interface
  const { item: transformedMCP, relatedItems: transformedRelatedMCPs } = transformForDetailPage(
    mcpServer,
    relatedMCPsParsed
  );

  return (
    <>
      <ViewTracker category="mcp" slug={slug} />
      <UnifiedStructuredData item={{ ...mcpServer, category: 'mcp' as const }} />
      <UnifiedDetailPage item={transformedMCP} relatedItems={transformedRelatedMCPs} />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 14400;
