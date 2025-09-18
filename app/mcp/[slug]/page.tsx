import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentDetailPage } from '@/components/content-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { getMcpBySlug, getMcpFullContent, mcp } from '@/generated/content';

interface MCPPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MCPPageProps): Promise<Metadata> {
  const { slug } = await params;
  const mcpServer = getMcpBySlug(slug);

  if (!mcpServer) {
    return {
      title: 'MCP Server Not Found',
      description: 'The requested MCP server could not be found.',
    };
  }

  return {
    title: `${mcpServer.title || mcpServer.name} - MCP Server | Claude Pro Directory`,
    description: mcpServer.description,
    keywords: mcpServer.tags?.join(', '),
    openGraph: {
      title: mcpServer.title || mcpServer.name || 'MCP Server',
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
  const { slug } = await params;
  const mcpMeta = getMcpBySlug(slug);

  if (!mcpMeta) {
    notFound();
  }

  // Load full content
  const fullMCP = await getMcpFullContent(slug);

  const relatedMCPs = mcp
    .filter((m) => m.id !== mcpMeta.id && m.category === mcpMeta.category)
    .slice(0, 3);

  return (
    <>
      <ViewTracker category="mcp" slug={slug} />
      <ContentDetailPage
        item={fullMCP || mcpMeta}
        type="mcp"
        icon="server"
        typeName="MCP Server"
        relatedItems={relatedMCPs}
      />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 3600;
