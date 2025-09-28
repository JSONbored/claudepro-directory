import type { Metadata } from 'next';
import { ContentListServer } from '@/components/content-list-server';
import { hooks } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs
export const runtime = 'edge';

export const metadata: Metadata = {
  title: `Automation Hooks - Claude Event Hooks | ${APP_CONFIG.name}`,
  description: 'Discover automation hooks to trigger actions and workflows based on Claude events.',
  keywords: 'Claude hooks, automation, event triggers, workflow automation, Claude Pro',
};

export default function HooksPage() {
  return (
    <ContentListServer
      title="Automation Hooks"
      description="Discover automation hooks to trigger actions and workflows based on Claude events."
      icon="webhook"
      items={hooks}
      type="hooks"
      searchPlaceholder="Search automation hooks..."
      badges={[
        { icon: 'webhook', text: `${hooks.length} Hooks Available` },
        { text: 'Event Driven' },
        { text: 'Automation Ready' },
      ]}
    />
  );
}
