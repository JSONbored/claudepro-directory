import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentDetailPage } from '@/components/content-detail-page';
import { commands, getCommandBySlug, getCommandFullContent } from '@/generated/content';

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

  return {
    title: `${command.title || command.name} - Claude Command | Claude Pro Directory`,
    description: command.description,
    keywords: command.tags?.join(', '),
    openGraph: {
      title: command.title || command.name || 'Claude Command',
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
    <ContentDetailPage
      item={fullCommand || commandMeta}
      type="commands"
      icon="terminal"
      typeName="Command"
      relatedItems={relatedCommands}
    />
  );
}
