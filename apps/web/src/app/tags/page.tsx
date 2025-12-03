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
 * - SEO optimized metadata
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
  paddingBottom,
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
  border,
  flexWrap,
  overflow,
  tracking,
  squareSize,
  container,
  marginX,
  marginRight,
  textAlign,
  animate,
  display,
  position,
  absolute,
  pointerEvents,
  bgClip,
  listStyle,
  blur,
  translate,
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

/**
 * Server-rendered page that displays a browsable tags index with a hero, featured tags, and an interactive tag cloud.
 *
 * Fetches tag summaries from the backend and renders counts and visual components; if fetching fails the page logs the error and renders an empty state.
 *
 * @returns The rendered tags index page as JSX.
 *
 * @see getAllTagsWithCounts
 * @see AnimatedTagCloud
 * @see FeaturedTagsGrid
 */
export default async function TagsIndexPage() {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'TagsIndexPage',
    route: '/tags',
    module: 'apps/web/src/app/tags/page',
  });

  let tags: TagSummary[] = [];
  let hadLoadError = false;

  try {
    tags = await getAllTagsWithCounts({ minCount: 1, limit: 500 });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load tags');
    reqLogger.error('TagsIndexPage: getAllTagsWithCounts failed', normalized);
    hadLoadError = true;
    // Continue with empty tags - show error state
  }

  const totalItems = tags.reduce((sum, tag) => sum + tag.count, 0);

  // Transform TagSummary to TagCloudItem for the animated component
  const tagCloudItems = tags.map((tag) => ({
    tag: tag.tag,
    count: tag.count,
    categories: tag.categories,
  }));

  return (
    <div className={`${position.relative} ${minHeight.screen} ${overflow.hidden} ${bgColor.background}`}>
      {/* Ambient background effects */}
      <div className={`${pointerEvents.none} ${absolute.inset} ${zLayer.behind10} ${overflow.hidden}`}>
        <div className={`${position.absolute} -left-40 -top-40 ${squareSize.heroLg} ${radius.full} ${bgColor['accent/5']} ${blur['3xl']}`} />
        <div className={`${position.absolute} -bottom-40 -right-40 ${squareSize.heroXl} ${radius.full} ${bgColor['primary/5']} ${blur['3xl']}`} />
        <div className={`${absolute.centerY} left-1/2 ${squareSize.hero} ${translate.centerX} ${radius.full} ${bgColor['muted/30']} ${blur['3xl']}`} />
      </div>

      {/* Hero Section */}
      <section className={emptyCard.default} aria-labelledby="tags-title">
        <div className={`${container.default} ${padding.xDefault} ${padding.yLarge}`}>
          <div className={`${marginX.auto} ${maxWidth['3xl']}`}>
            {/* Animated icon */}
            <div className={`${marginBottom.comfortable} ${display.flex} ${justify.center}`}>
              <div className={position.relative}>
                <div className={`${absolute.inset} ${animate.pulse} ${radius.full} ${bgColor['accent/20']} ${blur.xl}`} />
                <div className={`${position.relative} ${radius.full} ${bgGradient.toBR} ${gradientFrom.accent20} ${gradientTo.primary20} ${padding.default} ${backdrop.sm}`}>
                  <Tag className={`${iconSize['3xl']} ${textColor.primary}`} />
                </div>
              </div>
            </div>

            <h1
              id="tags-title"
              className={`${marginBottom.default} ${bgGradient.toR} ${gradientFrom.foreground} ${gradientVia.foreground} ${gradientTo.mutedForeground} ${bgClip.text} ${weight.bold} ${size['4xl']} ${tracking.tight} ${textColor.transparent} sm:${size['5xl']} md:${size['6xl']}`}
            >
              Explore by Topic
            </h1>

            <p className={`${marginX.auto} ${marginTop.default} ${maxWidth.xl} ${muted.lg}`}>
              Discover{' '}
              <span className={`${weight.semibold} ${textColor.foreground}`}>{tags.length} topics</span>{' '}
              across{' '}
              <span className={`${weight.semibold} ${textColor.foreground}`}>
                {totalItems.toLocaleString()} resources
              </span>
              . Find exactly what you need, organized by what matters to you.
            </p>

            <ul className={`${marginTop.comfortable} ${display.flex} ${listStyle.none} ${flexWrap.wrap} ${justify.center} ${gap.compact}`}>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Sparkles className={`${marginRight.snug} ${iconSize.xsPlus}`} />
                  {tags.length} Tags
                </UnifiedBadge>
              </li>
              <li>
                <UnifiedBadge variant="base" style="outline">
                  <Layers className={`${marginRight.snug} ${iconSize.xsPlus}`} />
                  Community Curated
                </UnifiedBadge>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className={`${container.default} ${padding.xDefault} ${paddingBottom.hero}`}>
        {hadLoadError ? (
          <Card className={`${bgColor['muted/50']} ${padding.section} ${textAlign.center}`}>
            <Tag className={`${marginX.auto} ${marginBottom.default} ${iconSize['4xl']} ${muted.default}/20`} />
            <p className={muted.lg}>We couldn't load tags, please try again.</p>
          </Card>
        ) : (tags.length === 0 ? (
          <Card className={`${bgColor['muted/50']} ${padding.section} ${textAlign.center}`}>
            <Tag className={`${marginX.auto} ${marginBottom.default} ${iconSize['4xl']} ${muted.default}/20`} />
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
              <div className={`${position.relative} ${radius['2xl']} ${border.default} ${borderColor['border/30']} ${bgGradient.toBR} ${gradientFrom.background} ${gradientVia.background} ${gradientTo.muted10} ${padding.relaxed} md:${padding.section}`}>
                {/* Inner glow effect */}
                <div className={`${pointerEvents.none} ${absolute.inset} ${radius['2xl']} ${bgGradient.toBR} ${gradientFrom.accent5} ${gradientVia.transparent} ${gradientTo.primary5}`} />

                <AnimatedTagCloud
                  tags={tagCloudItems}
                  maxTags={100}
                  className={`${position.relative} ${zLayer.raised} ${minHeight.lg}`}
                />
              </div>
            </section>
          </div>
        ))}
      </div>
    </div>
  );
}