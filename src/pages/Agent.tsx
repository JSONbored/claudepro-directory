import { useParams } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { ContentDetailPage } from '@/components/ContentDetailPage';
import { getAgentBySlug, agents } from '@/data/agents';

const Agent = () => {
  const { slug } = useParams<{ slug: string }>();
  const agent = slug ? getAgentBySlug(slug) : null;
  
  const relatedAgents = agent ? agents
    .filter(a => a.id !== agent.id && a.category === agent.category)
    .slice(0, 3) : [];

  return (
    <ContentDetailPage
      item={agent}
      type="agent"
      icon={Bot}
      typeName="Agent"
      relatedItems={relatedAgents}
    />
  );
};

export default Agent;