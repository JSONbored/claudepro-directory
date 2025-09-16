import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getCommandBySlug, commands, getCommandFullContent } from '@/generated/content';

const Command = () => {
  const { slug } = useParams<{ slug: string }>();
  const [fullCommand, setFullCommand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const commandMeta = slug ? getCommandBySlug(slug) : null;
  
  useEffect(() => {
    if (slug) {
      getCommandFullContent(slug).then(content => {
        setFullCommand(content);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [slug]);
  
  const relatedCommands = commandMeta ? commands
    .filter(c => c.id !== commandMeta.id && c.category === commandMeta.category)
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
      item={fullCommand || commandMeta}
      type="command"
      icon={Terminal}
      typeName="Command"
      relatedItems={relatedCommands}
    />
  );
};

export default Command;