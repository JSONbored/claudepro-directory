import Link from 'next/link';
import { Suspense, useId } from 'react';
import { ContentSearchClient } from '@/src/components/content/content-search-client';
import { UnifiedBadge } from '@/src/components/core/domain/badges/badge';
import { LazySection } from '@/src/components/core/infra/lazy-section';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/newsletter-capture';
import { Skeleton } from '@/src/components/primitives/feedback/loading-skeleton';
import { Button } from '@/src/components/primitives/ui/button';
import { ROUTES } from '@/src/lib/constants';
import { ExternalLink, HelpCircle } from '@/src/lib/icons';
import type { ContentListServerProps, DisplayableContent } from '@/src/lib/types/component.types';
import { ICON_NAME_MAP, UI_CLASSES } from '@/src/lib/ui-constants';

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
    <section className={UI_CLASSES.CONTAINER_OVERFLOW_BORDER} aria-labelledby={pageTitleId}>
      <div className={'container mx-auto px-4 py-20'}>
        <div className={'mx-auto max-w-3xl text-center'}>
          <div className={'mb-6 flex justify-center'}>
            <div className={'rounded-full bg-accent/10 p-3'} aria-hidden="true">
              {(() => {
                const IconComponent =
                  ICON_NAME_MAP[icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                return <IconComponent className={`${UI_CLASSES.ICON_XL} text-primary`} />;
              })()}
            </div>
          </div>

          <h1 id={pageTitleId} className={UI_CLASSES.TEXT_HEADING_HERO}>
            {title}
          </h1>

          <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>{description}</p>

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
                            className={UI_CLASSES.ICON_XS_LEADING}
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

      <section
        className={'container mx-auto px-4 py-12'}
        aria-label={`${title} content and search`}
      >
        {/* Search Component with Suspense boundary */}
        <Suspense fallback={<ContentSearchSkeleton />}>
          <ContentSearchClient
            items={items}
            type={type}
            category={type}
            searchPlaceholder={searchPlaceholder}
            title={title}
            icon={icon}
          />
        </Suspense>
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) with fade-in animation */}
      <section className={'container mx-auto px-4 py-12'}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <UnifiedNewsletterCapture
              source="content_page"
              variant="hero"
              context="category-page"
              category={type}
            />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
