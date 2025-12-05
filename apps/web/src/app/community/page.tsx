import { getContactChannels } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  Github,
  Layers,
  MessageCircle,
  MessageSquare,
  Twitter,
  Users,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getCommunityDirectory,
  getConfigurationCount,
  getHomepageCategoryIds,
  getHomepageData,
} from '@heyclaude/web-runtime/server';
import {
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import Link from 'next/link';

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then(
      (module_) => ({
        default: module_.NewsletterCTAVariant,
      })
    ),
  {
    loading: () => <div className="bg-muted/20 h-32 animate-pulse rounded-lg" />,
  }
);

/**
 * Create the Next.js page metadata for the /community route.
 *
 * Used by Next.js to supply route-specific metadata (title, description, open graph, etc.).
 *
 * @returns The metadata object for the community page.
 * @see {@link generatePageMetadata}
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/community');
}

/**
 * Incremental Static Regeneration (ISR)
 *
 * This page uses ISR with a 24-hour revalidation period for better performance and SEO.
 * Data is fetched at build time and periodically refreshed.
 */
export const revalidate = 86_400;

/**
 * Format a numeric statistic for display using compact English notation.
 *
 * Accepts a number, `null`, or `undefined` and returns a human-readable compact string
 * (e.g., "1.2K"). If the input is `null`, `undefined`, or `NaN`, returns "0".
 *
 * @param value - The numeric value to format; `null`/`undefined`/`NaN` are treated as zero
 * @returns The formatted numeric string in compact `en` notation with up to one decimal place, or `"0"` for missing/invalid values
 */
function formatStatValue(value: null | number | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Render the Community page including hero content, aggregated stats, contribution guidance, and an email CTA.
 *
 * Fetches community directory, configuration count, and homepage metrics and uses safe defaults when those data sources are unavailable.
 *
 * @returns The React element tree for the Community page
 *
 * @see getCommunityDirectory
 * @see getConfigurationCount
 * @see getHomepageData
 * @see NewsletterCTAVariant
 * @see generateRequestId
 */
export default async function CommunityPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'CommunityPage',
    route: '/community',
    module: 'apps/web/src/app/community',
  });

  // Section: Configuration Check
  const channels = getContactChannels();
  if (!channels.discord) {
    reqLogger.warn('CommunityPage: Discord channel is not configured', {
      section: 'configuration-check',
      channel: 'discord',
      configKey: 'DISCORD_INVITE_URL',
    });
  }
  if (!channels.twitter) {
    reqLogger.warn('CommunityPage: Twitter channel is not configured', {
      section: 'configuration-check',
      channel: 'twitter',
      configKey: 'TWITTER_URL',
    });
  }

  // Section: Data Fetch
  const categoryIds = getHomepageCategoryIds;

  const [communityDirectory, configurationCount, homepageData] = await Promise.all([
    getCommunityDirectory({ limit: 500 }).catch((error) => {
      reqLogger.error('CommunityPage: failed to load community directory', normalizeError(error), {
        section: 'data-fetch',
      });
      return null;
    }),
    getConfigurationCount().catch((error) => {
      reqLogger.error('CommunityPage: failed to load configuration count', normalizeError(error), {
        section: 'data-fetch',
      });
      return 0;
    }),
    getHomepageData(categoryIds).catch((error) => {
      reqLogger.error('CommunityPage: failed to load homepage metrics', normalizeError(error), {
        section: 'data-fetch',
      });
      return null;
    }),
  ]);

  const totalConfigurations = configurationCount;
  const totalContributors = communityDirectory?.all_users?.length ?? 0;
  const memberCount = homepageData?.member_count ?? totalContributors;

  const statCards = [
    {
      icon: Layers,
      title: 'Configurations',
      value: formatStatValue(totalConfigurations),
      description: 'Published Claude setups in the directory',
    },
    {
      icon: MessageCircle,
      title: 'Contributors',
      value: formatStatValue(totalContributors),
      description: 'Builders sharing agents, MCP servers, and hooks',
    },
    {
      icon: Users,
      title: 'Community Members',
      value: formatStatValue(memberCount),
      description: 'Discord, newsletter, and directory members',
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-3xl">
            <UnifiedBadge
              variant="base"
              style="outline"
              className="border-accent/20 bg-accent/5 text-accent mb-6"
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
                <Button size="lg" asChild>
                  <a href={channels.github} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-5 w-5" />
                    GitHub
                  </a>
                </Button>
              ) : null}
              {channels.discord ? (
                <Button size="lg" variant="outline" asChild>
                  <a href={channels.discord} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Discord
                  </a>
                </Button>
              ) : null}
              {channels.twitter ? (
                <Button size="lg" variant="outline" asChild>
                  <a href={channels.twitter} target="_blank" rel="noopener noreferrer">
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
            {statCards.map(({ icon: Icon, title, value, description }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                    <Icon className="text-primary h-5 w-5" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{value}</div>
                  <p className="text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
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

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className="container mx-auto px-4 py-12">
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}
