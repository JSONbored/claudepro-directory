import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ExternalLink, HelpCircle } from '@heyclaude/web-runtime/icons';
import { cluster, iconLeading, iconSize, emptyCard } from '@heyclaude/web-runtime/design-system';
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

/**
 * Renders the hero section for a content list page including title, description, icon, badges, and a submit action.
 *
 * @template T - The content item shape used to compute badge defaults.
 * @param props.title - Page title shown as the main heading.
 * @param props.description - Short descriptive text shown under the heading.
 * @param props.icon - Name of the icon to display in the decorative icon area.
 * @param props.items - Array of content items; used to derive default badges (e.g., item count).
 * @param props.badges - Optional custom badges to display; if empty, a default set is shown.
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
}: Pick<ContentListServerProps<T>, 'title' | 'description' | 'icon' | 'items' | 'badges'>) {
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
    <section className={emptyCard.default} aria-labelledby={pageTitleId}>
      <div className={'container mx-auto px-4 py-20'}>
        <div className={'mx-auto max-w-3xl text-center'}>
          <div className={'mb-6 flex justify-center'}>
            <div className={'rounded-full bg-accent/10 p-3'} aria-hidden="true">
              {(() => {
                const IconComponent =
                  ICON_NAME_MAP[icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                return <IconComponent className={`${iconSize.xl} text-primary`} />;
              })()}
            </div>
          </div>

          <h1 id={pageTitleId} className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl">
            {title}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">{description}</p>

          <ul className={'mb-8 flex list-none flex-wrap justify-center gap-2'}>
            {displayBadges.map((badge, idx) => (
              <li key={badge.text || `badge-${idx}`}>
                <UnifiedBadge variant="base" style={idx === 0 ? 'secondary' : 'outline'}>
                  {badge.icon &&
                    (() => {
                      if (typeof badge.icon === 'string') {
                        const BadgeIconComponent =
                          ICON_NAME_MAP[badge.icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                        return (
                          <BadgeIconComponent
                            className={iconLeading.xs}
                            aria-hidden="true"
                          />
                        );
                      }
                      return null;
                    })()}
                  {badge.text}
                </UnifiedBadge>
              </li>
            ))}
          </ul>

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
      </div>
    </section>
  );
}

function ContentSearchSkeleton() {
  return (
    <div className={'w-full space-y-4'}>
      <Skeleton size="xl" width="3xl" />
      <div className={'flex justify-end gap-2'}>
        <Skeleton size="lg" width="sm" />
        <Skeleton size="lg" width="xs" />
      </div>
    </div>
  );
}

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
    <div className={'min-h-screen bg-background'}>
      {/* Hero Section - Rendered immediately on server */}
      <ContentHeroSection
        title={title}
        description={description}
        icon={icon}
        items={items}
        badges={badges}
      />

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

      {/* Email CTA - Footer section (matching homepage pattern) with fade-in animation */}
      <section className={'container mx-auto px-4 py-12'}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <NewsletterCTAVariant source="content_page" variant="hero" category={type} />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}