import type { Metadata } from 'next';
import { ContentListServer } from '@/components/content-list-server';
import { rules } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs
export const runtime = 'edge';

export const metadata: Metadata = {
  title: `Claude Rules - Expert System Prompts | ${APP_CONFIG.name}`,
  description:
    "Expert-crafted system prompts and configurations to enhance Claude's capabilities across different domains and use cases.",
  keywords: 'Claude rules, system prompts, AI configurations, prompt engineering, Claude AI',
};

export default function RulesPage() {
  return (
    <ContentListServer
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
