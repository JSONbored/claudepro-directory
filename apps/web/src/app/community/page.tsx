import { getContactChannels } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  bgColor,
  borderColor,
  cluster,
  container,
  display,
  flexWrap,
  gap,
  grid,
  iconSize,
  justify,
  marginBottom,
  marginRight,
  marginX,
  maxWidth,
  minHeight,
  muted,
  overflow,
  padding,
  paddingLeft,
  paddingTop,
  position,
  size,
  spaceY,
  textAlign,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
import {
  Github,
  type IconComponent,
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
import { UnifiedBadge, Button, Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';

import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';


/**
 * Produces the Next.js page metadata for the Community page.
 *
 * @returns The Metadata object for the "/community" route used by Next.js.
 *
 * @see generatePageMetadata
 * @see import('next').Metadata
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
 * @param value - The numeric value to format; `null`, `undefined`, or `NaN` are treated as zero.
 * @returns The value formatted with compact notation and up to one decimal (e.g., `1.2K`), or `'0'` for missing/invalid input.
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
 * Render the Community page with community stats, contribution guidance, and contact CTAs.
 *
 * Fetches community directory entries, configuration counts, and homepage metrics in parallel and uses safe fallbacks if any fetch fails. Creates a request-scoped logger and records warnings when expected contact channels (Discord, X/Twitter) are missing and errors when data fetches fail. Renders hero actions for configured contact channels, three summary stat cards (Configurations, Contributors, Community Members), contribution instructions, and a newsletter CTA.
 *
 * @returns A React element representing the Community page.
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

  const communityDirectoryResult = await getCommunityDirectory({ limit: 500 }).catch((error: unknown) => {
    const normalized = normalizeError(error, 'Failed to load community directory');
    reqLogger.error('CommunityPage: failed to load community directory', normalized, {
      section: 'data-fetch',
    });
    return null;
  });

  const configurationCountResult = await getConfigurationCount().catch((error: unknown) => {
    const normalized = normalizeError(error, 'Failed to load configuration count');
    reqLogger.error('CommunityPage: failed to load configuration count', normalized, {
      section: 'data-fetch',
    });
    return 0;
  });

  const homepageDataResult = await getHomepageData(categoryIds).catch((error: unknown) => {
    const normalized = normalizeError(error, 'Failed to load homepage metrics');
    reqLogger.error('CommunityPage: failed to load homepage metrics', normalized, {
      section: 'data-fetch',
    });
    return null;
  });

  const communityDirectory = communityDirectoryResult;
  const configurationCount = configurationCountResult;
  const homepageData = homepageDataResult;

  const totalConfigurations = configurationCount;
  const totalContributors = communityDirectory?.all_users?.length ?? 0;
  const memberCount = homepageData?.member_count ?? totalContributors;

  const statCards: Array<{
    description: string;
    icon: IconComponent;
    title: string;
    value: string;
  }> = [
    {
      icon: Layers as IconComponent,
      title: 'Configurations',
      value: formatStatValue(totalConfigurations),
      description: 'Published Claude setups in the directory',
    },
    {
      icon: MessageCircle as IconComponent,
      title: 'Contributors',
      value: formatStatValue(totalContributors),
      description: 'Builders sharing agents, MCP servers, and hooks',
    },
    {
      icon: Users as IconComponent,
      title: 'Community Members',
      value: formatStatValue(memberCount),
      description: 'Discord, newsletter, and directory members',
    },
  ];

  return (
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      {/* Hero Section */}
      <section className={`${position.relative} ${overflow.hidden} ${padding.xDefault} ${padding.yXl}`}>
        <div className={`${container.default} ${textAlign.center}`}>
          <div className={`${marginX.auto} ${maxWidth['3xl']}`}>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={`${marginBottom.comfortable} ${borderColor['accent/20']} ${bgColor['accent/5']} ${textColor.accent}`}
            >
              <Users className={`${marginRight.tight} ${iconSize.xs} ${textColor.accent}`} />
              Community
            </UnifiedBadge>

            <h1 className={`${marginBottom.comfortable} ${weight.bold} ${size['4xl']} md:${size['6xl']}`}>Join the Claude Community</h1>

            <p className={`${marginX.auto} ${marginBottom.relaxed} ${maxWidth['2xl']} ${muted.lg}`}>
              Connect with developers and AI enthusiasts building with Claude. Share your
              configurations, learn from the community, and contribute to our open-source directory.
            </p>

            <div className={`${display.flex} ${flexWrap.wrap} ${justify.center} ${gap.comfortable}`}>
              {channels.github ? <Button size="lg" asChild>
                  <a href={channels.github} target="_blank" rel="noopener noreferrer">
                    <Github className={`${marginRight.compact} ${iconSize.md}`} />
                    GitHub
                  </a>
                </Button> : null}
              {channels.discord ? <Button size="lg" variant="outline" asChild>
                  <a href={channels.discord} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className={`${marginRight.compact} ${iconSize.md}`} />
                    Discord
                  </a>
                </Button> : null}
              {channels.twitter ? <Button size="lg" variant="outline" asChild>
                  <a href={channels.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className={`${marginRight.compact} ${iconSize.md}`} />X (Twitter)
                  </a>
                </Button> : null}
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className={`${paddingLeft.comfortable} ${padding.yHero}`}>
        <div className={container.default}>
          <div className={grid.responsive3}>
            {statCards.map(({ icon: Icon, title, value, description }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className={cluster.compact}>
                    <Icon className={`${iconSize.md} ${textColor.primary}`} />
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
      <section className={`${paddingLeft.comfortable} ${padding.yHero}`}>
        <div className={container.default}>
          <Card>
            <CardHeader>
              <CardTitle className={`${size['2xl']}`}>How to Contribute</CardTitle>
            </CardHeader>
            <CardContent className={spaceY.comfortable}>
              <div>
                <h3 className={`${marginBottom.tight} ${weight.semibold}`}>1. Fork the Repository</h3>
                <p className={muted.default}>
                  Start by forking our GitHub repository and cloning it to your local machine.
                </p>
              </div>
              <div>
                <h3 className={`${marginBottom.tight} ${weight.semibold}`}>2. Add Your Configuration</h3>
                <p className={muted.default}>
                  Create a new JSON file with your Claude configuration in the appropriate content
                  directory.
                </p>
              </div>
              <div>
                <h3 className={`${marginBottom.tight} ${weight.semibold}`}>3. Submit a Pull Request</h3>
                <p className={muted.default}>
                  Submit a pull request with your contribution. Our team will review it promptly.
                </p>
              </div>
              <div className={paddingTop.comfortable}>
                <Button asChild>
                  <Link href={ROUTES.SUBMIT}>Submit Your Configuration</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={`${container.default} ${padding.xDefault} ${padding.ySection}`}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}