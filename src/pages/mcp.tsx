import { Server } from 'lucide-react';
import { ContentListPage } from '@/components/content-list-page';
import { mcp } from '@/generated/content';

const McpServers = () => {
  return (
    <ContentListPage
      title="MCP Servers"
      description="Model Context Protocol servers that extend Claude's capabilities with external integrations, APIs, and specialized tools for enhanced functionality."
      icon={Server}
      items={mcp}
      type="mcp"
      searchPlaceholder="Search MCP servers..."
      badges={[
        { icon: Server, text: `${mcp.length} Servers Available` },
        { text: 'Production Ready' },
        { text: 'Easy Integration' }
      ]}
    />
  );
};

export default McpServers;