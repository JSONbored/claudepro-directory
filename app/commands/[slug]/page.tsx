import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CommandDetailPage } from '@/components/command-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { commands, getCommandBySlug, getCommandFullContent } from '@/generated/content';
import { getDisplayTitle } from '@/lib/utils';

interface CommandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CommandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const command = getCommandBySlug(slug);

  if (!command) {
    return {
      title: 'Command Not Found',
      description: 'The requested command could not be found.',
    };
  }

  const displayTitle = getDisplayTitle(command);

  return {
    title: `${displayTitle} - Claude Commands | Claude Pro Directory`,
    description: command.description,
    keywords: command.tags?.join(', '),
    openGraph: {
      title: displayTitle || 'Claude Commands',
      description: command.description,
      type: 'article',
    },
  };
}

export async function generateStaticParams() {
  return commands.map((command) => ({
    slug: command.slug,
  }));
}

export default async function CommandPage({ params }: CommandPageProps) {
  const { slug } = await params;
  const commandMeta = getCommandBySlug(slug);

  if (!commandMeta) {
    notFound();
  }

  // Load full content
  const fullCommand = await getCommandFullContent(slug);

  const relatedCommands = commands
    .filter((c) => c.id !== commandMeta.id && c.category === commandMeta.category)
    .slice(0, 3);

  return (
    <>
      <ViewTracker category="commands" slug={slug} />
      <CommandDetailPage item={fullCommand || commandMeta} relatedItems={relatedCommands} />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 14400;
