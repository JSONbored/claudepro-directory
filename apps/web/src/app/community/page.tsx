import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { getContactChannels, logger } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  Github,
  Layers,
  MessageCircle,
  MessageSquare,
  Twitter,
  Users,
} from '@heyclaude/web-runtime/icons';
import {
  generatePageMetadata,
  getCommunityDirectory,
  getConfigurationCount,
  getHomepageCategoryIds,
  getHomepageData,
} from '@heyclaude/web-runtime/server';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/community');
}

/**
 * Dynamic Rendering Required
 *
 * This page must use dynamic rendering because it imports from @heyclaude/web-runtime
 * which transitively imports feature-flags/flags.ts. The Vercel Flags SDK's flags/next
 * module contains module-level code that calls server functions, which cannot be
 * executed during static site generation.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

function formatStatValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '0';
  return Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export default async function CommunityPage() {
  const channels = getContactChannels();
  if (!channels.discord) {
    logger.warn('CommunityPage: Discord channel is not configured', undefined, {
      route: '/community',
      channel: 'discord',
      configKey: 'DISCORD_INVITE_URL',
    });
  }
  if (!channels.twitter) {
    logger.warn('CommunityPage: Twitter channel is not configured', undefined, {
      route: '/community',
      channel: 'twitter',
      configKey: 'TWITTER_URL',
    });
  }

  const categoryIds = getHomepageCategoryIds;

  const [communityDirectory, configurationCount, homepageData] = await Promise.all([
    getCommunityDirectory({ limit: 500 }).catch((error) => {
      logger.error('CommunityPage: failed to load community directory', error);
      return null;
    }),
    getConfigurationCount().catch((error) => {
      logger.error('CommunityPage: failed to load configuration count', error);
      return 0;
    }),
    getHomepageData(categoryIds).catch((error) => {
      logger.error('CommunityPage: failed to load homepage metrics', error);
      return null;
    }),
  ]);

  const totalConfigurations = configurationCount ?? 0;
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
    <div className={'min-h-screen bg-background'}>
      {/* Hero Section */}
      <section className={'relative overflow-hidden px-4 py-24'}>
        <div className={'container mx-auto text-center'}>
          <div className={'mx-auto max-w-3xl'}>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={'mb-6 border-accent/20 bg-accent/5 text-accent'}
            >
              <Users className="mr-1 h-3 w-3 text-accent" />
              Community
            </UnifiedBadge>

            <h1 className={'mb-6 font-bold text-4xl md:text-6xl'}>Join the Claude Community</h1>

            <p className={UI_CLASSES.TEXT_HEADING_LARGE}>
              Connect with developers and AI enthusiasts building with Claude. Share your
              configurations, learn from the community, and contribute to our open-source directory.
            </p>

            <div className={'flex flex-wrap justify-center gap-4'}>
              {channels.github && (
                <Button size="lg" asChild={true}>
                  <a href={channels.github} target="_blank" rel="noopener noreferrer">
                    <Github className={'mr-2 h-5 w-5'} />
                    GitHub
                  </a>
                </Button>
              )}
              {channels.discord && (
                <Button size="lg" variant="outline" asChild={true}>
                  <a href={channels.discord} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className={'mr-2 h-5 w-5'} />
                    Discord
                  </a>
                </Button>
              )}
              {channels.twitter && (
                <Button size="lg" variant="outline" asChild={true}>
                  <a href={channels.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className={'mr-2 h-5 w-5'} />X (Twitter)
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className={'px-4 py-16'}>
        <div className={'container mx-auto'}>
          <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
            {statCards.map(({ icon: Icon, title, value, description }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                    <Icon className="h-5 w-5 text-primary" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={'font-bold text-3xl'}>{value}</div>
                  <p className="text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contributing Section */}
      <section className={'px-4 py-16'}>
        <div className={'container mx-auto'}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How to Contribute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className={'mb-2 font-semibold'}>1. Fork the Repository</h3>
                <p className="text-muted-foreground">
                  Start by forking our GitHub repository and cloning it to your local machine.
                </p>
              </div>
              <div>
                <h3 className={'mb-2 font-semibold'}>2. Add Your Configuration</h3>
                <p className="text-muted-foreground">
                  Create a new JSON file with your Claude configuration in the appropriate content
                  directory.
                </p>
              </div>
              <div>
                <h3 className={'mb-2 font-semibold'}>3. Submit a Pull Request</h3>
                <p className="text-muted-foreground">
                  Submit a pull request with your contribution. Our team will review it promptly.
                </p>
              </div>
              <div className="pt-4">
                <Button asChild={true}>
                  <Link href={ROUTES.SUBMIT}>Submit Your Configuration</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}
