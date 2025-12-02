/**
 * Tags Index Page - Browse All Tags
 *
 * @description
 * A visually stunning tag browsing experience with animated tag clouds,
 * floating effects, and interactive hover states.
 *
 * @features
 * - Animated tag cloud with floating effects
 * - Featured tags with 3D tilt effect
 * - Staggered entrance animations
 * - Category-based coloring
 * - SEO optimized with structured data
 */

import { APP_CONFIG } from '@heyclaude/shared-runtime';
import {
  getAllTagsWithCounts,
  type TagSummary,
} from '@heyclaude/web-runtime/data';
import {
  emptyCard,
  marginBottom,
  spaceY,
  marginTop,
  muted,
  weight,
  size,
  gap,
  cluster,
  padding,
  radius,
  maxWidth,
  iconSize,
  minHeight,
  zLayer,
  backdrop,
  bgColor,
  bgGradient,
  gradientFrom,
  gradientTo,
  gradientVia,
  textColor,
  justify,
  borderColor,
  flexWrap,
  overflow,
  tracking,
  squareSize,
} from '@heyclaude/web-runtime/design-system';
import { Tag, Sparkles, TrendingUp, Layers } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import { UnifiedBadge, Card  } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';

import {
  AnimatedTagCloud,
  FeaturedTagsGrid,
} from '@/src/components/features/tags/animated-tag-cloud';

// Dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

// Metadata
export const metadata: Metadata = {
  title: `Browse Tags - ${APP_CONFIG.name}`,
  description:
    'Explore all tags and discover Claude AI tools, MCP servers, agents, rules, and more organized by topic. Find exactly what you need with our tag-based navigation.',
  keywords: [
    'claude tags',
    'ai tools tags',
    'mcp server categories',
    'claude agent topics',
    'ai development tags',
  ],
  openGraph: {
    title: `Browse Tags - ${APP_CONFIG.name}`,
    description:
      'Explore all tags and discover Claude AI tools organized by topic.',
    type: 'website',
  },
};

export default async function TagsIndexPage() {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'TagsIndexPage',
    route: '/tags',
    module: 'apps/web/src/app/tags/page',
  });

  let tags: TagSummary[] = [];

  try {
    tags = await getAllTagsWithCounts({ minCount: 1, limit: 500 });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load tags');
    reqLogger.error('TagsIndexPage: getAllTagsWithCounts failed', normalized);
    // Continue with empty tags - show empty state
  }

  const totalItems = tags.reduce((sum, tag) => sum + tag.count, 0);

  // Transform TagSummary to TagCloudItem for the animated component
  const tagCloudItems = tags.map((tag) => ({
    tag: tag.tag,
    count: tag.count,
    categories: tag.categories,
  }));

  return (
    <div className={`relative ${minHeight.screen} ${overflow.hidden} ${bgColor.background}`}>
      {/* Ambient background effects */}
      <div className={`pointer-events-none absolute inset-0 -z-10 ${overflow.hidden}`}>
        <div className={`absolute -left-40 -top-40 ${squareSize.heroLg} ${radius.full} ${bgColor['accent/5']} blur-3xl`} />
        <div className={`absolute -bottom-40 -right-40 ${squareSize.heroXl} ${radius.full} ${bgColor['primary/5']} blur-3xl`} />
        <div className={`absolute left-1/2 top-1/3 ${squareSize.hero} -translate-x-1/2 ${radius.full} ${bgColor['muted/30']} blur-3xl`} />
      </div>

      {/* Hero Section */}
      <section className={emptyCard.default} aria-labelledby="tags-title">
        <div className={`container mx-auto ${padding.xDefault} py-20`}>
          <div className={`mx-auto ${maxWidth['3xl']}`}>
            {/* Animated icon */}
            <div className={`${marginBottom.comfortable} flex ${justify.center}`}>
              <div className="relative">
                <div className={`absolute inset-0 animate-pulse ${radius.full} ${bgColor['accent/20']} blur-xl`} />
                <div className={`relative ${radius.full} ${bgGradient.toBR} ${gradientFrom.accent20} ${gradientTo.primary20} ${padding.default} ${backdrop.sm}`}>
                  <Tag className={`${iconSize['3xl']} ${textColor.primary}`} />
                </div>
              </div>
            </div>

            <h1
              id="tags-title"
              className={`${marginBottom.default} ${bgGradient.toR} ${gradientFrom.foreground} ${gradientVia.foreground} ${gradientTo.mutedForeground} bg-clip-text ${weight.bold} ${size['4xl']} ${tracking.tight} ${textColor.transparent} sm:${size['5xl']} md:${size['6xl']}`}
            >
              Explore by Topic
            </h1>

            <p className={`mx-auto ${marginTop.default} ${maxWidth.xl} ${muted.lg}`}>
              Discover{' '}
              <span className={`${weight.semibold} ${textColor.foreground}`}>{tags.length} topics</span>{' '}
              across{' '}
              <span className={`${weight.semibold} ${textColor.foreground}`}>
                {totalItems.toLocaleString()} resources
              </span>
              . Find exactly what you need, organized by what matters to you.
            </p>

            <ul className={`${marginTop.comfortable} flex list-none ${flexWrap.wrap} ${justify.center} ${gap.compact}`}>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Sparkles className={`mr-1.5 ${iconSize.xsPlus}`} />
                  {tags.length} Tags
                </UnifiedBadge>
              </li>
              <li>
                <UnifiedBadge variant="base" style="outline">
                  <Layers className={`mr-1.5 ${iconSize.xsPlus}`} />
                  Community Curated
                </UnifiedBadge>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className={`container mx-auto ${padding.xDefault} pb-16`}>
        {tags.length === 0 ? (
          <Card className={`${bgColor['muted/50']} ${padding.section} text-center`}>
            <Tag className={`mx-auto ${marginBottom.default} ${iconSize['4xl']} ${muted.default}/20`} />
            <p className={muted.lg}>No tags found.</p>
          </Card>
        ) : (
          <div className={spaceY.loose}>
            {/* Featured Tags Section */}
            <section aria-labelledby="featured-tags-title">
              <div className={`${marginBottom.comfortable} ${cluster.default}`}>
                <div className={`${radius.lg} ${bgColor['primary/10']} ${padding.tight}`}>
                  <TrendingUp className={`${iconSize.md} ${textColor.primary}`} />
                </div>
                <div>
                  <h2 id="featured-tags-title" className={`${weight.semibold} ${size.xl}`}>
                    Trending Topics
                  </h2>
                  <p className={muted.sm}>
                    Most popular tags by usage
                  </p>
                </div>
              </div>
              <FeaturedTagsGrid tags={tagCloudItems} />
            </section>

            {/* Interactive Tag Cloud Section */}
            <section aria-labelledby="all-tags-title">
              <div className={`${marginBottom.comfortable} ${cluster.default}`}>
                <div className={`${radius.lg} ${bgColor['accent/10']} ${padding.tight}`}>
                  <Tag className={`${iconSize.md} ${textColor.accent}`} />
                </div>
                <div>
                  <h2 id="all-tags-title" className={`${weight.semibold} ${size.xl}`}>
                    All Topics
                  </h2>
                  <p className={muted.sm}>
                    Explore the full tag cloud — hover and click to discover
                  </p>
                </div>
              </div>

              {/* Animated Tag Cloud */}
              <div className={`relative ${radius['2xl']} border ${borderColor['border/30']} ${bgGradient.toBR} ${gradientFrom.background} ${gradientVia.background} ${gradientTo.muted10} ${padding.relaxed} md:${padding.section}`}>
                {/* Inner glow effect */}
                <div className={`pointer-events-none absolute inset-0 ${radius['2xl']} ${bgGradient.toBR} ${gradientFrom.accent5} ${gradientVia.transparent} ${gradientTo.primary5}`} />

                <AnimatedTagCloud
                  tags={tagCloudItems}
                  maxTags={100}
                  className={`relative ${zLayer.raised} min-h-[400px]`}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
