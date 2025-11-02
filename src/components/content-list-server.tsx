import Link from 'next/link';
import { Suspense, useId } from 'react';
import { ContentSearchClient } from '@/src/components/content-search-client';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import { LazySection } from '@/src/components/infra/lazy-section';
import { Button } from '@/src/components/primitives/button';
import { Skeleton } from '@/src/components/primitives/loading-skeleton';
import { ROUTES } from '@/src/lib/constants/routes';
import { ExternalLink, HelpCircle } from '@/src/lib/icons';
import type { ContentItem, ContentListServerProps } from '@/src/lib/schemas/component.schema';
import { ICON_NAME_MAP, UI_CLASSES } from '@/src/lib/ui-constants';

function ContentHeroSection<T extends ContentItem>({
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
                return <IconComponent className="h-8 w-8 text-primary" />;
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
                        return <BadgeIconComponent className="mr-1 h-3 w-3" aria-hidden="true" />;
                      }
                      const BadgeIcon = badge.icon;
                      return <BadgeIcon className="mr-1 h-3 w-3" aria-hidden="true" />;
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
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
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

export function ContentListServer<T extends ContentItem>({
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
