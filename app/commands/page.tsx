import type { Metadata } from 'next';
import { ContentListServer } from '@/components/content-list-server';
import { commands } from '@/generated/content';

export const metadata: Metadata = {
  title: 'Commands - Claude CLI Commands | Claude Pro Directory',
  description:
    'Explore custom commands and shortcuts to enhance your Claude experience with powerful functionality.',
  keywords: 'Claude commands, CLI commands, shortcuts, productivity tools, Claude Pro',
};

export default function CommandsPage() {
  return (
    <ContentListServer
      title="Commands"
      description="Explore custom commands and shortcuts to enhance your Claude experience with powerful functionality."
      icon="terminal"
      items={commands}
      type="commands"
      searchPlaceholder="Search commands..."
      badges={[
        { icon: 'terminal', text: `${commands.length} Commands Available` },
        { text: 'Time Saving' },
        { text: 'Easy to Use' },
      ]}
    />
  );
}

// Enable ISR - revalidate every hour
export const revalidate = 14400;
