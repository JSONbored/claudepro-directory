import type { Metadata } from 'next';
import { ContentListPage } from '@/components/content-list-page';
import { commands } from '@/generated/content';

export const metadata: Metadata = {
  title: 'Commands - Claude CLI Commands | Claude Pro Directory',
  description:
    'Explore custom commands and shortcuts to enhance your Claude experience with powerful functionality.',
  keywords: 'Claude commands, CLI commands, shortcuts, productivity tools, Claude Pro',
};

export default function CommandsPage() {
  return (
    <ContentListPage
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
