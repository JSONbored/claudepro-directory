import { Bot } from 'lucide-react';
import { ContentListPage } from '@/components/content-list-page';
import { agents } from '@/generated/content';

const Agents = () => {
  return (
    <ContentListPage
      title="Claude Agents"
      description="Discover specialized AI agents for every task. From code review to content creation, find the perfect agent to enhance your Claude experience."
      icon={Bot}
      items={agents}
      type="agent"
      searchPlaceholder="Search agents by name, category, or capability..."
      badges={[
        { icon: Bot, text: `${agents.length} Agents Available` },
        { text: 'Multiple Categories' },
        { text: 'Ready to Use' },
      ]}
    />
  );
};

export default Agents;
