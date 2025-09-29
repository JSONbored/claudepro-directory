import type { Metadata } from 'next';
import { ContentListServer } from '@/components/content-list-server';
import { mcp } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs

export const metadata: Metadata = {
  title: `MCP Servers - Model Context Protocol | ${APP_CONFIG.name}`,
  description:
    "Discover powerful MCP servers to extend Claude's capabilities with external tools, data sources, and integrations.",
  keywords: 'MCP servers, Model Context Protocol, Claude integrations, AI tools, Claude extensions',
};

export default function MCPPage() {
  return (
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
  );
}
