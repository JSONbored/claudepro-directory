import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CommandDetailPage } from '@/components/command-detail-page';
import { CommandStructuredData } from '@/components/structured-data/command-schema';
import { ViewTracker } from '@/components/view-tracker';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas/app.schema';
import { slugParamsSchema } from '@/lib/schemas/app.schema';
import { commandContentSchema } from '@/lib/schemas/content.schema';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';
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

  // Get command metadata from content processor
  const command = await contentProcessor.getContentItemBySlug('commands', slug);

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

// Note: generateStaticParams removed to enable Edge Runtime
// Pages will be generated on-demand with ISR (4-hour revalidation)

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

  // Try cache first for metadata
  let commandMeta = await contentCache.getContentItemBySlug('commands', slug);

  if (!commandMeta) {
    // Fetch from GitHub API if not cached
    commandMeta = await contentProcessor.getContentItemBySlug('commands', slug);

    if (!commandMeta) {
      notFound();
    }

    // Cache the metadata
    await contentCache.setContentItemBySlug('commands', slug, commandMeta);
  }

  // Load full content from GitHub
  const fullContent = await contentProcessor.getFullContentBySlug('commands', slug);
  const commandData = fullContent || commandMeta;

  // Get all commands for related items
  let allCommands = await contentCache.getContentByCategory('commands');

  if (!allCommands) {
    allCommands = await contentProcessor.getContentByCategory('commands');
    if (allCommands) {
      await contentCache.setContentByCategory('commands', allCommands);
    }
  }

  const relatedCommandsData = (allCommands || [])
    .filter((c) => c.slug !== slug && c.category === commandMeta.category)
    .slice(0, 3);

  // Parse through Zod to ensure type safety
  const command = commandContentSchema.parse(commandData);
  const relatedCommands = relatedCommandsData.map((c) => commandContentSchema.parse(c));

  return (
    <>
      <ViewTracker category="commands" slug={slug} />
      <CommandStructuredData item={command} />
      <CommandDetailPage item={command} relatedItems={relatedCommands} />
    </>
  );
}
// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Node.js runtime for GitHub API and Redis compatibility
