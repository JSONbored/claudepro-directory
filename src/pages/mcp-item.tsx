import { useParams } from 'react-router-dom';
import { Server } from 'lucide-react';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getMcpBySlug, mcp } from '@/generated/content';

const McpServer = () => {
  const { slug } = useParams<{ slug: string }>();
  const server = slug ? getMcpBySlug(slug) : null;
  
  const relatedServers = server ? mcp
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