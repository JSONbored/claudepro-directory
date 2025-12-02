import type { Database } from '@heyclaude/database-types';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
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
  padding,
  minHeight,
  maxWidth,
  backdrop,
  radius,
  flexWrap,
  overflow,
  tracking,
  bgColor,
  justify,
  textColor,
  squareSize,
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

function isEnhancedCategory(category: string): category is ContentCategory {
  return ENHANCED_HERO_CATEGORIES.includes(category as ContentCategory);
}

/**
 * Renders the hero section for a content list page including title, description, icon, badges, and a submit action.
 *
 * @template T - The content item shape used to compute badge defaults.
 * @param props.title - Page title shown as the main heading.
 * @param props.description - Short descriptive text shown under the heading.
 * @param props.icon - Name of the icon to display in the decorative icon area.
 * @param props.items - Array of content items; used to derive default badges (e.g., item count).
 * @param props.badges - Optional custom badges to display; if empty, a default set is shown.
 * @param props.category - The content category for themed styling and tag extraction.
 * @returns The hero section JSX element for the content list page.
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

  // Aggregate real stats from items (safely cast to expected shape)
  const aggregated = aggregateContentStats(
    items as Array<{
      view_count?: number | null;
      bookmark_count?: number | null;
      copy_count?: number | null;
      use_count?: number | null;
    }>
  );

  // Build stats for AnimatedStatsRow (only show if we have meaningful data)
  const hasStats = aggregated.totalViews > 0 || aggregated.totalBookmarks > 0;
  const stats = hasStats
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
    <section className={`relative ${overflow.hidden}`} aria-labelledby={pageTitleId}>
      {/* Ambient background effects */}
      <div className={`pointer-events-none absolute inset-0 -z-10 ${overflow.hidden}`}>
        <div className={`absolute -left-40 -top-40 ${squareSize.heroLg} ${radius.full} ${bgColor['accent/5']} blur-3xl`} />
        <div className={`absolute -bottom-40 -right-40 ${squareSize.heroXl} ${radius.full} ${bgColor['primary/5']} blur-3xl`} />
        <div className={`absolute left-1/2 top-1/3 ${squareSize.hero} -translate-x-1/2 ${radius.full} ${bgColor['muted/20']} blur-3xl`} />
      </div>

      <div className={emptyCard.default}>
        <div className={`container mx-auto ${padding.xDefault} ${padding.yHero} md:py-20`}>
          <div className={`mx-auto ${maxWidth['4xl']}`}>
            {/* Animated icon container */}
            <div className={`${marginBottom.comfortable} flex ${justify.center}`}>
              <div className="relative">
                <div className={`absolute inset-0 animate-pulse ${radius.full} ${bgColor['accent/20']} blur-xl`} />
                <div
                  className={`relative ${radius.full} bg-gradient-to-br from-accent/20 to-primary/20 ${padding.default} ${backdrop.sm}`}
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
              className={`${marginBottom.default} bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text ${weight.bold} ${size['4xl']} ${tracking.tight} ${textColor.transparent} sm:${size['5xl']}`}
            >
              {title}
            </h1>

            {/* Description */}
            <p className={`mx-auto ${marginTop.default} ${maxWidth.xl} ${muted.lg}`}>
              {description}
            </p>

            {/* Badges */}
            <ul
              className={`${marginTop.comfortable} ${marginBottom.comfortable} flex list-none ${flexWrap.wrap} ${justify.center} ${gap.compact}`}
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
                        return null;
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
                aria-label={`Submit a new ${title.slice(0, -1).toLowerCase()}`}
              >
                <ExternalLink className={iconSize.xs} aria-hidden="true" />
                Submit {title.slice(0, -1)}
              </Link>
            </Button>
          </div>

          {/* Enhanced hero features for supported categories */}
          {isEnhanced && (
            <div className={`mx-auto ${maxWidth['4xl']} ${spaceY.loose} ${marginTop.relaxed}`}>
              {/* Animated stats row */}
              {stats.length > 0 && (
                <AnimatedStatsRow
                  stats={stats}
                  category={category}
                  className={`mx-auto ${maxWidth['3xl']}`}
                />
              )}

              {/* Category tag strip */}
              <CategoryTagStrip
                items={items}
                category={category}
                maxTags={8}
                className={`mx-auto ${maxWidth['2xl']}`}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ContentSearchSkeleton() {
  return (
    <div className={`w-full ${spaceY.comfortable}`}>
      <Skeleton size="xl" width="3xl" />
      <div className={`flex ${justify.end} ${gap.compact}`}>
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

      <section className={`container mx-auto ${padding.xDefault} ${padding.ySection}`} aria-label={`${title} content and search`}>
        <div className={`grid ${gap.loose} xl:grid-cols-[minmax(0,1fr)_18rem]`}>
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
      <section className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <NewsletterCTAVariant source="content_page" variant="hero" category={type} />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
