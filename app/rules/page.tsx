import type { Metadata } from 'next';
import { ContentListPage } from '@/components/content-list-page';
import { rules } from '@/generated/content';

export const metadata: Metadata = {
  title: 'Claude Rules - Expert System Prompts | Claude Pro Directory',
  description:
    "Expert-crafted system prompts and configurations to enhance Claude's capabilities across different domains and use cases.",
  keywords: 'Claude rules, system prompts, AI configurations, prompt engineering, Claude AI',
};

export default function RulesPage() {
  return (
    <ContentListPage
      title="Claude Rules"
      description="Expert-crafted system prompts and configurations to enhance Claude's capabilities across different domains and use cases."
      icon="book-open"
      items={rules}
      type="rules"
      searchPlaceholder="Search Claude rules..."
      badges={[
        { icon: 'book-open', text: `${rules.length} Rules Available` },
        { text: 'Expert Tested' },
        { text: 'Copy & Paste Ready' },
      ]}
    />
  );
}

// Enable ISR - revalidate every hour
export const revalidate = 3600;
