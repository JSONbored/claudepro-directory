import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ExternalLink, HelpCircle } from '@heyclaude/web-runtime/icons';
import {
  type ContentListServerProps,
  type DisplayableContent,
} from '@heyclaude/web-runtime/types/component.types';
import {
  ICON_NAME_MAP,
  UI_CLASSES,
  UnifiedBadge,
  Skeleton,
  Button,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { Suspense, useId } from 'react';

import { ContentSearchClient } from '@/src/components/content/content-search';
import { RecentlyViewedSidebar } from '@/src/components/features/navigation/recently-viewed-sidebar';

/**
 * Renders the hero section for a content list page, showing an icon, title, description, badges, and a submit CTA.
 *
 * When `badges` is empty, a default badge set is shown: a count badge using `items.length` and `title`, plus
 * "Community Driven" and "Production Ready" badges.
 *
 * @param title - The title displayed as the hero heading.
 * @param description - The descriptive text shown under the title.
 * @param icon - The key of the icon to render in the hero; falls back to a generic icon if not found.
 * @param items - The content items used to derive the default badge count when `badges` is not provided.
 * @param badges - Optional list of badges to display; each badge may include `icon` and `text`.
 * @returns The hero section JSX element.
 *
 * @see ContentListServer
 * @see UnifiedBadge
 */
function ContentHeroSection<T extends DisplayableContent>({
  title,
  description,
  icon,
  items,
  badges = [],
}: Pick<ContentListServerProps<T>, 'badges' | 'description' | 'icon' | 'items' | 'title'>) {
  const pageTitleId = useId();
  const displayBadges =
    badges.length > 0
      ? badges
      : [
          { icon: 'sparkles', text: `${items.length} ${title} Available` },
          { text: 'Community Driven' },
          { text: 'Production Ready' },
        ];

  return (
    <section className={UI_CLASSES.CONTAINER_OVERFLOW_BORDER} aria-labelledby={pageTitleId}>
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-accent/10 rounded-full p-3" aria-hidden="true">
              {(() => {
                const IconComponent = ICON_NAME_MAP[icon] || HelpCircle;
                return <IconComponent className={`${UI_CLASSES.ICON_XL} text-primary`} />;
              })()}
            </div>
          </div>

          <h1 id={pageTitleId} className={UI_CLASSES.TEXT_HEADING_HERO}>
            {title}
          </h1>

          <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>{description}</p>

          <ul className="mb-8 flex list-none flex-wrap justify-center gap-2">
            {displayBadges.map((badge, idx) => (
              <li key={badge.text || `badge-${idx}`}>
                <UnifiedBadge variant="base" style={idx === 0 ? 'secondary' : 'outline'}>
                  {badge.icon
                    ? (() => {
                        if (typeof badge.icon === 'string') {
                          const BadgeIconComponent = ICON_NAME_MAP[badge.icon] || HelpCircle;
                          return (
                            <BadgeIconComponent
                              className={UI_CLASSES.ICON_XS_LEADING}
                              aria-hidden="true"
                            />
                          );
                        }
                        return null;
                      })()
                    : null}
                  {badge.text}
                </UnifiedBadge>
              </li>
            ))}
          </ul>

          <Button variant="outline" size="sm" asChild>
            <Link
              href={ROUTES.SUBMIT}
              className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
              aria-label={`Submit a new ${title.slice(0, -1).toLowerCase()}`}
            >
              <ExternalLink className={UI_CLASSES.ICON_XS} aria-hidden="true" />
              Submit {title.slice(0, -1)}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton layout shown while the content search results are loading.
 *
 * Renders a vertical skeleton with a large placeholder and two smaller skeletons aligned to the end.
 *
 * @returns A JSX element representing the loading skeleton for the content search area.
 *
 * @see Skeleton
 * @see ContentListServer
 */
export function ContentSearchSkeleton() {
  return (
    <div className="w-full space-y-4">
      <Skeleton size="xl" width="3xl" />
      <div className="flex justify-end gap-2">
        <Skeleton size="lg" width="sm" />
        <Skeleton size="lg" width="xs" />
      </div>
    </div>
  );
}

/**
 * Render a content list page with an optional hero, a searchable content list, and a recently viewed sidebar.
 *
 * Renders the hero on the server by default; pass `skipHero` to omit the hero (useful for partial page rendering or progressive hydration). The central area contains a search client with zero-state suggestions derived from `items` and a right-hand recently viewed sidebar rendered inside a Suspense boundary.
 *
 * @param title - Page title displayed in the hero and used to form a default search placeholder
 * @param description - Short description shown under the title in the hero
 * @param icon - Icon name used by the hero and search client; falls back to a default if unresolved
 * @param items - Array of displayable content items presented to the search client and used for zero-state suggestions
 * @param type - Content type identifier passed to the search client
 * @param searchPlaceholder - Placeholder text for the search input; defaults to `Search ${title.toLowerCase()}...`
 * @param badges - Optional badge definitions shown in the hero; if empty, the hero will construct default badges
 * @param category - Optional category filter passed to the search client
 * @param skipHero - When true, the hero section is not rendered on the server (enables PPR/partial rendering scenarios)
 * @returns A JSX element representing the full content list page (hero, searchable list, and recently viewed sidebar)
 *
 * @see ContentHeroSection
 * @see ContentSearchClient
 * @see RecentlyViewedSidebar
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
  skipHero = false,
}: ContentListServerProps<T> & { skipHero?: boolean }) {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section - Rendered immediately on server (unless skipped for PPR) */}
      {!skipHero && (
        <ContentHeroSection
          title={title}
          description={description}
          icon={icon}
          items={items}
          badges={badges}
        />
      )}

      <section className="container mx-auto px-4 py-12" aria-label={`${title} content and search`}>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
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

    </div>
  );
}