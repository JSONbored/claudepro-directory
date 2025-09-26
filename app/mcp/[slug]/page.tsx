import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MCPDetailPage } from '@/components/mcp-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { getMcpBySlug, getMcpFullContent, mcp } from '@/generated/content';
import { logger } from '@/lib/logger';
import { slugParamSchema } from '@/lib/schemas/search.schema';
import { getDisplayTitle } from '@/lib/utils';

interface MCPPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MCPPageProps): Promise<Metadata> {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for MCP metadata', {
      slug: rawParams.slug,
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'MCP Server Not Found',
      description: 'The requested MCP server could not be found.',
    };
  }

  const { slug } = validationResult.data;
  const mcpServer = getMcpBySlug(slug);

  if (!mcpServer) {
    return {
      title: 'MCP Server Not Found',
      description: 'The requested MCP server could not be found.',
    };
  }

  return {
    title: `${getDisplayTitle(mcpServer)} - MCP Server | Claude Pro Directory`,
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
  return mcp.map((mcpItem) => ({
    slug: mcpItem.slug,
  }));
}

export default async function MCPPage({ params }: MCPPageProps) {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for MCP page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid MCP slug'),
      {
        slug: rawParams.slug,
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

  const mcpMeta = getMcpBySlug(slug);

  if (!mcpMeta) {
    notFound();
  }

  // Load full content
  const fullMCP = await getMcpFullContent(slug);

  const relatedMCPs = mcp
    .filter((m) => m.slug !== mcpMeta.slug && m.category === mcpMeta.category)
    .slice(0, 3);

  return (
    <>
      <ViewTracker category="mcp" slug={slug} />
      <MCPDetailPage item={fullMCP || mcpMeta} relatedItems={relatedMCPs} />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 14400;
