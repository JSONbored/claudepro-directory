import { Terminal } from 'lucide-react';
import { ContentListPage } from '@/components/ContentListPage';
import { commands } from '@/data/commands';

const Commands = () => {
  return (
    <ContentListPage
      title="Claude Commands"
      description="Powerful commands to supercharge your Claude workflow. From code analysis to content generation, discover commands that make complex tasks simple."
      icon={Terminal}
      items={commands}
      type="command"
      searchPlaceholder="Search commands by name, category, or functionality..."
      badges={[
        { icon: Terminal, text: `${commands.length} Commands Available` },
        { text: 'Multiple Platforms' },
        { text: 'Powerful Automation' }
      ]}
    />
  );
};

export default Commands;