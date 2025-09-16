import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getAgentBySlug, agents, getAgentFullContent } from '@/generated/content';

const Agent = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fullAgent, setFullAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get metadata immediately for fast initial render
  const agentMeta = slug ? getAgentBySlug(slug) : null;
  
  useEffect(() => {
    if (slug) {
      getAgentFullContent(slug).then(content => {
        setFullAgent(content);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [slug]);
  
  const relatedAgents = agentMeta ? agents
    .filter(a => a.id !== agentMeta.id && a.category === agentMeta.category)
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
      item={fullAgent || agentMeta}
      type="agent"
      icon={Bot}
      typeName="Agent"
      relatedItems={relatedAgents}
    />
  );
};

export default Agent;