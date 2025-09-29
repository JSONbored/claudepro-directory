import type { Metadata } from 'next';
import { ContentErrorBoundary } from '@/components/content-error-boundary';
import { ContentListServer } from '@/components/content-list-server';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs
// Use Node.js runtime for GitHub API and Redis compatibility

export const metadata: Metadata = {
  title: `MCP Servers - Model Context Protocol | ${APP_CONFIG.name}`,
  description:
    "Discover powerful MCP servers to extend Claude's capabilities with external tools, data sources, and integrations.",
  keywords: 'MCP servers, Model Context Protocol, Claude integrations, AI tools, Claude extensions',
};

async function getMCPContent() {
  try {
    // Try cache first
    let mcp = await contentCache.getContentByCategory('mcp');

    // Fetch from GitHub API if cache miss
    if (!mcp) {
      mcp = await contentProcessor.getContentByCategory('mcp');

      // Cache the result
      if (mcp) {
        await contentCache.setContentByCategory('mcp', mcp);
      }
    }

    return mcp || [];
  } catch (error) {
    logger.error('Failed to fetch MCP content', error as Error);
    return [];
  }
}

export default async function MCPPage() {
  const mcp = await getMCPContent();

  return (
    <ContentErrorBoundary>
      <ContentListServer
        title="MCP Servers"
        description="Discover powerful MCP servers to extend Claude's capabilities with external tools, data sources, and integrations."
        icon="server"
        items={mcp}
        type="mcp"
        searchPlaceholder="Search MCP servers..."
        badges={[
          { icon: 'server', text: `${mcp.length} Servers Available` },
          { text: 'Production Ready' },
          { text: 'Easy Integration' },
        ]}
      />
    </ContentErrorBoundary>
  );
}
