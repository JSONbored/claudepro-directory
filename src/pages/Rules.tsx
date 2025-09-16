import { BookOpen } from 'lucide-react';
import { ContentListPage } from '@/components/content-list-page';
import { rules } from '@/generated/content';

const Rules = () => {
  return (
    <ContentListPage
      title="Claude Rules"
      description="Expert-crafted system prompts and configurations to enhance Claude's capabilities across different domains and use cases."
      icon={BookOpen}
      items={rules}
      type="rule"
      searchPlaceholder="Search Claude rules..."
      badges={[
        { icon: BookOpen, text: `${rules.length} Rules Available` },
        { text: 'Expert Tested' },
        { text: 'Copy & Paste Ready' }
      ]}
    />
  );
};

export default Rules;