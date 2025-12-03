import type { Database } from '@heyclaude/database-types';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';

// Handle special cases that don't follow standard pluralization
const SPECIAL_CASES: Record<string, string> = {
  'MCP': 'MCP',
  'MCP Servers': 'MCP Server',
  'Agents': 'Agent',
  'Rules': 'Rule',
  'Commands': 'Command',
  'Hooks': 'Hook',
  'Statuslines': 'Statusline',
  'Skills': 'Skill',
  'Collections': 'Collection',
  'Guides': 'Guide',
  'Jobs': 'Job',
  'Changelog': 'Changelog',
};

/**
 * Produce the singular form of a category title for UI text and aria-labels.
 *
 * Handles a set of predefined irregular or special-case titles (for example,
 * "MCP Servers" -> "MCP Server", "Guides" -> "Guide") and otherwise removes a
 * trailing "s" when present.
 *
 * @param title - The category title to singularize (e.g., "Guides", "Agents")
 * @returns The singular form of `title` (e.g., "Guide", "Agent")
 *
 * @see ContentHeroSection
 */
function singularizeTitle(title: string): string {
  if (SPECIAL_CASES[title]) {
    return SPECIAL_CASES[title];
  }
  
  // Standard pluralization: remove trailing 's'
  if (title.endsWith('s')) {
    return title.slice(0, -1);
  }
  
  return title;
}
import { Bookmark, Copy, ExternalLink, Eye, HelpCircle, Layers } from '@heyclaude/web-runtime/icons';
import {
  cluster,
  iconLeading,
  iconSize,
  emptyCard,
  marginBottom,
  marginTop,
  spaceY,
  muted,
  weight,
  size,
  gap,
  grid,
  padding,
  container,
  marginX,
  width,
  minHeight,
  maxWidth,
  backdrop,
  radius,
  flexWrap,
  overflow,
  tracking,
  bgColor,
  bgGradient,
  gradientFrom,
  gradientVia,
  gradientTo,
  justify,
  textColor,
  squareSize,
  zLayer,
  animate,
  display,
  position,
  absolute,
  bgClip,
  listStyle,
  translate,
  blur,
} from '@heyclaude/web-runtime/design-system';
import type {
  ContentListServerProps,
  DisplayableContent,
} from '@heyclaude/web-runtime/types/component.types';
import { ICON_NAME_MAP } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { Suspense, useId } from 'react';
import { ContentSearchClient } from '@/src/components/content/content-search';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';
import { RecentlyViewedSidebar } from '@/src/components/features/navigation/recently-viewed-sidebar';
import { Skeleton } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  AnimatedStatsRow,
  aggregateContentStats,
  CategoryTagStrip,
} from '@/src/components/features/category';
import { NewContentBadge } from '@/src/components/features/indicators';

type ContentCategory = Database['public']['Enums']['content_category'];

// Categories that support enhanced hero features
const ENHANCED_HERO_CATEGORIES: readonly ContentCategory[] = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
] as const;

/**
 * Determines whether a category opts into enhanced hero features.
 *
 * @param category - Category identifier to test (typically a content type slug)
 * @returns `true` if `category` is included in `ENHANCED_HERO_CATEGORIES` and can be treated as a `ContentCategory`, `false` otherwise.
 *
 * @see ENHANCED_HERO_CATEGORIES
 * @see ContentHeroSection
 */
function isEnhancedCategory(category: string): category is ContentCategory {
  return ENHANCED_HERO_CATEGORIES.includes(category as ContentCategory);
}

/**
 * Render the hero section for a content list page, including title, description, decorative icon, badges, and a submit action.
 *
 * @template T - The shape of each content item used to derive badges and statistics.
 * @param title - Page heading text shown prominently at the top of the hero.
 * @param description - Short descriptive text displayed beneath the title.
 * @param icon - Icon name used for the decorative, animated icon container.
 * @param items - Array of content items used to build default badges, aggregate statistics, and populate tag strips.
 * @param badges - Optional custom badges to display; when empty a default badge set is constructed (category-aware).
 * @param category - Optional content category used to enable enhanced hero features (e.g., dynamic badges, stats, tag strip).
 * @returns The rendered hero section as a JSX element.
 *
 * @see ContentListServer
 * @see UnifiedBadge
 * @see ROUTES.SUBMIT
 */
function ContentHeroSection<T extends DisplayableContent>({
  title,
  description,
  icon,
  items,
  badges = [],
  category,
}: Pick<ContentListServerProps<T>, 'title' | 'description' | 'icon' | 'items' | 'badges'> & {
  category?: string;
}) {
  const pageTitleId = useId();

  // Check if this category supports enhanced features
  const isEnhanced = category && isEnhancedCategory(category);

  // For enhanced categories, we replace "Production Ready" with a dynamic NewContentBadge
  const displayBadges =
    badges.length > 0
      ? badges
      : [
          { icon: 'sparkles', text: `${items.length} ${title} Available` },
          { text: 'Community Driven' },
          // Third badge is rendered separately as NewContentBadge for enhanced categories
          ...(isEnhanced ? [] : [{ text: 'Production Ready' }]),
        ];

  // Aggregate real stats from items (only when enhanced features are enabled)
  const aggregated = isEnhanced
    ? aggregateContentStats(
        items as Array<{
          view_count?: number | null;
          bookmark_count?: number | null;
          copy_count?: number | null;
          use_count?: number | null;
        }>
      )
    : null;

  // Build stats for AnimatedStatsRow (only show if we have meaningful data)
  const hasStats =
    !!aggregated && (aggregated.totalViews > 0 || aggregated.totalBookmarks > 0);
  const stats = hasStats && aggregated
    ? [
        {
          label: title,
          value: items.length,
          icon: <Layers className={iconSize.md} />,
        },
        {
          label: 'Total Views',
          value: aggregated.totalViews,
          icon: <Eye className={iconSize.md} />,
        },
        {
          label: 'Bookmarks',
          value: aggregated.totalBookmarks,
          icon: <Bookmark className={iconSize.md} />,
        },
        ...(aggregated.totalCopies > 100
          ? [
              {
                label: 'Copies',
                value: aggregated.totalCopies,
                icon: <Copy className={iconSize.md} />,
              },
            ]
          : []),
      ]
    : [];

  return (
    <section className={`${position.relative} ${overflow.hidden}`} aria-labelledby={pageTitleId}>
      {/* Ambient background effects */}
      <div className={`pointer-events-none ${absolute.inset} ${zLayer.behind10} ${overflow.hidden}`}>
        <div className={`${position.absolute} -left-40 -top-40 ${squareSize.heroLg} ${radius.full} ${bgColor['accent/5']} ${blur['3xl']}`} />
        <div className={`${position.absolute} -bottom-40 -right-40 ${squareSize.heroXl} ${radius.full} ${bgColor['primary/5']} ${blur['3xl']}`} />
        <div className={`${absolute.centerY} left-1/2 ${squareSize.hero} ${translate.centerX} ${radius.full} ${bgColor['muted/20']} ${blur['3xl']}`} />
      </div>

      <div className={emptyCard.default}>
        <div className={`${container.default} ${padding.xDefault} ${padding.yHero} md:${padding.yLarge}`}>
          <div className={`${marginX.auto} ${maxWidth['4xl']}`}>
            {/* Animated icon container */}
            <div className={`${marginBottom.comfortable} ${display.flex} ${justify.center}`}>
              <div className={position.relative}>
                <div className={`${absolute.inset} ${animate.pulse} ${radius.full} ${bgColor['accent/20']} ${blur.xl}`} />
                <div
                  className={`${position.relative} ${radius.full} ${bgGradient.toBR} ${gradientFrom.accent20} ${gradientTo.primary20} ${padding.default} ${backdrop.sm}`}
                  aria-hidden="true"
                >
                  {(() => {
                    const IconComponent =
                      ICON_NAME_MAP[icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                    return <IconComponent className={`${iconSize.xl} ${textColor.primary}`} />;
                  })()}
                </div>
              </div>
            </div>

            {/* Title with gradient */}
            <h1
              id={pageTitleId}
              className={`${marginBottom.default} ${bgGradient.toR} ${gradientFrom.foreground} ${gradientVia.foreground} ${gradientTo.mutedForeground} ${bgClip.text} ${weight.bold} ${size['4xl']} ${tracking.tight} ${textColor.transparent} sm:${size['5xl']}`}
            >
              {title}
            </h1>

            {/* Description */}
            <p className={`${marginX.auto} ${marginTop.default} ${maxWidth.xl} ${muted.lg}`}>
              {description}
            </p>

            {/* Badges */}
            <ul
              className={`${marginTop.comfortable} ${marginBottom.comfortable} ${display.flex} ${listStyle.none} ${flexWrap.wrap} ${justify.center} ${gap.compact}`}
            >
              {displayBadges.map((badge, idx) => (
                <li key={badge.text || `badge-${idx}`}>
                  <UnifiedBadge variant="base" style={idx === 0 ? 'secondary' : 'outline'}>
                    {badge.icon &&
                      (() => {
                        if (typeof badge.icon === 'string') {
                          const BadgeIconComponent =
                            ICON_NAME_MAP[badge.icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                          return (
                            <BadgeIconComponent className={iconLeading.xs} aria-hidden="true" />
                          );
                        }
                        // Allow pre-constructed ReactNode icons to render as-is
                        return badge.icon;
                      })()}
                    {badge.text}
                  </UnifiedBadge>
                </li>
              ))}
              {/* Dynamic "New" badge for enhanced categories - replaces "Production Ready" */}
              {isEnhanced && (
                <li>
                  <NewContentBadge
                    items={items as Array<{ date_added?: string | null; updated_at?: string | null }>}
                    fallbackText="Production Ready"
                  />
                </li>
              )}
            </ul>

            {/* Submit button */}
            <Button variant="outline" size="sm" asChild={true}>
              <Link
                href={ROUTES.SUBMIT}
                className={cluster.compact}
                aria-label={`Submit a new ${singularizeTitle(title).toLowerCase()}`}
              >
                <ExternalLink className={iconSize.xs} aria-hidden="true" />
                Submit {singularizeTitle(title)}
              </Link>
            </Button>
          </div>

          {/* Enhanced hero features for supported categories */}
          {isEnhanced && (
            <div className={`${marginX.auto} ${maxWidth['4xl']} ${spaceY.loose} ${marginTop.relaxed}`}>
              {/* Animated stats row */}
              {stats.length > 0 && (
                <AnimatedStatsRow
                  stats={stats}
                  category={category}
                  className={`${marginX.auto} ${maxWidth['3xl']}`}
                />
              )}

              {/* Category tag strip */}
              <CategoryTagStrip
                items={items}
                category={category}
                maxTags={8}
                className={`${marginX.auto} ${maxWidth['2xl']}`}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton placeholder UI shown while the content search client is loading.
 *
 * Renders a large primary skeleton followed by two smaller skeletons aligned to the end,
 * matching the layout used by the content search header.
 *
 * @returns A JSX element containing the search-area skeleton placeholders.
 *
 * @see ContentSearchClient
 * @see ContentListServer
 */
function ContentSearchSkeleton() {
  return (
    <div className={`${width.full} ${spaceY.comfortable}`}>
      <Skeleton size="xl" width="3xl" />
      <div className={`${display.flex} ${justify.end} ${gap.compact}`}>
        <Skeleton size="lg" width="sm" />
        <Skeleton size="lg" width="xs" />
      </div>
    </div>
  );
}

/**
 * Renders a full content list page including a server-rendered hero, search area, sidebar, and newsletter CTA.
 *
 * This is a server component: the hero section is rendered on the server immediately, while interactive parts
 * (search client and recently viewed sidebar) are loaded inside Suspense boundaries on the client.
 *
 * @param title - Page title displayed in the hero and passed to search
 * @param description - Short descriptive text shown below the title
 * @param icon - Icon name used for the hero decorative icon
 * @param items - Array of content items to display and to seed search zero-state suggestions
 * @param type - Content type identifier used for search and newsletter categorization
 * @param searchPlaceholder - Placeholder text for the search input (defaults to `Search ${title.toLowerCase()}...`)
 * @param badges - Optional badges to show in the hero; when omitted a default badge set is derived from `items` and `title`
 * @param category - Optional category filter forwarded to the search client
 *
 * @returns The React element composing the content list page
 *
 * @see ContentHeroSection
 * @see ContentSearchClient
 * @see RecentlyViewedSidebar
 * @see NewsletterCTAVariant
 */
export function ContentListServer<T extends DisplayableContent>({
  title,
  description,
  icon,
  items,
  type,
  searchPlaceholder = `Search ${title.toLowerCase()}...`,
  badges = [],
  category,
}: ContentListServerProps<T>) {
  return (
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      {/* Hero Section - Rendered immediately on server */}
      <ContentHeroSection
        title={title}
        description={description}
        icon={icon}
        items={items}
        badges={badges}
        category={category ?? type}
      />

      <section className={`${container.default} ${padding.xDefault} ${padding.ySection}`} aria-label={`${title} content and search`}>
        <div className={`${grid.search} ${gap.loose}`}>
          <div>
            <Suspense fallback={<ContentSearchSkeleton />}>
              <ContentSearchClient
                items={items}
                type={type}
                {...(category && { category })}
                searchPlaceholder={searchPlaceholder}
                title={title}
                icon={icon}
                zeroStateSuggestions={items.slice(0, 6)}
              />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <RecentlyViewedSidebar />
          </Suspense>
        </div>
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) with fade-in animation */}
      <section className={`${container.default} ${padding.xDefault} ${padding.ySection}`}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <NewsletterCTAVariant source="content_page" variant="hero" category={type} />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}