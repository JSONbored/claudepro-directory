import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Server } from 'lucide-react';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getMcpBySlug, mcp, getMcpFullContent } from '@/generated/content';

const McpServer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fullServer, setFullServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const serverMeta = slug ? getMcpBySlug(slug) : null;
  
  useEffect(() => {
    if (slug) {
      getMcpFullContent(slug).then(content => {
        setFullServer(content);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [slug]);
  
  const relatedServers = serverMeta ? mcp
    .filter(s => s.id !== serverMeta.id && s.category === serverMeta.category)
    .slice(0, 3) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <ContentDetailPage
      item={fullServer || serverMeta}
      type="mcp"
      icon={Server}
      typeName="MCP Server"
      relatedItems={relatedServers}
    />
  );
};

export default McpServer;