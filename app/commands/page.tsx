import type { Metadata } from 'next';
import { ContentErrorBoundary } from '@/components/content-error-boundary';
import { ContentListServer } from '@/components/content-list-server';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';

// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance and lower costs
// Use Node.js runtime for GitHub API and Redis compatibility

export const metadata: Metadata = {
  title: `Commands - Claude CLI Commands | ${APP_CONFIG.name}`,
  description:
    'Explore custom commands and shortcuts to enhance your Claude experience with powerful functionality.',
  keywords: 'Claude commands, CLI commands, shortcuts, productivity tools, Claude Pro',
};

async function getCommandsContent() {
  try {
    // Try cache first
    let commands = await contentCache.getContentByCategory('commands');

    // Fetch from GitHub API if cache miss
    if (!commands) {
      commands = await contentProcessor.getContentByCategory('commands');

      // Cache the result
      if (commands) {
        await contentCache.setContentByCategory('commands', commands);
      }
    }

    return commands || [];
  } catch (error) {
    logger.error('Failed to fetch commands content', error as Error);
    return [];
  }
}

export default async function CommandsPage() {
  const commands = await getCommandsContent();

  return (
    <ContentErrorBoundary>
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
    </ContentErrorBoundary>
  );
}
