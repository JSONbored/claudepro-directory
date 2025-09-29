import type { Metadata } from 'next';
import { ContentListServer } from '@/components/content-list-server';
import { commands } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs

export const metadata: Metadata = {
  title: `Commands - Claude CLI Commands | ${APP_CONFIG.name}`,
  description:
    'Explore custom commands and shortcuts to enhance your Claude experience with powerful functionality.',
  keywords: 'Claude commands, CLI commands, shortcuts, productivity tools, Claude Pro',
};

export default async function CommandsPage() {
  const commandsData = await commands;
  return (
    <ContentListServer
      title="Commands"
      description="Explore custom commands and shortcuts to enhance your Claude experience with powerful functionality."
      icon="terminal"
      items={commandsData}
      type="commands"
      searchPlaceholder="Search commands..."
      badges={[
        { icon: 'terminal', text: `${commandsData.length} Commands Available` },
        { text: 'Time Saving' },
        { text: 'Easy to Use' },
      ]}
    />
  );
}
