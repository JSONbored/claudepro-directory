import { getContactChannels } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Github, MessageSquare, Twitter, Users } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getCommunityDirectory,
  getConfigurationCount,
  getHomepageCategoryIds,
  getHomepageData,
} from '@heyclaude/web-runtime/server';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  UI_CLASSES,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { CommunityStatsCard } from '@/src/components/features/community/community-stats-card';

import Loading from './loading';

/**
 * Dynamic Rendering
 *
 * This page uses connection() to defer non-deterministic operations to request time.
 * Caching is handled by the data layer (getCommunityDirectory, getConfigurationCount, getHomepageData).
 */

/**
 * Generate metadata for the /community route, deferring to request time to allow non-deterministic operations.
 *
 * Awaits connection() so metadata generation may use request-time values (for example Date-based or other non-deterministic data).
 *
 * @returns The metadata object for the community page.
 * @see {@link generatePageMetadata}
 */

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/community');
}

/**
 * Render the Community page with hero content, aggregated stats, contribution guidance, and contact CTAs.
 *
 * This server component awaits `connection()` to allow non-deterministic operations (e.g., Date.now()),
 * creates a request-scoped logger for the request, and renders `CommunityPageContent` inside a `Suspense`
 * boundary with a loading fallback. Data used by the page (community directory, configuration counts,
 * homepage metrics) are fetched by the child component and safe defaults are used when those sources are unavailable.
 *
 * @returns The React element tree for the Community page
 *
 * @see getCommunityDirectory
 * @see getConfigurationCount
 * @see getHomepageData
 * @see CommunityPageContent
 */
export default async function CommunityPage() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'apps/web/src/app/community',
    operation: 'CommunityPage',
    route: '/community',
  });

  return (
    <Suspense fallback={<Loading />}>
      <CommunityPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the community page content: hero, channel links, community stats, and contribution instructions.
 *
 * This server component performs necessary data fetching (community directory, configuration count, and homepage metrics),
 * logs configuration warnings for missing contact channels, and gracefully falls back when fetches fail.
 *
 * @param reqLogger - A request-scoped logger (child logger) used for warnings and error reporting during configuration checks and data fetches.
 * @param reqLogger.reqLogger
 * @returns The JSX element for the community page content.
 *
 * @see generateMetadata
 * @see CommunityPage
 */
async function CommunityPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  // Section: Configuration Check
  const channels = getContactChannels();
  if (!channels.discord) {
    reqLogger.warn(
      {
        channel: 'discord',
        configKey: 'DISCORD_INVITE_URL',
        section: 'data-fetch',
      },
      'CommunityPage: Discord channel is not configured'
    );
  }
  if (!channels.twitter) {
    reqLogger.warn(
      {
        channel: 'twitter',
        configKey: 'TWITTER_URL',
        section: 'data-fetch',
      },
      'CommunityPage: Twitter channel is not configured'
    );
  }

  // Section: Data Fetch
  const categoryIds = getHomepageCategoryIds;

  const [communityDirectory, configurationCount, homepageData] = await Promise.all([
    getCommunityDirectory({ limit: 500 }).catch((error) => {
      reqLogger.error(
        {
          err: normalizeError(error),
          section: 'data-fetch',
        },
        'CommunityPage: failed to load community directory'
      );
      return null;
    }),
    getConfigurationCount().catch((error) => {
      reqLogger.error(
        {
          err: normalizeError(error),
          section: 'data-fetch',
        },
        'CommunityPage: failed to load configuration count'
      );
      return 0;
    }),
    getHomepageData(categoryIds).catch((error) => {
      reqLogger.error(
        {
          err: normalizeError(error),
          section: 'data-fetch',
        },
        'CommunityPage: failed to load homepage metrics'
      );
      return null;
    }),
  ]);

  const totalConfigurations = configurationCount;
  const totalContributors = communityDirectory?.all_users?.length ?? 0;
  const memberCount = homepageData?.member_count ?? totalContributors;

  const statCards = [
    {
      description: 'Published Claude setups in the directory',
      iconId: 'layers' as const,
      title: 'Configurations',
      value: totalConfigurations,
    },
    {
      description: 'Builders sharing agents, MCP servers, and hooks',
      iconId: 'message-circle' as const,
      title: 'Contributors',
      value: totalContributors,
    },
    {
      description: 'Discord, newsletter, and directory members',
      iconId: 'users' as const,
      title: 'Community Members',
      value: memberCount,
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-3xl">
            <UnifiedBadge
              className="border-accent/20 bg-accent/5 text-accent mb-6"
              style="outline"
              variant="base"
            >
              <Users className="text-accent mr-1 h-3 w-3" />
              Community
            </UnifiedBadge>

            <h1 className="mb-6 text-4xl font-bold md:text-6xl">Join the Claude Community</h1>

            <p className={UI_CLASSES.TEXT_HEADING_LARGE}>
              Connect with developers and AI enthusiasts building with Claude. Share your
              configurations, learn from the community, and contribute to our open-source directory.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {channels.github ? (
                <Button asChild size="lg">
                  <a href={channels.github} rel="noopener noreferrer" target="_blank">
                    <Github className="mr-2 h-5 w-5" />
                    GitHub
                  </a>
                </Button>
              ) : null}
              {channels.discord ? (
                <Button asChild size="lg" variant="outline">
                  <a href={channels.discord} rel="noopener noreferrer" target="_blank">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Discord
                  </a>
                </Button>
              ) : null}
              {channels.twitter ? (
                <Button asChild size="lg" variant="outline">
                  <a href={channels.twitter} rel="noopener noreferrer" target="_blank">
                    <Twitter className="mr-2 h-5 w-5" />X (Twitter)
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
            {statCards.map(({ description, iconId, title, value }) => (
              <CommunityStatsCard
                description={description}
                iconId={iconId}
                key={title}
                title={title}
                value={value}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contributing Section */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How to Contribute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">1. Fork the Repository</h3>
                <p className="text-muted-foreground">
                  Start by forking our GitHub repository and cloning it to your local machine.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">2. Add Your Configuration</h3>
                <p className="text-muted-foreground">
                  Create a new JSON file with your Claude configuration in the appropriate content
                  directory.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">3. Submit a Pull Request</h3>
                <p className="text-muted-foreground">
                  Submit a pull request with your contribution. Our team will review it promptly.
                </p>
              </div>
              <div className="pt-4">
                <Button asChild>
                  <Link href={ROUTES.SUBMIT}>Submit Your Configuration</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
