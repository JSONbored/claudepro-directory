import { useParams } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { ContentDetailPage } from '@/components/content-detail-page';
import { getCommandBySlug, commands } from '@/generated/content';

const Command = () => {
  const { slug } = useParams<{ slug: string }>();
  const command = slug ? getCommandBySlug(slug) : null;
  
  const relatedCommands = command ? commands
    .filter(c => c.id !== command.id && c.category === command.category)
    .slice(0, 3) : [];

  return (
    <ContentDetailPage
      item={command}
      type="command"
      icon={Terminal}
      typeName="Command"
      relatedItems={relatedCommands}
    />
  );
};

export default Command;