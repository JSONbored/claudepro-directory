import type { Metadata } from 'next';
import { ContentListPage } from '@/components/content-list-page';
import { mcp } from '@/generated/content';

export const metadata: Metadata = {
  title: 'MCP Servers - Model Context Protocol | Claude Pro Directory',
  description:
    "Discover powerful MCP servers to extend Claude's capabilities with external tools, data sources, and integrations.",
  keywords: 'MCP servers, Model Context Protocol, Claude integrations, AI tools, Claude extensions',
};

export default function MCPPage() {
  return (
    <ContentListPage
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
