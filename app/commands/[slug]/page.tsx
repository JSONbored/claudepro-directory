import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CommandDetailPage } from '@/components/command-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { commands, getCommandBySlug, getCommandFullContent } from '@/generated/content';
import { sortCommands } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import { slugParamSchema } from '@/lib/schemas/search.schema';
import { getDisplayTitle } from '@/lib/utils';

interface CommandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CommandPageProps): Promise<Metadata> {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for command metadata', {
      slug: rawParams.slug,
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'Command Not Found',
      description: 'The requested command could not be found.',
    };
  }

  const { slug } = validationResult.data;
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
  try {
    // Sort commands by popularity/trending for optimized static generation
    // Most popular items will be generated first, improving initial page loads
    const sortedCommands = await sortCommands([...commands], 'popularity');

    return sortedCommands
      .map((command) => {
        // Validate slug using existing schema before static generation
        const validation = slugParamSchema.safeParse({ slug: command.slug });

        if (!validation.success) {
          logger.warn('Invalid slug in generateStaticParams for commands', {
            slug: command.slug,
            error: validation.error.issues[0]?.message || 'Unknown validation error',
          });
          return null;
        }

        return {
          slug: command.slug,
        };
      })
      .filter(Boolean);
  } catch (error) {
    // Fallback to unsorted if sorting fails
    logger.error(
      'Failed to sort commands for static generation, using default order',
      error instanceof Error ? error : new Error(String(error))
    );

    return commands.map((command) => ({
      slug: command.slug,
    }));
  }
}

export default async function CommandPage({ params }: CommandPageProps) {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for command page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      {
        slug: rawParams.slug,
        errorCount: validationResult.error.issues.length,
      }
    );
    notFound();
  }

  const { slug } = validationResult.data;

  logger.info('Command page accessed', {
    slug: slug,
    validated: true,
  });

  const commandMeta = getCommandBySlug(slug);

  if (!commandMeta) {
    notFound();
  }

  // Load full content
  const fullCommand = await getCommandFullContent(slug);

  const relatedCommands = commands
    .filter((c) => c.slug !== commandMeta.slug && c.category === commandMeta.category)
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
