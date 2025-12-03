import { getContactChannels } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  cluster,
  grid,
  animate,
  spaceY,
  muted,
  marginBottom,
  weight,
  radius,
  size,
  gap,
  padding,
  minHeight,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
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
    loading: () => <div className={`h-32 ${animate.pulse} ${radius.lg} bg-muted/20`} />,
  }
);

/**
 * Provide the Next.js page metadata for the Community page.
 *
 * @returns The `Metadata` object for the `/community` route.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/community');
}

/**
 * Rendering & Caching
 *
 * ISR: 30 minutes (1800s) - Matches CACHE_TTL.community
 * Community stats (top contributors, member count) need periodic refreshes.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
 */
export const revalidate = 1800;

/**
 * Format a numeric statistic into a compact, human-readable string.
 *
 * @param value - The numeric statistic to format; may be `null` or `undefined`
 * @returns The value formatted in compact notation (for example, `1.2K`). Returns `'0'` for `null`, `undefined`, or `NaN`.
 *
 * @see Intl.NumberFormat
 */
function formatStatValue(value: null | number | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Render the Community page with contact links, community statistics, contribution guidance, and an email CTA.
 *
 * Loads community directory entries, configuration count, and homepage metrics (each with safe fallbacks on failure)
 * and renders hero actions for configured contact channels, three summary stat cards, contribution instructions,
 * and a newsletter signup component.
 *
 * @returns The React element tree for the Community page.
 *
 * @see generateRequestId
 * @see getContactChannels
 * @see getCommunityDirectory
 * @see getConfigurationCount
 * @see getHomepageData
 * @see NewsletterCTAVariant
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
    <div className={`${minHeight.screen} bg-background`}>
      {/* Hero Section */}
      <section className={`relative overflow-hidden ${padding.xDefault} ${padding.yXl}`}>
        <div className="container mx-auto text-center">
          <div className={`mx-auto ${maxWidth['3xl']}`}>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={`${marginBottom.comfortable} border-accent/20 bg-accent/5 text-accent`}
            >
              <Users className="text-accent mr-1 h-3 w-3" />
              Community
            </UnifiedBadge>

            <h1 className={`${marginBottom.comfortable} ${weight.bold} ${size['4xl']} md:text-6xl`}>
              Join the Claude Community
            </h1>

            <p className={`mx-auto mb-8 ${maxWidth['2xl']} ${muted.lg}`}>
              Connect with developers and AI enthusiasts building with Claude. Share your
              configurations, learn from the community, and contribute to our open-source directory.
            </p>

            <div className={`flex flex-wrap justify-center ${gap.comfortable}`}>
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
      <section className={`px-4 ${padding.yHero}`}>
        <div className="container mx-auto">
          <div className={grid.responsive3}>
            {statCards.map(({ icon: Icon, title, value, description }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className={cluster.compact}>
                    <Icon className="text-primary h-5 w-5" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`${weight.bold} ${size['3xl']}`}>{value}</div>
                  <p className={muted.default}>{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contributing Section */}
      <section className={`px-4 ${padding.yHero}`}>
        <div className="container mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className={`${size['2xl']}`}>How to Contribute</CardTitle>
            </CardHeader>
            <CardContent className={spaceY.comfortable}>
              <div>
                <h3 className={`${marginBottom.tight} ${weight.semibold}`}>
                  1. Fork the Repository
                </h3>
                <p className={muted.default}>
                  Start by forking our GitHub repository and cloning it to your local machine.
                </p>
              </div>
              <div>
                <h3 className={`${marginBottom.tight} ${weight.semibold}`}>
                  2. Add Your Configuration
                </h3>
                <p className={muted.default}>
                  Create a new JSON file with your Claude configuration in the appropriate content
                  directory.
                </p>
              </div>
              <div>
                <h3 className={`${marginBottom.tight} ${weight.semibold}`}>
                  3. Submit a Pull Request
                </h3>
                <p className={muted.default}>
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
      <section className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}