import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UnifiedStructuredData } from '@/components/structured-data/unified-structured-data';
import { UnifiedDetailPage } from '@/components/unified-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { commands, getCommandBySlug, getCommandFullContent } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';
import { sortCommands } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas';
import { slugParamsSchema } from '@/lib/schemas';
import { commandContentSchema } from '@/lib/schemas/content';
import { getDisplayTitle } from '@/lib/utils';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!params) {
    return {
      title: 'Command Not Found',
      description: 'The requested command could not be found.',
    };
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for command metadata', {
      slug: String(rawParams.slug),
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'Command Not Found',
      description: 'The requested command could not be found.',
    };
  }

  const { slug } = validationResult.data;
  const command = await getCommandBySlug(slug);

  if (!command) {
    return {
      title: 'Command Not Found',
      description: 'The requested command could not be found.',
    };
  }

  const displayTitle = getDisplayTitle(command);

  return {
    title: `${displayTitle} - Claude Commands | ${APP_CONFIG.name}`,
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
    const commandsData = await commands;
    const sortedCommands = await sortCommands([...commandsData], 'popularity');

    return sortedCommands
      .map((command) => {
        // Validate slug using existing schema before static generation
        const validation = slugParamsSchema.safeParse({ slug: command.slug });

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

    const commandsData = await commands;
    return commandsData.map((command) => ({
      slug: command.slug,
    }));
  }
}

export default async function CommandPage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for command page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      {
        slug: String(rawParams.slug),
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

  const commandMeta = await getCommandBySlug(slug);

  if (!commandMeta) {
    notFound();
  }

  // Load full content
  const fullCommand = await getCommandFullContent(slug);

  const commandsData = await commands;
  const relatedCommandsData = commandsData
    .filter((c) => c.slug !== commandMeta.slug && c.category === commandMeta.category)
    .slice(0, 3);

  const commandData = fullCommand || commandMeta;

  // Parse through Zod to ensure type safety
  const command = commandContentSchema.parse(commandData);
  const relatedCommands = relatedCommandsData.map((c) => commandContentSchema.parse(c));

  return (
    <>
      <ViewTracker category="commands" slug={slug} />
      <UnifiedStructuredData item={{ ...command, category: 'commands' as const }} />
      <UnifiedDetailPage item={command} relatedItems={relatedCommands} />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 14400;
