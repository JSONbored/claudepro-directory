import { useParams } from 'react-router-dom';
import { Server } from 'lucide-react';
import { ContentDetailPage } from '@/components/ContentDetailPage';
import { getMcpBySlug, mcpServers } from '@/data/mcp';

const McpServer = () => {
  const { slug } = useParams<{ slug: string }>();
  const server = slug ? getMcpBySlug(slug) : null;
  
  const relatedServers = server ? mcpServers
    .filter(s => s.id !== server.id && s.category === server.category)
    .slice(0, 3) : [];

  return (
    <ContentDetailPage
      item={server}
      type="mcp"
      icon={Server}
      typeName="MCP Server"
      relatedItems={relatedServers}
    />
  );
};

export default McpServer;