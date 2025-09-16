import { Webhook } from 'lucide-react';
import { ContentListPage } from '@/components/ContentListPage';
import { hooks } from '@/data/hooks';

const Hooks = () => {
  return (
    <ContentListPage
      title="Claude Hooks"
      description="Automate your workflows with powerful hooks. Connect Claude to your tools and systems for seamless integration and automated responses."
      icon={Webhook}
      items={hooks}
      type="hook"
      searchPlaceholder="Search hooks by name, category, or trigger event..."
      badges={[
        { icon: Webhook, text: `${hooks.length} Hooks Available` },
        { text: 'Event-Driven' },
        { text: 'Multi-Platform' }
      ]}
    />
  );
};

export default Hooks;